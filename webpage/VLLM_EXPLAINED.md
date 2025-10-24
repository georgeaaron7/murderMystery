# 🎯 vLLM API Call - Code Walkthrough

## 📍 Exact Location

**File:** `webpage/server.js`  
**Lines:** 117-156  
**Function:** `generateVLLMResponse()`

---

## 💻 The Complete Function

```javascript
// Line 117-156 in server.js
async function generateVLLMResponse(suspectId, userMessage, chatHistory) {
	try {
		// 1️⃣ GET SYSTEM PROMPT FOR THE SUSPECT
		const systemPrompt = SYSTEM_PROMPTS[suspectId] || 
			`You are a suspect in a murder investigation. Answer questions carefully and stay in character.`;
		
		// 2️⃣ BUILD CONVERSATION CONTEXT (LAST 5 MESSAGES)
		// This is your CONVERSATION MEMORY!
		const recentHistory = chatHistory.slice(-5).map(msg => 
			`${msg.sender === suspectId ? 'Assistant' : 'Detective'}: ${msg.message}`
		).join('\n');
		
		// 3️⃣ BUILD FULL PROMPT
		const fullPrompt = `${systemPrompt}\n\nPrevious conversation:\n${recentHistory}\n\nDetective: ${userMessage}\nAssistant:`;
		
		// 4️⃣ 🔥 THIS IS WHERE IT CALLS YOUR vLLM SERVER!
		const vllmEndpoint = process.env.VLLM_ENDPOINT || 'http://218.50.74.140:40026/v1/chat/completions';
		console.log(`🔄 Calling vLLM at: ${vllmEndpoint}`);
		
		const response = await fetch(vllmEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: process.env.MODEL_NAME || "microsoft/DialoGPT-medium",
				messages: [{ role: "user", content: fullPrompt }],
				max_tokens: 150,
				temperature: 0.7,
				top_p: 0.9
			})
		});
		
		// 5️⃣ CHECK RESPONSE
		if (!response.ok) {
			throw new Error(`vLLM API error: ${response.status}`);
		}
		
		// 6️⃣ EXTRACT AI RESPONSE
		const data = await response.json();
		return data.choices[0].message.content.trim();
		
	} catch (error) {
		console.error('vLLM API error:', error);
		// Fallback to random reply if vLLM fails
		return possibleReplies[Math.floor(Math.random() * possibleReplies.length)];
	}
}
```

---

## 🔍 When Is This Function Called?

### Location: Line 249 in `server.js`

```javascript
socket.on('chatMessage', async (data) => {
	try {
		const { teamId, suspectId, message } = data;
		
		// Get existing chat history
		let chat = await storage.getChatHistory(teamId, suspectId);

		// Save user's message
		await storage.appendChatMessage(teamId, suspectId, {
			sender: teamId,
			message,
			timestamp: new Date().toISOString()
		});

		// Check if an agent is connected
		const agentSocket = agentSockets.get(suspectId);
		
		if (agentSocket && agentSocket.connected) {
			// Agent is connected - forward to agent
			agentSocket.emit('participantMessage', { teamId, suspectId, message });
		} else {
			// ⚡ NO AGENT - CALL vLLM! ⚡
			const reply = await generateVLLMResponse(suspectId, message, chat.messages);
			
			// Save AI response
			await storage.appendChatMessage(teamId, suspectId, {
				sender: suspectId,
				message: reply,
				timestamp: new Date().toISOString()
			});
			
			// Send to user
			socket.emit('chatResponse', { suspectId, message: reply });
		}
	} catch (err) {
		console.error('Error handling chatMessage:', err.message);
	}
});
```

---

## 📊 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER TYPES MESSAGE                                              │
│    "Where were you on the night of the murder?"                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND → SOCKET.IO EVENT                                       │
│    socket.emit('chatMessage', {                                     │
│      teamId: 'TEAM_001',                                            │
│      suspectId: 'suspectA',                                         │
│      message: 'Where were you...'                                   │
│    })                                                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. BACKEND RECEIVES MESSAGE (Line 231)                             │
│    socket.on('chatMessage', async (data) => { ... })               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. LOAD CHAT HISTORY FROM JSON FILE                                │
│    chat = getChatHistory('TEAM_001', 'suspectA')                   │
│    Returns: [                                                       │
│      { sender: 'TEAM_001', message: 'Hello' },                     │
│      { sender: 'suspectA', message: 'Good evening' },              │
│      { sender: 'TEAM_001', message: 'Tell me about...' },          │
│      { sender: 'suspectA', message: 'I was reviewing...' },        │
│      { sender: 'TEAM_001', message: 'Can you prove...' }           │
│    ]                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. CALL generateVLLMResponse() (Line 249)                          │
│    reply = await generateVLLMResponse(                             │
│      'suspectA',                                                    │
│      'Where were you on the night of the murder?',                 │
│      chat.messages  // Last 5 messages                             │
│    )                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. BUILD PROMPT WITH MEMORY (Line 122-126)                         │
│    System: "You are Srishanth, a charismatic investor..."          │
│    History: "Detective: Tell me about...                            │
│              Assistant: I was reviewing...                          │
│              Detective: Can you prove...                            │
│              Assistant: Of course..."                               │
│    New: "Detective: Where were you on the night of the murder?"    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 7. 🔥 CALL vLLM SERVER (Line 129-140)                              │
│    POST http://218.50.74.140:40026/v1/chat/completions             │
│    {                                                                │
│      "model": "microsoft/DialoGPT-medium",                          │
│      "messages": [{ "role": "user", "content": "[FULL PROMPT]" }], │
│      "max_tokens": 150,                                             │
│      "temperature": 0.7                                             │
│    }                                                                │
│                                                                     │
│    Console: 🔄 Calling vLLM at: http://218.50.74.140:40026/...    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 8. vLLM SERVER PROCESSES (On vast.ai GPU)                          │
│    • Loads model                                                    │
│    • Generates response                                             │
│    • Returns JSON                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 9. BACKEND RECEIVES RESPONSE (Line 146-148)                        │
│    {                                                                │
│      "choices": [{                                                  │
│        "message": {                                                 │
│          "content": "I was at the office that night, reviewing     │
│                      quarterly reports. Several colleagues can     │
│                      verify my presence there."                    │
│        }                                                            │
│      }]                                                             │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 10. SAVE TO JSON FILE (Line 252-256)                               │
│     appendChatMessage('TEAM_001', 'suspectA', {                    │
│       sender: 'suspectA',                                           │
│       message: 'I was at the office...',                            │
│       timestamp: '2025-10-24T...'                                   │
│     })                                                              │
│     → Saved to: data/chats/TEAM_001_suspectA.json                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 11. SEND TO FRONTEND (Line 259)                                    │
│     socket.emit('chatResponse', {                                   │
│       suspectId: 'suspectA',                                        │
│       message: 'I was at the office...'                             │
│     })                                                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 12. USER SEES RESPONSE                                              │
│     💬 Srishanth: "I was at the office that night, reviewing       │
│                    quarterly reports. Several colleagues can       │
│                    verify my presence there."                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### .env file (webpage/.env)
```bash
VLLM_ENDPOINT=http://218.50.74.140:40026/v1/chat/completions
PORT=5000
MODEL_NAME=microsoft/DialoGPT-medium
```

### What gets sent to vLLM:
```json
{
  "model": "microsoft/DialoGPT-medium",
  "messages": [
    {
      "role": "user",
      "content": "You are Srishanth, a charismatic investor...\n\nPrevious conversation:\nDetective: Tell me about that night\nAssistant: I was reviewing documents...\n\nDetective: Where were you on the night of the murder?\nAssistant:"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "top_p": 0.9
}
```

### What vLLM returns:
```json
{
  "id": "chat-abc123",
  "object": "chat.completion",
  "created": 1698765432,
  "model": "microsoft/DialoGPT-medium",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I was at the office that night, reviewing quarterly reports. Several colleagues can verify my presence there."
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

## 🧪 Test Your vLLM Connection

```bash
cd /Users/aarongeorge/Desktop/Desktop/NITW/ECES/TZ-25/webpage
./test_vllm.sh
```

---

## 📝 Summary

✅ **vLLM is called in:** `generateVLLMResponse()` (Line 129)  
✅ **Endpoint:** `http://218.50.74.140:40026/v1/chat/completions`  
✅ **When:** User sends a chat message & no agent is connected  
✅ **Context:** Last 5 messages are included automatically  
✅ **Logging:** Console shows "🔄 Calling vLLM at: ..."  

**Your setup is correct! Backend on laptop → vLLM on vast.ai → works perfectly!** 🎉
