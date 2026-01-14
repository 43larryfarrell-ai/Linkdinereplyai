# Deployment Guide

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Test locally:**
   ```bash
   npm run dev
   ```

4. **Update Chrome extension:**
   - Edit `popup.js`
   - Change `BACKEND_API_URL` to your deployed backend URL

## Deployment Options

### Option 1: Railway (Recommended - Easy & Free Tier)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repository
4. Add environment variables:
   - `GEMINI_API_KEY` = your key
   - `PORT` = 3000 (or leave default)
   - `NODE_ENV` = production
5. Deploy
6. Copy the generated URL (e.g., `https://your-app.railway.app`)
7. Update `BACKEND_API_URL` in `popup.js`

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your repository
4. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables:
   - `GEMINI_API_KEY`
   - `NODE_ENV` = production
6. Deploy
7. Update `BACKEND_API_URL` in `popup.js`

### Option 3: Fly.io

1. Install Fly CLI: `npm install -g @fly/cli`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets:
   ```bash
   fly secrets set GEMINI_API_KEY=your_key
   fly secrets set NODE_ENV=production
   ```
5. Deploy: `fly deploy`
6. Update `BACKEND_API_URL` in `popup.js`

### Option 4: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set config:
   ```bash
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set NODE_ENV=production
   ```
5. Deploy: `git push heroku main`
6. Update `BACKEND_API_URL` in `popup.js`

### Option 5: VPS (DigitalOcean, AWS EC2, etc.)

1. SSH into your server
2. Install Node.js 18+
3. Clone repository
4. Install dependencies: `npm install --production`
5. Set up PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name linkedin-reply-ai
   pm2 save
   pm2 startup
   ```
6. Set up Nginx reverse proxy (optional but recommended)
7. Configure firewall (port 3000)
8. Update `BACKEND_API_URL` in `popup.js`

## Environment Variables Checklist

Before deploying, ensure these are set:

- ✅ `GEMINI_API_KEY` - Your Gemini API key (REQUIRED)
- ✅ `NODE_ENV` - Set to `production` for production
- ✅ `PORT` - Server port (default: 3000)
- ✅ `ALLOWED_ORIGINS` - CORS origins (use `*` for Chrome extensions)
- ✅ `RATE_LIMIT_WINDOW_MS` - Rate limit window (optional)
- ✅ `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (optional)

## Post-Deployment

1. **Test the backend:**
   ```bash
   curl https://your-backend-url.com/health
   ```

2. **Test the API:**
   ```bash
   curl -X POST https://your-backend-url.com/api/generate-reply \
     -H "Content-Type: application/json" \
     -d '{"pageText":"Test LinkedIn post content here"}'
   ```

3. **Update Chrome extension:**
   - Open `popup.js`
   - Change `BACKEND_API_URL` to your deployed URL
   - Reload extension in Chrome

4. **Monitor logs:**
   - Check server logs for errors
   - Monitor rate limiting
   - Watch for API errors

## Security Checklist

- ✅ API key stored in environment variables (never in code)
- ✅ CORS configured properly
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ Error messages sanitized (production mode)
- ✅ Security headers enabled (Helmet)
- ✅ HTTPS enabled (for production)

## Troubleshooting

**Backend not responding:**
- Check server logs
- Verify environment variables are set
- Check firewall/port configuration

**CORS errors:**
- Update `ALLOWED_ORIGINS` in `.env`
- For Chrome extensions, you may need `*` or specific extension ID

**Rate limit errors:**
- Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
- Check if IP is being rate limited

**API errors:**
- Verify `GEMINI_API_KEY` is correct
- Check Gemini API quota/limits
- Review server logs for detailed errors

