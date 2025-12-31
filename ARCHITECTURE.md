# Architecture Overview

## Before: Insecure Direct API Calls

```
┌─────────────────┐
│ Chrome Extension│
│  (popup.js)     │
│                 │
│ GEMINI_API_KEY  │ ❌ Exposed in client code!
└────────┬────────┘
         │
         │ Direct API Call
         ▼
┌─────────────────┐
│  Gemini API     │
│  (Google)       │
└─────────────────┘
```

**Problems:**
- ❌ API key visible in extension code (anyone can extract it)
- ❌ No rate limiting (users can abuse API)
- ❌ No input validation
- ❌ No cost control
- ❌ API key can be stolen and used elsewhere

## After: Secure Backend Architecture

```
┌─────────────────┐
│ Chrome Extension│
│  (popup.js)     │
│                 │
│ BACKEND_API_URL │ ✅ Only backend URL
└────────┬────────┘
         │
         │ HTTPS Request
         │ (no API key)
         ▼
┌─────────────────┐
│  Backend Server │
│  (Node.js)      │
│                 │
│ ✅ Rate Limit   │
│ ✅ Validation  │
│ ✅ CORS         │
│ ✅ Security     │
└────────┬────────┘
         │
         │ Secure API Call
         │ (API key in .env)
         ▼
┌─────────────────┐
│  Gemini API     │
│  (Google)       │
└─────────────────┘
```

**Benefits:**
- ✅ API key never exposed to client
- ✅ Rate limiting prevents abuse
- ✅ Input validation and sanitization
- ✅ Cost control and monitoring
- ✅ Centralized security management

## File Changes Summary

### New Files Created

1. **backend/server.js**
   - Express server with Gemini API integration
   - Rate limiting, CORS, security headers
   - Input validation
   - Error handling

2. **backend/package.json**
   - Dependencies: express, cors, helmet, rate-limit, etc.
   - Scripts for development and production

3. **backend/.env.example**
   - Template for environment variables
   - Shows required configuration

4. **backend/.gitignore**
   - Prevents committing `.env` file
   - Protects secrets

5. **backend/README.md**
   - Backend API documentation
   - Endpoint descriptions

6. **backend/SETUP.md**
   - Step-by-step setup instructions
   - Troubleshooting guide

7. **backend/DEPLOYMENT.md**
   - Deployment options (Railway, Render, etc.)
   - Production configuration

8. **SECURITY.md**
   - Security implementation details
   - Threat model and protections

9. **ARCHITECTURE.md** (this file)
   - Architecture overview
   - Before/after comparison

### Modified Files

1. **popup.js**
   - ❌ Removed: `GEMINI_API_KEY` constant
   - ✅ Added: `BACKEND_API_URL` constant
   - ✅ Updated: `generateReplies()` function now calls backend
   - ✅ Updated: Error handling for backend responses

2. **README.md**
   - ✅ Updated: New architecture documentation
   - ✅ Added: Backend setup instructions
   - ✅ Added: Security information

## Security Layers

### Layer 1: Environment Variables
- API keys stored in `.env` file
- Never committed to git
- Different keys for dev/prod

### Layer 2: Rate Limiting
- Prevents abuse
- Configurable limits
- Per-IP tracking

### Layer 3: CORS Protection
- Origin whitelist
- Prevents unauthorized access
- Chrome extension origins allowed

### Layer 4: Input Validation
- Express Validator
- Length limits (50-1500 chars)
- HTML escaping (XSS prevention)

### Layer 5: Security Headers
- Helmet.js
- Content Security Policy
- XSS Protection
- Frame Options

### Layer 6: Error Sanitization
- Generic errors in production
- No internal details exposed
- Safe error messages

## API Flow

### Request Flow

1. **User clicks "Generate Replies"** in Chrome extension
2. **Extension extracts page text** from LinkedIn post
3. **Extension calls backend** `/api/generate-reply` with page text
4. **Backend validates input** (length, format)
5. **Backend checks rate limit** (per IP)
6. **Backend calls Gemini API** with API key from `.env`
7. **Backend processes response** and returns to extension
8. **Extension displays replies** to user

### Error Handling

- **Validation errors** → 400 Bad Request
- **Rate limit exceeded** → 429 Too Many Requests
- **Gemini API errors** → 500 Internal Server Error
- **Network errors** → User-friendly messages

## Deployment Architecture

### Development
```
Local Machine:
├── Chrome Extension (localhost)
└── Backend Server (localhost:3000)
    └── Gemini API (Google)
```

### Production
```
User's Browser:
├── Chrome Extension
└── Backend Server (Railway/Render/etc.)
    └── Gemini API (Google)
```

## Cost Control

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Prevents cost overruns

### Monitoring
- Server logs track all requests
- Can add analytics/monitoring tools
- Alert on unusual activity

## Migration Checklist

- [x] Create backend server
- [x] Move API key to environment variables
- [x] Add rate limiting
- [x] Add security middleware
- [x] Update extension to call backend
- [x] Test locally
- [ ] Deploy backend to production
- [ ] Update extension with production URL
- [ ] Test production deployment
- [ ] Monitor logs and costs

## Next Steps

1. **Deploy backend** to production (see `backend/DEPLOYMENT.md`)
2. **Update extension** with production backend URL
3. **Test thoroughly** in production
4. **Monitor** server logs and API usage
5. **Set up alerts** for errors or unusual activity

## Questions?

- Setup issues? See `backend/SETUP.md`
- Deployment? See `backend/DEPLOYMENT.md`
- Security? See `SECURITY.md`
- API docs? See `backend/README.md`

