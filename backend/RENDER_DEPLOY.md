# Deploy to Render - Step-by-Step Guide

## Prerequisites

- GitHub account (free)
- Render account (free tier available)
- Your Gemini API key

## Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
# In your project root directory
git init
git add .
git commit -m "Initial commit with secure backend"
```

### 1.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `linkedin-reply-ai`
4. Make it **Public** (required for free Render)
5. Click "Create repository"

### 1.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/linkedin-reply-ai.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy on Render

### 2.1 Sign Up / Login to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed

### 2.2 Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** if prompted
4. Select **"Connect GitHub"** (or your Git provider)
5. Authorize Render to access your repositories

### 2.3 Configure Service

1. **Repository:** Select `linkedin-reply-ai`
2. **Branch:** `main` (default)
3. **Name:** `linkedin-reply-ai-backend` (or any name)
4. **Region:** Choose closest to you (e.g., `Oregon (US West)`)
5. **Root Directory:** `backend` ⚠️ **IMPORTANT!**
6. **Runtime:** `Node`
7. **Build Command:** `npm install`
8. **Start Command:** `node server.js`
9. **Instance Type:** `Free` (or `Starter` for $7/mo)

### 2.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEYS` | `your_key_1,your_key_2,your_key_3` (comma-separated) |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render uses port 10000) |
| `ALLOWED_ORIGINS` | `*` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `API_KEY_COOLDOWN_MS` | `3600000` (optional, 1 hour default) |

**⚠️ Important:** 
- **API Key Rotation:** Use `GEMINI_API_KEYS` with multiple keys (comma-separated) for automatic rotation. If one key hits rate limits, the system automatically switches to the next available key.
- **Single Key (backward compatible):** You can still use `GEMINI_API_KEY` with a single key if preferred.
- Replace the placeholder keys with your actual Gemini API keys
- Render uses port `10000` by default (not 3000)

### 2.5 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait 2-3 minutes for deployment to complete
4. You'll see build logs in real-time

### 2.6 Get Your URL

Once deployed, you'll see:
- **Service URL:** `https://linkedin-reply-ai-backend.onrender.com` (or similar)
- Copy this URL!

## Step 3: Update Chrome Extension

### 3.1 Update Backend URL

1. Open `popup.js` in your project
2. Find line 5: `const BACKEND_API_URL = "http://localhost:3000";`
3. Replace with your Render URL:
   ```javascript
   const BACKEND_API_URL = "https://linkedin-reply-ai-backend.onrender.com";
   ```
   (Use your actual Render URL!)

### 3.2 Reload Extension

1. Go to `chrome://extensions/`
2. Find "LinkedIn Reply AI"
3. Click **reload icon**
4. Extension now uses Render backend!

## Step 4: Test Everything

### 4.1 Test Backend Health

Open in browser:
```
https://your-app.onrender.com/health
```

Should return:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

### 4.2 Test Extension

1. Go to LinkedIn
2. Open any post
3. Click extension icon
4. Click "Generate Replies"
5. Should work! 🎉

## Render Free Tier Notes

### Limitations:
- ⚠️ **Spins down after 15 minutes** of inactivity
- ⚠️ **First request after spin-down** takes ~30 seconds (cold start)
- ⚠️ **750 hours/month** free (enough for most use cases)

### Solutions:
1. **Upgrade to Starter ($7/mo)** - Always on, no cold starts
2. **Use a ping service** - Keep it awake (see below)
3. **Accept cold starts** - First request will be slow

### Keep Free Tier Awake (Optional)

Use a free service like [UptimeRobot](https://uptimerobot.com):
1. Sign up (free)
2. Add monitor
3. URL: `https://your-app.onrender.com/health`
4. Interval: Every 5 minutes
5. Keeps your app awake!

## Troubleshooting

### Build Fails
- ✅ Check `Root Directory` is set to `backend`
- ✅ Check `Build Command` is `npm install`
- ✅ Check `Start Command` is `node server.js`
- ✅ Check environment variables are set

### Service Won't Start
- ✅ Check logs in Render dashboard
- ✅ Verify `PORT` is set to `10000` (or check what Render expects)
- ✅ Check `GEMINI_API_KEY` is correct

### Extension Can't Connect
- ✅ Verify Render URL is correct in `popup.js`
- ✅ Check Render service is running (green status)
- ✅ Test health endpoint in browser first
- ✅ Check CORS settings (`ALLOWED_ORIGINS=*`)

### Slow First Request
- ✅ Normal for free tier (cold start)
- ✅ Upgrade to Starter plan for always-on
- ✅ Or use UptimeRobot to keep it awake

## Updating Your Deployment

When you make changes:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Render auto-deploys** - It watches your GitHub repo!

3. **Or manually deploy:**
   - Go to Render dashboard
   - Click "Manual Deploy" → "Deploy latest commit"

## Monitoring

- **Logs:** View in Render dashboard → "Logs" tab
- **Metrics:** View in Render dashboard → "Metrics" tab
- **Events:** View in Render dashboard → "Events" tab

## Cost

- **Free Tier:** $0/month (with limitations)
- **Starter:** $7/month (always on, no cold starts)
- **Pro:** $25/month (more resources)

## Next Steps

1. ✅ Deploy to Render (follow steps above)
2. ✅ Update extension with Render URL
3. ✅ Test everything works
4. ✅ Set up UptimeRobot (optional, for free tier)
5. ✅ Monitor usage and logs

---

**Need help?** Check Render docs: https://render.com/docs

