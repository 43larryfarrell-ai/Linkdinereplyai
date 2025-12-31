# LinkedIn Reply AI - Chrome Extension

AI-powered reply suggestions for LinkedIn posts using Google Gemini.

## 🚀 Quick Start

### Option A: Using Backend Server (Recommended - Secure)

1. **Set up backend server:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   npm run dev
   ```

2. **Update extension:**
   - Open `popup.js`
   - Set `BACKEND_API_URL = "http://localhost:3000"` (or your production URL)

3. **Load extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select this folder

See [backend/SETUP.md](backend/SETUP.md) for detailed setup instructions.

### Option B: Direct API (Not Recommended - Insecure)

⚠️ **Warning:** This exposes your API key in client-side code. Use only for testing.

1. Open `popup.js`
2. Uncomment direct API code (if available)
3. Add your Gemini API key

## 📁 Project Structure

```
LinkedInReplyAI/
├── backend/                 # Secure backend server
│   ├── server.js           # Express server with Gemini API
│   ├── package.json        # Node.js dependencies
│   ├── .env.example        # Environment variables template
│   ├── SETUP.md            # Backend setup guide
│   ├── DEPLOYMENT.md       # Deployment instructions
│   └── README.md           # Backend documentation
├── manifest.json           # Extension manifest (Manifest V3)
├── popup.html              # Extension popup UI
├── popup.js                # Extension logic (calls backend)
├── content.js              # Content script for page text extraction
├── SECURITY.md             # Security implementation details
└── README.md               # This file
```

## ✨ Features

- **AI-Powered Replies**: Generate 3 professional reply suggestions for any LinkedIn post
- **Secure Backend**: API keys stored server-side, never exposed to client
- **Rate Limiting**: Prevents abuse and cost overruns
- **Freemium Model**: 3 free uses, then 24-hour cooldown
- **Pro Upgrade**: Monthly ($10), Yearly ($99), Lifetime ($199) plans
- **Crypto Payments**: NOWPayments integration for Pro upgrades
- **Clean UI**: Modern, professional popup interface
- **Easy Copy**: One-click copy for each generated reply

## 🔒 Security

This extension uses a secure backend architecture:

- ✅ **API keys never exposed** - Stored in backend environment variables
- ✅ **Rate limiting** - Prevents abuse (100 requests per 15 minutes)
- ✅ **CORS protection** - Only allowed origins can access API
- ✅ **Input validation** - All inputs validated and sanitized
- ✅ **Security headers** - Helmet.js for additional protection

See [SECURITY.md](SECURITY.md) for detailed security information.

## 🛠️ Development

### Backend Development

```bash
cd backend
npm install
npm run dev  # Starts with auto-reload
```

### Extension Development

1. Make changes to `popup.js`, `popup.html`, or `content.js`
2. Reload extension in `chrome://extensions/`
3. Test on LinkedIn

## 📦 Deployment

### Deploy Backend

Choose a hosting platform:
- **Railway** (easiest) - See [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)
- **Render** - Free tier available
- **Fly.io** - Global edge deployment
- **Heroku** - Traditional PaaS
- **VPS** - Full control

### Update Extension

After deploying backend:
1. Update `BACKEND_API_URL` in `popup.js` to production URL
2. Reload extension
3. Test in production

## 📖 Documentation

- [Backend Setup Guide](backend/SETUP.md) - Step-by-step backend setup
- [Deployment Guide](backend/DEPLOYMENT.md) - Deploy to production
- [Security Guide](SECURITY.md) - Security implementation details
- [Backend README](backend/README.md) - Backend API documentation

## 🐛 Troubleshooting

### Backend Issues

- **"GEMINI_API_KEY not found"**: Check `.env` file exists and has the key
- **CORS errors**: Update `ALLOWED_ORIGINS` in `.env`
- **Port in use**: Change `PORT` in `.env`

### Extension Issues

- **"Cannot connect to server"**: Check `BACKEND_API_URL` is correct
- **"Please navigate to LinkedIn"**: Make sure you're on a LinkedIn post page
- **Extension not loading**: Enable Developer mode in Chrome

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please ensure:
- Code follows security best practices
- Backend changes maintain security standards
- Extension changes tested thoroughly

