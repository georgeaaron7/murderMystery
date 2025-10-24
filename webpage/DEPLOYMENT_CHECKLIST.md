# ✅ Deployment Checklist

## 📋 Pre-Deployment

### 1. Test vLLM Server Connection
```bash
cd /Users/aarongeorge/Desktop/Desktop/NITW/ECES/TZ-25/webpage
./test_vllm.sh
```
**Expected:** ✅ SUCCESS! vLLM server is responding correctly!

### 2. Verify .env Configuration
```bash
cat .env
```
**Should contain:**
```
VLLM_ENDPOINT=http://218.50.74.140:40026/v1/chat/completions
PORT=5000
MODEL_NAME=microsoft/DialoGPT-medium
```

### 3. Test Backend Locally
```bash
node server.js
```
**Expected output:**
```
✅ File storage initialized
Server listening on port 5000
```

### 4. Test Frontend Locally
```bash
cd detective_web_page
npm run dev
```
**Open:** http://localhost:5173
**Expected:** Team registration page appears

---

## 🌐 Deployment Steps

### Step 1: Expose Backend (Choose One)

**Option A: Using Ngrok (Recommended for Testing)**
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Run ngrok
ngrok http 5000

# Copy the HTTPS URL
# Example: https://abc123.ngrok.io
```

**Option B: Deploy to Railway (Recommended for Production)**
```bash
cd webpage
railway login
railway init
railway up

# Get the URL
railway open
```

### Step 2: Configure Frontend Environment

**Create/Update:** `detective_web_page/.env`
```bash
VITE_API_URL=https://abc123.ngrok.io
# or
VITE_API_URL=https://your-app.railway.app
```

### Step 3: Push to GitHub
```bash
git add .
git commit -m "Production ready - JSON storage + team system"
git push origin main
```

### Step 4: Configure Vercel

1. Go to https://vercel.com/dashboard
2. Click "Import Project"
3. Select your GitHub repository
4. **Important Settings:**
   - **Root Directory:** `webpage/detective_web_page`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables:**
   - Key: `VITE_API_URL`
   - Value: `https://abc123.ngrok.io` (your backend URL)
6. Click "Deploy"

### Step 5: Start Backend
```bash
cd webpage
node server.js
```

**Keep this running!** (Or deploy to Railway)

---

## 🧪 Testing After Deployment

### 1. Open Vercel URL
Go to: `https://your-app.vercel.app`

### 2. Test Team Registration
- Add 1-3 team members
- Click "Start Investigation"
- Should receive Team ID (e.g., TEAM_001)

### 3. Test Chat
- Select a suspect (e.g., Srishanth)
- Send a message
- Wait for AI response (~2-5 seconds)

### 4. Test Notes
- Click "Notes" button in chat
- Add a note
- Should save automatically

### 5. Test Data Persistence
- Refresh the page
- Select same suspect
- Chat history should still be there

---

## 🔍 Troubleshooting

### ❌ Frontend shows "Connection Error"
**Check:**
1. Is backend running? (`node server.js`)
2. Is ngrok running? (`ngrok http 5000`)
3. Does Vercel env variable match ngrok URL?

**Fix:**
```bash
# Update Vercel environment variable
# Settings → Environment Variables → VITE_API_URL
# Redeploy after changing env vars
```

### ❌ Chat not getting AI responses
**Check:**
1. Backend logs show: `🔄 Calling vLLM at: ...`
2. vLLM server is accessible: `./test_vllm.sh`
3. No error in backend console

**Fix:**
```bash
# Test vLLM manually
curl -X POST http://218.50.74.140:40026/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"microsoft/DialoGPT-medium","messages":[{"role":"user","content":"test"}],"max_tokens":50}'
```

### ❌ WebSocket connection failing
**Check:**
1. CORS is enabled in `server.js` (Line 85-88)
2. Ngrok supports WebSocket (it does by default)
3. No firewall blocking WebSocket

**Fix:**
```javascript
// In server.js, ensure:
cors: {
    origin: '*',
    methods: ['GET', 'POST']
}
```

### ❌ Data not persisting
**Check:**
1. `data/` folder exists in webpage directory
2. Backend has write permissions
3. No errors in backend console

**Fix:**
```bash
# Check if data folder exists
ls -la webpage/data

# If not, backend will create it automatically
# Just restart: node server.js
```

---

## 📊 Monitoring During Event

### Backend Logs to Watch:
```
✅ File storage initialized                    ← Good
Server listening on port 5000                  ← Good
Client connected                               ← User connected
🔄 Calling vLLM at: http://...                ← API call
✅ Notes saved to database                     ← Data saved
Agent registered for suspectA                  ← Agent connected (if using)
```

### Error Messages to Watch:
```
❌ vLLM API error: 500                         ← vLLM server issue
❌ Error fetching history: ...                 ← Backend issue
❌ Failed to fetch notes                       ← Storage issue
```

---

## 🎯 Pre-Event Checklist (Day Of)

**1 Hour Before:**
- [ ] Start vast.ai instance
- [ ] Test vLLM endpoint: `./test_vllm.sh`
- [ ] Start backend: `node server.js`
- [ ] Start ngrok: `ngrok http 5000`
- [ ] Update Vercel env if ngrok URL changed
- [ ] Test full user flow on Vercel URL
- [ ] Check backend logs are clean
- [ ] Have backup laptop ready

**During Event:**
- [ ] Monitor backend logs
- [ ] Check vLLM responses are working
- [ ] Watch for error patterns
- [ ] Keep laptop plugged in and awake
- [ ] Have mobile hotspot ready (backup internet)

**After Event:**
- [ ] Backup data/ folder to cloud
- [ ] Export teams list: `ls data/teams/`
- [ ] Save logs for analysis
- [ ] Stop ngrok and backend

---

## 🆘 Emergency Contacts

**If vLLM fails:**
- Fallback responses will be used automatically
- Check vast.ai instance status
- Restart vLLM server if needed

**If backend crashes:**
- Data is safe in JSON files
- Restart: `node server.js`
- All chat history will be restored

**If frontend fails:**
- Redeploy on Vercel
- Check build logs
- Verify environment variables

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Team registration works
2. ✅ Users get team IDs
3. ✅ Chat responses are contextual (not dummy)
4. ✅ Notes save and persist
5. ✅ Chat history loads on refresh
6. ✅ Backend logs show vLLM calls
7. ✅ No error messages in console

---

## 📚 Quick Reference

**Backend URL:** http://localhost:5000 (or ngrok URL)
**Frontend URL:** https://your-app.vercel.app
**vLLM Endpoint:** http://218.50.74.140:40026/v1/chat/completions

**Documentation:**
- Architecture: `ARCHITECTURE.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
- Quick Start: `QUICK_START.md`
- Migration: `MIGRATION_README.md`

---

Good luck with your event! 🎉
