const fs = require('fs').promises;
const path = require('path');

// Base data directory
const DATA_DIR = path.join(__dirname, 'data');
const TEAMS_DIR = path.join(DATA_DIR, 'teams');
const CHATS_DIR = path.join(DATA_DIR, 'chats');
const NOTES_DIR = path.join(DATA_DIR, 'notes');

// Ensure directories exist
async function initializeStorage() {
	try {
		await fs.mkdir(DATA_DIR, { recursive: true });
		await fs.mkdir(TEAMS_DIR, { recursive: true });
		await fs.mkdir(CHATS_DIR, { recursive: true });
		await fs.mkdir(NOTES_DIR, { recursive: true });
		console.log('✅ File storage initialized');
	} catch (err) {
		console.error('Error initializing storage:', err);
	}
}

// Helper: Read JSON file
async function readJSON(filePath) {
	try {
		const data = await fs.readFile(filePath, 'utf8');
		return JSON.parse(data);
	} catch (err) {
		if (err.code === 'ENOENT') return null; // File doesn't exist
		throw err;
	}
}

// Helper: Write JSON file
async function writeJSON(filePath, data) {
	await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Generate unique team ID
async function generateTeamId() {
	const files = await fs.readdir(TEAMS_DIR);
	const teamNumbers = files
		.filter(f => f.startsWith('TEAM_') && f.endsWith('.json'))
		.map(f => parseInt(f.replace('TEAM_', '').replace('.json', '')))
		.filter(n => !isNaN(n));
	
	const maxNumber = teamNumbers.length > 0 ? Math.max(...teamNumbers) : 0;
	const newNumber = maxNumber + 1;
	return `TEAM_${String(newNumber).padStart(3, '0')}`;
}

// TEAM OPERATIONS

async function createTeam(members) {
	const teamId = await generateTeamId();
	const teamData = {
		teamId,
		members,
		createdAt: new Date().toISOString()
	};
	
	const filePath = path.join(TEAMS_DIR, `${teamId}.json`);
	await writeJSON(filePath, teamData);
	return teamData;
}

async function getTeam(teamId) {
	const filePath = path.join(TEAMS_DIR, `${teamId}.json`);
	return await readJSON(filePath);
}

async function getAllTeams() {
	const files = await fs.readdir(TEAMS_DIR);
	const teams = [];
	
	for (const file of files) {
		if (file.endsWith('.json')) {
			const teamData = await readJSON(path.join(TEAMS_DIR, file));
			if (teamData) teams.push(teamData);
		}
	}
	
	return teams;
}

// CHAT HISTORY OPERATIONS

async function getChatHistory(teamId, suspectId) {
	const filePath = path.join(CHATS_DIR, `${teamId}_${suspectId}.json`);
	const data = await readJSON(filePath);
	
	if (!data) {
		return {
			teamId,
			suspectId,
			messages: []
		};
	}
	
	return data;
}

async function saveChatHistory(teamId, suspectId, messages) {
	const filePath = path.join(CHATS_DIR, `${teamId}_${suspectId}.json`);
	const data = {
		teamId,
		suspectId,
		messages,
		updatedAt: new Date().toISOString()
	};
	
	await writeJSON(filePath, data);
	return data;
}

async function appendChatMessage(teamId, suspectId, message) {
	const chat = await getChatHistory(teamId, suspectId);
	chat.messages.push({
		...message,
		timestamp: message.timestamp || new Date().toISOString()
	});
	
	return await saveChatHistory(teamId, suspectId, chat.messages);
}

// NOTES OPERATIONS

async function getNotes(teamId, suspectId) {
	const filePath = path.join(NOTES_DIR, `${teamId}_${suspectId}.json`);
	const data = await readJSON(filePath);
	
	if (!data) {
		return {
			teamId,
			suspectId,
			notes: [],
			connections: []
		};
	}
	
	return data;
}

async function saveNotes(teamId, suspectId, notes, connections) {
	const filePath = path.join(NOTES_DIR, `${teamId}_${suspectId}.json`);
	const data = {
		teamId,
		suspectId,
		notes: notes || [],
		connections: connections || [],
		updatedAt: new Date().toISOString()
	};
	
	await writeJSON(filePath, data);
	return data;
}

module.exports = {
	initializeStorage,
	createTeam,
	getTeam,
	getAllTeams,
	getChatHistory,
	saveChatHistory,
	appendChatMessage,
	getNotes,
	saveNotes
};
