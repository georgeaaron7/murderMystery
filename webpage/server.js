const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const ChatHistory = require('./models/ChatHistory');
const Notes = require('./models/Notes');

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /history?participantId=...&suspectId=...
app.get('/history', async (req, res) => {
	const { participantId, suspectId } = req.query;
	if (!participantId || !suspectId) {
		return res.status(400).json({ error: 'participantId and suspectId required' });
	}
	try {
		const chat = await ChatHistory.findOne({ participantId, suspectId });
		if (!chat) return res.json({ participantId, suspectId, messages: [] });
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
		methods: ['GET', 'POST']
	}
});

const possibleReplies = [
	'This is a dummy reply from suspect.',
	'I have an alibi.',
	"You must be mistaken.",
	'I was at the bar that night.',
	'I didn\'t see anything.'
];

// Define suspects (for now fixed list of 4)
const suspects = [
	{ id: 'suspectA', name: 'Mr. Black' },
	{ id: 'suspectB', name: 'Ms. Scarlet' },
	{ id: 'suspectC', name: 'Prof. Plum' },
	{ id: 'suspectD', name: 'Colonel Mustard' }
];

// Map suspectId -> socket (agent) if an LLM agent connects and registers
const agentSockets = new Map();

// Endpoint to list available suspects
app.get('/suspects', (req, res) => {
	return res.json(suspects);
});

// GET /notes?participantId=...&suspectId=...
app.get('/notes', async (req, res) => {
	const { participantId, suspectId } = req.query;
	if (!participantId || !suspectId) {
		return res.status(400).json({ error: 'participantId and suspectId required' });
	}
	try {
		const notesDoc = await Notes.findOne({ participantId, suspectId });
		if (!notesDoc) {
			return res.json({ participantId, suspectId, notes: [], connections: [] });
		}
		return res.json(notesDoc);
	} catch (err) {
		console.error('Error fetching notes:', err.message);
		return res.status(500).json({ error: 'server error' });
	}
});

// POST /notes - Save or update notes
app.post('/notes', async (req, res) => {
	const { participantId, suspectId, notes, connections } = req.body;
	if (!participantId || !suspectId) {
		return res.status(400).json({ error: 'participantId and suspectId required' });
	}
	try {
		// Upsert: update if exists, create if not
		const notesDoc = await Notes.findOneAndUpdate(
			{ participantId, suspectId },
			{ 
				notes: notes || [], 
				connections: connections || [],
				updatedAt: new Date()
			},
			{ upsert: true, new: true }
		);
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
		// data: { participantId, suspectId, message }
		try {
			const { participantId, suspectId, message } = data;
			if (!participantId || !suspectId || !message) {
				return; // ignore malformed
			}
			// Find existing chat document or create new
			let chat = await ChatHistory.findOne({ participantId, suspectId });
			if (!chat) {
				chat = new ChatHistory({ participantId, suspectId, messages: [] });
			}

			// Append participant message
			chat.messages.push({ sender: participantId, message, timestamp: new Date() });

			// If there's a registered agent socket for this suspect, forward message to agent
			const agentSocket = agentSockets.get(suspectId);
			if (agentSocket && agentSocket.connected) {
				// Persist the participant message before waiting for agent reply
				await chat.save();
				// Send the participant message to the agent; agent should reply via `agentReply`
				agentSocket.emit('participantMessage', { participantId, suspectId, message });
				// We'll wait for agent to send back via agentReply event to save and forward
			} else {
				// No agent available — fallback to random reply and save
				const reply = possibleReplies[Math.floor(Math.random() * possibleReplies.length)];
				chat.messages.push({ sender: suspectId, message: reply, timestamp: new Date() });
				await chat.save();
				socket.emit('chatResponse', { suspectId, message: reply });
			}
		} catch (err) {
			console.error('Error handling chatMessage:', err.message);
		}
	});

	// Agents use this to send replies for a participant message
	socket.on('agentReply', async (data) => {
		// data: { suspectId, participantId, message }
		const { suspectId, participantId, message } = data || {};
		if (!suspectId || !participantId || !message) return;
		try {
			// Save reply to DB and forward to participant sockets (we only have requesting socket)
			let chat = await ChatHistory.findOne({ participantId, suspectId });
			if (!chat) {
				chat = new ChatHistory({ participantId, suspectId, messages: [] });
			}
			chat.messages.push({ sender: suspectId, message, timestamp: new Date() });
			await chat.save();

			// Try to find the participant socket to forward to — simplistic: emit to all connected sockets except agents
			// In a production app you'd track participant sockets by id/room. For now, emit to the origin socket if it exists via participantId channel
			io.emit('chatResponse', { suspectId, participantId, message });
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
