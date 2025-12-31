# Backend Setup Guide

## Step-by-Step Setup Instructions

### Step 1: Install Node.js

Make sure you have Node.js 18+ installed:

```bash
node --version  # Should be v18.0.0 or higher
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### Step 2: Navigate to Backend Directory

```bash
cd backend
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `dotenv` - Environment variables
- `express-validator` - Input validation

### Step 4: Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGINS=*
   ```

3. **Important:** Never commit `.env` to git (it's already in `.gitignore`)

### Step 5: Test Locally

Start the development server:

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

### Step 6: Test the API

Open a new terminal and test:

```bash
# Health check
curl http://localhost:3000/health

# Test generate-reply endpoint
curl -X POST http://localhost:3000/api/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"pageText":"This is a test LinkedIn post about AI and technology. It discusses the future of artificial intelligence and how it will impact various industries."}'
```

### Step 7: Update Chrome Extension

1. Open `popup.js` in the root directory
2. Find `BACKEND_API_URL` (around line 3)
3. For local testing, keep it as:
   ```javascript
   const BACKEND_API_URL = "http://localhost:3000";
   ```
4. For production, change to your deployed URL:
   ```javascript
   const BACKEND_API_URL = "https://your-backend-domain.com";
   ```

### Step 8: Test Chrome Extension

1. Reload the Chrome extension in `chrome://extensions/`
2. Navigate to a LinkedIn post
3. Click the extension icon
4. Click "Generate Replies"
5. Should work seamlessly!

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable is required"

**Solution:** Make sure `.env` file exists and contains `GEMINI_API_KEY=your_key`

### Error: "Cannot connect to server"

**Solution:** 
- Make sure backend server is running (`npm run dev`)
- Check `BACKEND_API_URL` in `popup.js` matches your server URL
- For Chrome extensions, you may need to use `http://localhost:3000` (not `127.0.0.1`)

### CORS Errors

**Solution:** 
- Update `ALLOWED_ORIGINS` in `.env` to include your Chrome extension origin
- Or use `ALLOWED_ORIGINS=*` for development (not recommended for production)

### Port Already in Use

**Solution:**
- Change `PORT` in `.env` to a different port (e.g., `3001`)
- Update `BACKEND_API_URL` in `popup.js` to match

## Next Steps

Once local testing works:
1. Deploy backend to production (see `DEPLOYMENT.md`)
2. Update `BACKEND_API_URL` in `popup.js` to production URL
3. Test production deployment
4. Monitor server logs

