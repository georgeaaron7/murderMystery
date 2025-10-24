# 🚀 Deployment Guide - Vercel Frontend + Local Backend

## 📋 Your Setup

```
┌─────────────────────┐
│   Vercel (Frontend) │  ← Users access this
│   detective_web_page│
└──────────┬──────────┘
           │ HTTP/WebSocket
           ↓
┌─────────────────────┐
│ Your Laptop (Backend)│  ← Runs on your laptop
│   server.js (Port 5000)│
└──────────┬──────────┘
           │ HTTP API
           ↓
┌─────────────────────┐
│  Vast.ai GPU Server │  ← vLLM inference
│  218.50.74.140:40026 │
└─────────────────────┘
```

---

## 🔍 **Where vLLM API is Called**

### Location: `webpage/server.js` (Lines 117-156)

```javascript
async function generateVLLMResponse(suspectId, userMessage, chatHistory) {
    // 1. Gets system prompt for the suspect
    const systemPrompt = SYSTEM_PROMPTS[suspectId];
    
    // 2. Takes last 5 messages for context (CONVERSATION MEMORY!)
    const recentHistory = chatHistory.slice(-5).map(msg => 
        `${msg.sender === suspectId ? 'Assistant' : 'Detective'}: ${msg.message}`
    ).join('\n');
    
    // 3. Builds the full prompt with context
    const fullPrompt = `${systemPrompt}\n\nPrevious conversation:\n${recentHistory}\n\nDetective: ${userMessage}\nAssistant:`;
    
    // 4. 🎯 THIS IS WHERE IT HITS YOUR vLLM SERVER
    const vllmEndpoint = process.env.VLLM_ENDPOINT || 'http://218.50.74.140:40026/v1/chat/completions';
    
    const response = await fetch(vllmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: process.env.MODEL_NAME || "microsoft/DialoGPT-medium",
            messages: [{ role: "user", content: fullPrompt }],
            max_tokens: 150,
            temperature: 0.7,
            top_p: 0.9
        })
    });
    
    // 5. Returns the AI response
    const data = await response.json();
    return data.choices[0].message.content.trim();
}
```

### 📍 When is this called?
- **Line 249** in `server.js` when handling `chatMessage` socket event
- Only called if no agent is connected (fallback to vLLM)

---

## ⚙️ **Configuration (.env file)**

Your `.env` file now contains:

```bash
# vLLM Endpoint - Your vast.ai server
VLLM_ENDPOINT=http://218.50.74.140:40026/v1/chat/completions

# Server Port
PORT=5000

# Model name for vLLM
MODEL_NAME=microsoft/DialoGPT-medium
```

**Note:** The endpoint is now correctly set to `http://218.50.74.140:40026/v1/chat/completions`

---

## 🌐 **Deployment Steps**

### **Step 1: Update Frontend API Base URL**

You need to tell your Vercel frontend where your laptop backend is running.

**Option A: Using Ngrok (Recommended for testing)**

1. Install ngrok: `brew install ngrok` (macOS)
2. Run ngrok: `ngrok http 5000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update your frontend `.env` file:

```bash
# In webpage/detective_web_page/.env
VITE_API_URL=https://abc123.ngrok.io
```

**Option B: Public IP (if your laptop has one)**

```bash
# In webpage/detective_web_page/.env
VITE_API_URL=http://YOUR_LAPTOP_PUBLIC_IP:5000
```

**Option C: Deploy Backend to Cloud (Production)**

Deploy `server.js` to:
- Heroku
- Railway
- DigitalOcean
- AWS EC2

Then use that URL:
```bash
VITE_API_URL=https://your-backend.herokuapp.com
```

---

### **Step 2: Push to GitHub**

```bash
# From your project root
git add .
git commit -m "Migrated to JSON storage + team system"
git push origin main
```

---

### **Step 3: Configure Vercel**

1. Go to Vercel dashboard
2. Import your GitHub repository
3. **Set Root Directory** to: `webpage/detective_web_page`
4. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://abc123.ngrok.io` (or your backend URL)
5. Deploy!

---

### **Step 4: Run Backend on Your Laptop**

```bash
cd webpage
node server.js
```

You should see:
```
✅ File storage initialized
Server listening on port 5000
```

When someone sends a message, you'll see:
```
🔄 Calling vLLM at: http://218.50.74.140:40026/v1/chat/completions
```

---

## 🔧 **Testing the vLLM Connection**

Test if your vLLM server is accessible:

```bash
curl -X POST http://218.50.74.140:40026/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "microsoft/DialoGPT-medium",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

If this works, your vLLM server is accessible! ✅

---

## 📊 **Data Flow**

```
User (Browser on Vercel)
    ↓ Socket.io: chatMessage
Your Laptop (server.js)
    ↓ HTTP POST
Vast.ai vLLM Server (218.50.74.140:40026)
    ↓ AI Response
Your Laptop (server.js)
    ↓ Socket.io: chatResponse
User (Browser on Vercel)
```

---

## 🚨 **Important Notes**

### ✅ **What You Need to Do:**

1. **Keep your laptop running** while people are using the app
   - Backend needs to be running on your laptop
   - Use ngrok to expose it publicly

2. **Ensure vLLM server is accessible**
   - Test with curl command above
   - Make sure vast.ai instance is running

3. **Update frontend API URL**
   - Set `VITE_API_URL` in Vercel environment variables
   - Point it to your ngrok URL or public backend

### ⚠️ **Potential Issues:**

1. **Laptop sleeps** → Backend stops working
   - Solution: Keep laptop awake or deploy backend to cloud

2. **Ngrok URL changes** → Frontend can't connect
   - Solution: Update Vercel env variable with new ngrok URL
   - Or use paid ngrok for fixed URL

3. **Vast.ai instance stops** → vLLM unavailable
   - Backend will fall back to dummy responses
   - Users will see: "I have an alibi." etc.

---

## 🎯 **Production Recommendation**

For your competition (200-300 participants over 6 hours), I recommend:

### **Option 1: Keep Laptop Running (Quick & Easy)**
- ✅ Free
- ✅ Fast to setup
- ❌ Laptop must stay on
- ❌ Depends on your internet

### **Option 2: Deploy Backend to Railway (Recommended)**
- ✅ Free tier available
- ✅ Always online
- ✅ Auto-restarts on crash
- ✅ No need to keep laptop on

**Railway Deployment:**
```bash
# Install Railway CLI
npm install -g railway

# Login and deploy
cd webpage
railway login
railway init
railway up
```

Then update Vercel env:
```
VITE_API_URL=https://your-app.railway.app
```

---

## 📝 **Summary**

### **Your Current Endpoint Configuration:**

✅ vLLM Server: `http://218.50.74.140:40026/v1/chat/completions`  
✅ Backend Port: `5000`  
✅ Frontend: Deployed on Vercel (detective_web_page)  

### **To Deploy:**

1. ✅ Push code to GitHub
2. ✅ Run backend on laptop: `node server.js`
3. ✅ Expose backend with ngrok: `ngrok http 5000`
4. ✅ Update Vercel env: `VITE_API_URL=<ngrok-url>`
5. ✅ Deploy on Vercel

**That's it! Your app will be live!** 🎉

---

## 🆘 **Troubleshooting**

### Backend not connecting to vLLM?
```bash
# Check if vLLM server is reachable
curl http://218.50.74.140:40026/v1/chat/completions

# Check backend logs
# You should see: "🔄 Calling vLLM at: ..."
```

### Frontend not connecting to backend?
```bash
# Check CORS settings in server.js (Line 15-16)
# Should be: origin: '*'

# Check Vercel env variables
# VITE_API_URL should match your backend URL
```

### WebSocket connection failing?
```bash
# Ngrok needs to support WebSocket
# Use: ngrok http 5000
# NOT: ngrok http 5000 --scheme=http
```

---

Need more help? Check the logs and error messages! 🔍
