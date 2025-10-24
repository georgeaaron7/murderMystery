# Migration to File-Based Storage & Team System

## ✅ Changes Completed

### Backend (server.js)
- **Removed MongoDB dependency** - No more connection issues!
- **Added file-based storage** using JSON files (see `file-storage.js`)
- **Team registration system**:
  - POST `/register-team` - Register a new team (1-3 members)
  - GET `/team?teamId=...` - Get team details
- **Updated endpoints** to use `teamId` instead of `participantId`:
  - GET `/history?teamId=...&suspectId=...`
  - GET `/notes?teamId=...&suspectId=...`
  - POST `/notes` (with teamId)
- **Socket.io events** updated to use `teamId`

### Storage System (file-storage.js)
- Auto-creates `data/` directory structure:
  ```
  data/
    teams/       → Team registration info
    chats/       → Chat history per team-suspect pair
    notes/       → Notes per team-suspect pair
  ```
- Handles 200-300 participants easily
- No external dependencies needed!

### Frontend Updates

#### New Components:
- **TeamRegistration.jsx** - Beautiful registration form
- **TeamRegistration.css** - Matching your app's style

#### Updated Components:
- **App.jsx** - Added registration flow, uses `teamId`
- **ChatWindow.jsx** - Uses `teamId` instead of `participantId`
- **NotesPanel.jsx** - Uses `teamId` instead of `participantId`
- **api.js** - Updated all endpoints for `teamId`

---

## 🚀 How to Run

### 1. Start the backend server:
```bash
cd webpage
node server.js
```

### 2. Start the frontend (in a new terminal):
```bash
cd webpage/detective_web_page
npm run dev
```

---

## 📝 User Flow

1. **Registration** - Team enters member names & roll numbers
2. **Team ID assigned** - Automatic unique ID (e.g., TEAM_001)
3. **Landing page** - Story introduction
4. **Detective board** - Select suspects to interrogate
5. **Chat & investigate** - All team members share the same investigation

---

## 💾 Data Storage

- **Teams**: `data/teams/TEAM_001.json`
- **Chats**: `data/chats/TEAM_001_suspectA.json`
- **Notes**: `data/notes/TEAM_001_suspectA.json`

Data persists across server restarts!

---

## 🔧 No Changes Needed for vLLM

Your vast.ai GPU setup remains the same:
- vLLM server runs on GPU (vast.ai)
- Backend server (Express) runs on CPU (your machine/server)
- They communicate via HTTP API (already working!)

---

## ✨ Benefits

✅ **No MongoDB** - No connection errors, no external DB needed  
✅ **Team collaboration** - All members share investigation progress  
✅ **Scales easily** - Handles 200-300 participants over 6 hours  
✅ **Simple debugging** - Just open JSON files to inspect data  
✅ **Conversation memory** - Last 5 messages automatically included in vLLM context  
✅ **Beautiful UI** - Registration page matches your app's style  

---

## 🎨 Frontend Changes

The registration page uses the same dark theme with smooth animations:
- Gradient background matching your landing page
- Smooth transitions and hover effects
- Mobile responsive
- Error handling with user-friendly messages

---

## 🐛 Testing

1. Open http://localhost:5173 (or your Vite dev server)
2. You'll see the registration page first
3. Register a team (1-3 members)
4. You'll receive a Team ID and proceed to the investigation
5. Team ID is stored in localStorage, so you can refresh without losing progress

---

## 📦 What's NOT changed

- vLLM integration (still works the same)
- Agent socket system (still works)
- UI/UX of chat, board, landing page
- System prompts for suspects
- All existing features work exactly as before!

---

## Need Help?

If you encounter any issues, check:
1. Is the backend server running? (`node server.js`)
2. Is the frontend dev server running? (`npm run dev`)
3. Check browser console for errors
4. Check `data/` folder to see if files are being created
