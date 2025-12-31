# 🚀 Quick Start Guide - What to Do Next

Follow these steps to get your secure backend running:

## Step 1: Set Up Backend Server (5 minutes)

### 1.1 Navigate to Backend Folder
```bash
cd backend
```

### 1.2 Install Dependencies
```bash
npm install
```

This will install:
- express (web server)
- cors (CORS middleware)
- helmet (security headers)
- express-rate-limit (rate limiting)
- dotenv (environment variables)
- express-validator (input validation)

### 1.3 Create Environment File
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Or manually create .env file
```

### 1.4 Add Your Gemini API Key
Open `.env` file and add your API key:

```env
GEMINI_API_KEY=AIzaSyBLZFmGf_84pgcPSjoxD8oUjpsM_wrwabY
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important:** Replace `AIzaSyBLZFmGf_84pgcPSjoxD8oUjpsM_wrwabY` with your actual Gemini API key if you want to use a different one.

### 1.5 Start the Server
```bash
npm run dev
```

You should see:
```
🚀 LinkedIn Reply AI Backend Server running on port 3000
📝 Environment: development
🔒 CORS: All origins
⏱️  Rate limit: 100 requests per 15 minutes
```

**Keep this terminal window open!** The server needs to keep running.

## Step 2: Test Backend (2 minutes)

### 2.1 Test Health Endpoint
Open a new terminal and run:
```bash
curl http://localhost:3000/health
```

Or open in browser: http://localhost:3000/health

You should see:
```json
{"status":"ok","timestamp":"...","environment":"development"}
```

### 2.2 Test API Endpoint
```bash
curl -X POST http://localhost:3000/api/generate-reply -H "Content-Type: application/json" -d "{\"pageText\":\"This is a test LinkedIn post about AI technology and its impact on business.\"}"
```

If it works, you'll get a JSON response with generated replies.

## Step 3: Update Chrome Extension (1 minute)

### 3.1 Check Extension Configuration
The extension is already configured to use `http://localhost:3000` (see line 5 in `popup.js`).

If you need to change it, open `popup.js` and update:
```javascript
const BACKEND_API_URL = "http://localhost:3000"; // Already set!
```

### 3.2 Reload Extension
1. Open Chrome
2. Go to `chrome://extensions/`
3. Find "LinkedIn Reply AI"
4. Click the **reload icon** (circular arrow)
5. Extension is now ready!

## Step 4: Test Everything Together (2 minutes)

1. **Open LinkedIn** in Chrome
2. Navigate to any LinkedIn post
3. **Click the extension icon** in Chrome toolbar
4. Click **"Generate Replies"**
5. Wait a few seconds
6. You should see 3 reply suggestions!

## Step 5: Deploy to Production (When Ready)

Once local testing works, deploy your backend:

### Option A: Railway (Easiest - Recommended)
1. Go to [railway.app](https://railway.app)
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub"
4. Connect your repository
5. Add environment variable: `GEMINI_API_KEY=your_key`
6. Deploy!
7. Copy the URL (e.g., `https://your-app.railway.app`)
8. Update `BACKEND_API_URL` in `popup.js` to the Railway URL

### Option B: Render
1. Go to [render.com](https://render.com)
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect repository
5. Add environment variables
6. Deploy!

See `backend/DEPLOYMENT.md` for more options.

## Troubleshooting

### "Cannot connect to server"
- ✅ Make sure backend server is running (`npm run dev` in backend folder)
- ✅ Check `BACKEND_API_URL` in `popup.js` matches your server URL
- ✅ Try `http://localhost:3000` (not `127.0.0.1`)

### "GEMINI_API_KEY not found"
- ✅ Make sure `.env` file exists in `backend/` folder
- ✅ Check `.env` has `GEMINI_API_KEY=your_key`
- ✅ Restart the server after creating `.env`

### "Port 3000 already in use"
- ✅ Change `PORT=3001` in `.env`
- ✅ Update `BACKEND_API_URL` in `popup.js` to `http://localhost:3001`

### CORS Errors
- ✅ Make sure `ALLOWED_ORIGINS=*` in `.env` for development
- ✅ Restart server after changing `.env`

## What's Next?

1. ✅ **Test locally** - Make sure everything works
2. ✅ **Deploy backend** - Choose a hosting platform
3. ✅ **Update extension** - Point to production URL
4. ✅ **Monitor** - Watch server logs and API usage

## Need Help?

- **Setup issues?** See `backend/SETUP.md`
- **Deployment?** See `backend/DEPLOYMENT.md`
- **Security?** See `SECURITY.md`
- **Architecture?** See `ARCHITECTURE.md`

---

**You're all set! Start with Step 1 above.** 🎉

