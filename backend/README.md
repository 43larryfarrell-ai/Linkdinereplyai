# LinkedIn Reply AI Backend Server

Secure backend API server for the LinkedIn Reply AI Chrome Extension.

## Features

- ✅ **Secure API Key Management** - Gemini API key stored in environment variables
- ✅ **Rate Limiting** - Prevents abuse with configurable limits
- ✅ **CORS Protection** - Configurable origin whitelist
- ✅ **Input Validation** - Validates and sanitizes user input
- ✅ **Error Handling** - Comprehensive error handling with safe error messages
- ✅ **Security Headers** - Helmet.js for security headers
- ✅ **Model Fallback** - Automatically tries multiple Gemini models

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key(s):

**Single API Key (backward compatible):**
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Multiple API Keys (recommended for production - automatic rotation):**
```env
GEMINI_API_KEYS=your_key_1,your_key_2,your_key_3
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_KEY_COOLDOWN_MS=3600000
```

**Note:** When using multiple API keys, if one key hits rate limits, the system will automatically rotate to the next available key. Rate-limited keys are automatically re-enabled after the cooldown period (default: 1 hour).

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### POST /api/generate-reply

Generate LinkedIn reply suggestions.

**Request Body:**
```json
{
  "pageText": "LinkedIn post content here (50-1500 characters)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "text": "Generated reply text...",
  "model": "gemini-2.5-flash",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (400/500):**
```json
{
  "error": "Error type",
  "message": "Error message"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `GEMINI_API_KEY` | Single Gemini API key (backward compatible) | - |
| `GEMINI_API_KEYS` | Multiple Gemini API keys, comma-separated (recommended) | - |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `API_KEY_COOLDOWN_MS` | Cooldown period for rate-limited keys (ms) | `3600000` (1 hour) |

**Note:** Use either `GEMINI_API_KEY` (single key) or `GEMINI_API_KEYS` (multiple keys for rotation). If both are set, `GEMINI_API_KEYS` takes precedence.

## Security Features

1. **Helmet.js** - Sets security HTTP headers
2. **CORS** - Restricts which origins can access the API
3. **Rate Limiting** - Prevents abuse and DoS attacks
4. **Input Validation** - Validates and sanitizes all inputs
5. **Error Sanitization** - Doesn't expose internal errors in production
6. **Environment Variables** - Sensitive data never in code
7. **API Key Rotation** - Automatically rotates API keys when rate limits are hit

## Deployment

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start server.js --name linkedin-reply-ai
pm2 save
pm2 startup
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t linkedin-reply-ai-backend .
docker run -d -p 3000:3000 --env-file .env linkedin-reply-ai-backend
```

### Using Heroku

```bash
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_key
git push heroku main
```

### Using Railway/Render/Fly.io

1. Connect your repository
2. Set environment variables in dashboard
3. Deploy

## Monitoring

Check server health:
```bash
curl http://localhost:3000/health
```

## Troubleshooting

**Error: GEMINI_API_KEY not found**
- Make sure `.env` file exists and contains `GEMINI_API_KEY`

**CORS errors**
- Update `ALLOWED_ORIGINS` in `.env` to include your Chrome extension origin

**Rate limit errors**
- Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS` in `.env`

## License

MIT

