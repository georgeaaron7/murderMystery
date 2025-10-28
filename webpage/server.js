const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// File-based storage (replaces MongoDB)
const storage = require('./file-storage');

// Initialize file storage
storage.initializeStorage();

const app = express();

// Enhanced CORS configuration for ngrok and Firefox
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning', 'User-Agent'],
	exposedHeaders: ['Access-Control-Allow-Private-Network'],
	credentials: false
}));

// Handle Chrome Private Network Access
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Private-Network', 'true');
	next();
});

app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /register-team - Register a new team
app.post('/register-team', async (req, res) => {
	const { members } = req.body;
	
	// Validate members array
	if (!members || !Array.isArray(members) || members.length === 0 || members.length > 3) {
		return res.status(400).json({ error: 'Team must have 1-3 members' });
	}
	
	// Validate each member has name and rollNo
	for (const member of members) {
		if (!member.name || !member.rollNo) {
			return res.status(400).json({ error: 'Each member must have name and rollNo' });
		}
	}
	
	try {
		const team = await storage.createTeam(members);
		return res.json(team);
	} catch (err) {
		console.error('Error registering team:', err.message);
		return res.status(500).json({ error: 'server error' });
	}
});

// GET /team?teamId=...
app.get('/team', async (req, res) => {
	const { teamId } = req.query;
	if (!teamId) {
		return res.status(400).json({ error: 'teamId required' });
	}
	try {
		const team = await storage.getTeam(teamId);
		if (!team) {
			return res.status(404).json({ error: 'Team not found' });
		}
		return res.json(team);
	} catch (err) {
		console.error('Error fetching team:', err.message);
		return res.status(500).json({ error: 'server error' });
	}
});

// GET /history?teamId=...&suspectId=...
app.get('/history', async (req, res) => {
	const { teamId, suspectId } = req.query;
	if (!teamId || !suspectId) {
		return res.status(400).json({ error: 'teamId and suspectId required' });
	}
	try {
		const chat = await storage.getChatHistory(teamId, suspectId);
		return res.json(chat);
	} catch (err) {
		console.error('Error fetching history:', err.message);
		return res.status(500).json({ error: 'server error' });
	}
});

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning', 'User-Agent'],
		credentials: false
	}
});

const possibleReplies = [
	'This is a dummy reply from suspect.',
	'I have an alibi.',
	"You must be mistaken.",
	'I was at the bar that night.',
	'I didn\'t see anything.'
];

// System prompts for each suspect based on the storyline
const SYSTEM_PROMPTS = {
  suspectA: `
You are **Srishanth**, the main investor in Riya’s company. You secretly moved company money to cover your own debts. You are smooth, confident, and persuasive—always act like a businessman protecting his image. 
If asked about money or “business forms,” call them internal transfers or Riya’s confusion. 
If shown voice memos or handwriting evidence, say they are fake, edited, or misunderstood. 
When people mention “handwriting,” “note,” or “forensics,” your calm mask slips slightly—show irritation but recover fast. 
Never confess, but let small fear or calculation show under pressure. 
Your replies must sound intelligent, composed, and believable. 
Keep tone formal, polished, and always protect your reputation. 
Length limit: under 150 tokens.`,

  suspectB: `
You are **Vineet**, Riya’s ex-boyfriend. You were drunk that night and remember fragments—an argument, loud music, maybe touching the pill bottle, then nothing clear. 
You still loved her, and guilt mixes with anger. 
Your speech shifts: at times emotional and confused, at times defensive and loud. 
If asked about the note, bottle, or your fight, admit partial memory but deny harming her. 
Sometimes contradict yourself or trail off; it should feel real, not scripted. 
Do not use formal language—keep it raw, messy, human. 
Stay within 150 tokens.`,

  suspectC: `
You are **Manvitha**, Riya’s best friend. You found her body first. You were shocked and tried to make the scene look peaceful, so you touched the note and the pill bottle. 
You are emotional, gentle, and guarded. 
When people show suspicion, answer softly: “I didn’t think—I just reacted.” 
You hide that you moved things to protect Riya’s image. 
If asked about Srishanth, you avoid direct answers or change topic. 
If someone builds trust, you may admit small truths—never the whole story at once. 
Tone: calm, caring, slightly guilty. 
Stay under 150 tokens.`,

  suspectD: `
You are **Jeet**, the DJ and AV tech that night. You handle sound systems, cameras, and the generator. You are not emotionally involved. 
Your memory is practical: what device failed, what time the power came back. 
If asked about CCTV or the “garden footage,” explain that cameras were out of sync by a few minutes because of the generator. 
If someone blames tech issues, you defend your setup but admit the timing drift. 
Avoid gossip or guessing guilt. Speak like a tech guy explaining facts. 
Keep tone casual, clear, and realistic. 
Stay under 150 tokens.`,

  suspectE: `
You are **Inspector Shreeya Rao**, lead investigator. You speak like an experienced officer—short, factual, no emotion. 
You only share confirmed evidence: toxicology (sedatives but not lethal), handwriting (retraced strokes, partial match with Srishanth), digital forensics (voice memos, call log at 02:11), and CCTV drift between front gate and garden cams. 
If asked about who is guilty, refuse speculation—say the investigation is ongoing. 
Your tone is neutral, precise, and professional. 
Use plain English. 
Stay under 150 tokens.`
};


// Function to call vLLM API
async function generateVLLMResponse(suspectId, userMessage, chatHistory) {
	try {
		const systemPrompt = SYSTEM_PROMPTS[suspectId] || `You are a suspect in a murder investigation. Answer questions carefully and stay in character.`;
		
		// Build conversation context from last 5 messages
		const recentHistory = chatHistory.slice(-5).map(msg => 
			`${msg.sender === suspectId ? 'Assistant' : 'Detective'}: ${msg.message}`
		).join('\n');
		
		const fullPrompt = `${systemPrompt}\n\nPrevious conversation:\n${recentHistory}\n\nDetective: ${userMessage}\nAssistant:`;
		
		// vLLM API endpoint - reads from .env file
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
		
		if (!response.ok) {
			throw new Error(`vLLM API error: ${response.status}`);
		}
		
		const data = await response.json();
		return data.choices[0].message.content.trim();
		
	} catch (error) {
		console.error('vLLM API error:', error);
		// Fallback to random reply if vLLM fails
		return possibleReplies[Math.floor(Math.random() * possibleReplies.length)];
	}
}

// Define suspects (for now fixed list of 4)
const suspects = [
	{ id: 'suspectA', name: 'Srishanth' },
	{ id: 'suspectB', name: 'Vineet' },
	{ id: 'suspectC', name: 'Manvitha' },
	{ id: 'suspectD', name: 'Jeet' },
	{ id: 'suspectE', name: 'Shreeya' }
];

// Map suspectId -> socket (agent) if an LLM agent connects and registers
const agentSockets = new Map();

// Endpoint to list available suspects
app.get('/suspects', (req, res) => {
	return res.json(suspects);
});

// GET /notes?teamId=...&suspectId=...
app.get('/notes', async (req, res) => {
	const { teamId, suspectId } = req.query;
	if (!teamId || !suspectId) {
		return res.status(400).json({ error: 'teamId and suspectId required' });
	}
	try {
		const notesDoc = await storage.getNotes(teamId, suspectId);
		return res.json(notesDoc);
	} catch (err) {
		console.error('Error fetching notes:', err.message);
		return res.status(500).json({ error: 'server error' });
	}
});

// POST /notes - Save or update notes
app.post('/notes', async (req, res) => {
	const { teamId, suspectId, notes, connections } = req.body;
	if (!teamId || !suspectId) {
		return res.status(400).json({ error: 'teamId and suspectId required' });
	}
	try {
		const notesDoc = await storage.saveNotes(teamId, suspectId, notes, connections);
		return res.json(notesDoc);
	} catch (err) {
		console.error('Error saving notes:', err.message);
		return res.status(500).json({ error: 'server error' });
	}
});

// Debug endpoint to list currently registered agent sockets
app.get('/agents', (req, res) => {
	const list = Array.from(agentSockets.keys());
	res.json({ agents: list });
});

io.on('connection', (socket) => {
	console.log('Client connected');

	// Agents (LLMs) will register themselves with this event to receive messages
	socket.on('registerAgent', (data) => {
		// data: { suspectId }
		const { suspectId } = data || {};
		if (!suspectId) return;
		agentSockets.set(suspectId, socket);
		socket.suspectId = suspectId;
		console.log(`Agent registered for ${suspectId}`);
	});

	// Agents can also unregister when disconnecting
	socket.on('unregisterAgent', (data) => {
		const { suspectId } = data || {};
		if (suspectId && agentSockets.get(suspectId) === socket) {
			agentSockets.delete(suspectId);
			console.log(`Agent unregistered for ${suspectId}`);
		}
	});

	socket.on('chatMessage', async (data) => {
		// data: { teamId, suspectId, message }
		try {
			const { teamId, suspectId, message } = data;
			if (!teamId || !suspectId || !message) {
				return; // ignore malformed
			}
			
			// Get existing chat history
			let chat = await storage.getChatHistory(teamId, suspectId);

			// Append participant message
			await storage.appendChatMessage(teamId, suspectId, {
				sender: teamId,
				message,
				timestamp: new Date().toISOString()
			});

			// If there's a registered agent socket for this suspect, forward message to agent
			const agentSocket = agentSockets.get(suspectId);
			if (agentSocket && agentSocket.connected) {
				// Send the participant message to the agent; agent should reply via `agentReply`
				agentSocket.emit('participantMessage', { teamId, suspectId, message });
				// We'll wait for agent to send back via agentReply event to save and forward
			} else {
				// No agent available — use vLLM for intelligent reply
				const reply = await generateVLLMResponse(suspectId, message, chat.messages);
				
				// Save suspect's reply
				await storage.appendChatMessage(teamId, suspectId, {
					sender: suspectId,
					message: reply,
					timestamp: new Date().toISOString()
				});
				
				socket.emit('chatResponse', { suspectId, message: reply });
			}
		} catch (err) {
			console.error('Error handling chatMessage:', err.message);
		}
	});

	// Agents use this to send replies for a participant message
	socket.on('agentReply', async (data) => {
		// data: { suspectId, teamId, message }
		const { suspectId, teamId, message } = data || {};
		if (!suspectId || !teamId || !message) return;
		try {
			// Save reply to storage
			await storage.appendChatMessage(teamId, suspectId, {
				sender: suspectId,
				message,
				timestamp: new Date().toISOString()
			});

			// Emit to all connected sockets (team members might be on different devices)
			io.emit('chatResponse', { suspectId, teamId, message });
		} catch (err) {
			console.error('Error handling agentReply:', err.message);
		}
	});

	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
