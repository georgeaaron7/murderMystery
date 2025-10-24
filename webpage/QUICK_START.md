# 🚀 Quick Start - New Team-Based System

## What Changed?

### ✅ MongoDB → JSON Files
- No more database connection issues!
- Data stored in simple JSON files
- Works perfectly for 200-300 participants

### ✅ Individual → Team-Based
- Teams of 1-3 members
- Shared investigation progress
- Auto-assigned team IDs (TEAM_001, TEAM_002, etc.)

---

## Start the App

### Terminal 1 - Backend:
```bash
cd webpage
node server.js
```

### Terminal 2 - Frontend:
```bash
cd webpage/detective_web_page
npm run dev
```

Then open: **http://localhost:5173**

---

## First Time Use

1. You'll see a **Team Registration** page
2. Add 1-3 team members (name + roll number)
3. Click "Start Investigation"
4. You'll get a unique **Team ID** (automatically saved)
5. Proceed to the investigation!

---

## Files Created

✅ `file-storage.js` - Handles all JSON storage  
✅ `TeamRegistration.jsx` - Registration component  
✅ `TeamRegistration.css` - Styling  
✅ `data/` folder - Auto-created for storage  

## Files Updated

✅ `server.js` - Removed MongoDB, added team endpoints  
✅ `App.jsx` - Added registration flow  
✅ `ChatWindow.jsx` - Uses teamId  
✅ `NotesPanel.jsx` - Uses teamId  
✅ `api.js` - Updated API endpoints  

---

## Your vLLM Setup

**NO CHANGES NEEDED!** 🎉

Your vast.ai GPU server still works exactly the same:
- Backend makes HTTP requests to vLLM
- vLLM generates responses
- Everything else is the same

---

## Questions?

Check `MIGRATION_README.md` for detailed information!
