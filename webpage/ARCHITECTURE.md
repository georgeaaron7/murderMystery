# 🏗️ System Architecture - Your Detective Game

## 📊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                                  │
│                     (Anywhere in the world)                             │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (React + Vite)                      │   │
│  │                  Hosted on: Vercel (CDN)                        │   │
│  │                                                                  │   │
│  │  Components:                                                     │   │
│  │  • TeamRegistration.jsx  ← New registration page               │   │
│  │  • LandingPage.jsx       ← Story intro                          │   │
│  │  • DetectiveBoard.jsx    ← Suspect selection                    │   │
│  │  • ChatWindow.jsx        ← Interrogation chat                   │   │
│  │  • NotesPanel.jsx        ← Evidence notes                       │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             ↓ HTTP/WebSocket                           │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ API Calls via VITE_API_URL
                              ↓ (e.g., https://abc123.ngrok.io)
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    YOUR LAPTOP (or Cloud Server)                        │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    BACKEND (Node.js + Express)                  │   │
│  │                    File: server.js (Port 5000)                  │   │
│  │                                                                  │   │
│  │  Endpoints:                                                      │   │
│  │  • POST /register-team    ← Create team & assign ID            │   │
│  │  • GET  /team             ← Get team info                       │   │
│  │  • GET  /suspects         ← List all suspects                   │   │
│  │  • GET  /history          ← Load chat history                   │   │
│  │  • GET  /notes            ← Load notes                          │   │
│  │  • POST /notes            ← Save notes                          │   │
│  │                                                                  │   │
│  │  Socket.io Events:                                              │   │
│  │  • chatMessage      ← User sends message                        │   │
│  │  • chatResponse     ← AI/Agent replies                          │   │
│  │  • registerAgent    ← LLM agent connects                        │   │
│  │  • agentReply       ← Agent sends reply                         │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              FILE STORAGE (file-storage.js)                     │   │
│  │                                                                  │   │
│  │  data/                                                           │   │
│  │  ├── teams/                                                      │   │
│  │  │   ├── TEAM_001.json   ← Team info (names, roll nos)         │   │
│  │  │   ├── TEAM_002.json                                          │   │
│  │  │   └── TEAM_XXX.json                                          │   │
│  │  │                                                               │   │
│  │  ├── chats/                                                      │   │
│  │  │   ├── TEAM_001_suspectA.json  ← Chat with Srishanth         │   │
│  │  │   ├── TEAM_001_suspectB.json  ← Chat with Vineet            │   │
│  │  │   └── ...                                                     │   │
│  │  │                                                               │   │
│  │  └── notes/                                                      │   │
│  │      ├── TEAM_001_suspectA.json  ← Notes on Srishanth          │   │
│  │      ├── TEAM_001_suspectB.json  ← Notes on Vineet             │   │
│  │      └── ...                                                     │   │
│  │                                                                  │   │
│  │  💾 All data persists across server restarts!                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ When user sends chat message
                              ↓
                              ↓ Function: generateVLLMResponse()
                              ↓ (Line 117 in server.js)
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         VAST.AI GPU SERVER                              │
│                    IP: 218.50.74.140:40026                              │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                     vLLM INFERENCE SERVER                       │   │
│  │                                                                  │   │
│  │  Endpoint: /v1/chat/completions                                 │   │
│  │  Model: microsoft/DialoGPT-medium (or your model)              │   │
│  │                                                                  │   │
│  │  Receives:                                                       │   │
│  │  {                                                               │   │
│  │    "model": "microsoft/DialoGPT-medium",                        │   │
│  │    "messages": [                                                 │   │
│  │      {                                                           │   │
│  │        "role": "user",                                           │   │
│  │        "content": "You are Srishanth... [SYSTEM PROMPT]         │   │
│  │                   \n\nPrevious conversation:                     │   │
│  │                   \n[LAST 5 MESSAGES]                            │   │
│  │                   \n\nDetective: [USER MESSAGE]                 │   │
│  │                   \nAssistant:"                                  │   │
│  │      }                                                           │   │
│  │    ],                                                            │   │
│  │    "max_tokens": 150,                                            │   │
│  │    "temperature": 0.7,                                           │   │
│  │    "top_p": 0.9                                                  │   │
│  │  }                                                               │   │
│  │                                                                  │   │
│  │  Returns:                                                        │   │
│  │  {                                                               │   │
│  │    "choices": [                                                  │   │
│  │      {                                                           │   │
│  │        "message": {                                              │   │
│  │          "content": "I was merely reviewing accounts..."        │   │
│  │        }                                                         │   │
│  │      }                                                           │   │
│  │    ]                                                             │   │
│  │  }                                                               │   │
│  │                                                                  │   │
│  │  🧠 This is where AI magic happens!                             │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ AI Response
                              ↓
                    (Returns to Backend)
                              ↓
                    (Saves to JSON file)
                              ↓
                    (Sends to Frontend via Socket.io)
                              ↓
                    (User sees response in chat)


═══════════════════════════════════════════════════════════════════════════

🔄 REQUEST FLOW EXAMPLE:

1. User types: "Where were you on the night of the murder?"
2. Frontend → Socket.io → Backend (chatMessage event)
3. Backend loads last 5 messages from: data/chats/TEAM_001_suspectA.json
4. Backend builds prompt:
   ```
   You are Srishanth, a charismatic investor...
   
   Previous conversation:
   Detective: Did you know about the pill bottle?
   Assistant: I'm not sure what you're referring to...
   Detective: The bottle found at the scene.
   Assistant: Many people touched things that night...
   
   Detective: Where were you on the night of the murder?
   Assistant:
   ```
5. Backend → HTTP POST → vLLM Server (218.50.74.140:40026)
6. vLLM processes prompt with AI model
7. vLLM returns: "I was at the office, reviewing quarterly reports..."
8. Backend saves response to: data/chats/TEAM_001_suspectA.json
9. Backend → Socket.io → Frontend (chatResponse event)
10. User sees AI response in chat window

═══════════════════════════════════════════════════════════════════════════

🎯 KEY POINTS:

✅ Frontend is STATIC (Vercel) - No server needed
✅ Backend is DYNAMIC (Your laptop/cloud) - Needs to be running
✅ vLLM is STATELESS (Vast.ai GPU) - Just processes requests
✅ Data is PERSISTED (JSON files) - Survives restarts

✅ NO MongoDB - No external database needed
✅ Team-based - All members share same data
✅ Scalable - Handles 200-300 participants easily
✅ Memory-enabled - Last 5 messages in context

═══════════════════════════════════════════════════════════════════════════
