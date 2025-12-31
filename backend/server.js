/**
 * LinkedIn Reply AI Backend Server
 * 
 * Secure backend API that proxies requests to Gemini API
 * Features:
 * - Environment variable configuration
 * - Rate limiting
 * - CORS protection
 * - Input validation
 * - Error handling
 */

// Load environment variables from multiple possible locations
// Render Secret Files can be in app root or /etc/secrets/
const path = require('path');
const fs = require('fs');

// Try to load .env from multiple locations
const envPaths = [
  path.join(__dirname, '.env'),           // Local development
  path.join(process.cwd(), '.env'),        // App root
  '/etc/secrets/.env',                     // Render Secret Files location
  path.join(__dirname, '..', '.env')       // Parent directory
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

// Also try default dotenv behavior (current directory)
if (!envLoaded) {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
// Render uses PORT environment variable, defaults to 3000 for local dev
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// API Key Rotation Configuration
// Support multiple API keys for rotation (comma-separated)
// Falls back to single GEMINI_API_KEY for backward compatibility
let GEMINI_API_KEYS_STRING = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;

// If not found in environment, try reading directly from Secret File
if (!GEMINI_API_KEYS_STRING && fs.existsSync('/etc/secrets/.env')) {
  console.log('📂 Reading directly from /etc/secrets/.env');
  try {
    const secretContent = fs.readFileSync('/etc/secrets/.env', 'utf8');
    const lines = secretContent.split('\n');
    for (const line of lines) {
     const getRandomGeminiKey = () => {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys available - check environment variable');
  }
  return GEMINI_API_KEYS[Math.floor(Math.random() * GEMINI_API_KEYS.length)];

    }
  } catch (error) {
    console.error('❌ Error reading Secret File:', error.message);
  }
}

const API_KEY_COOLDOWN_MS = parseInt(process.env.API_KEY_COOLDOWN_MS) || 3600000; // 1 hour default

// Parse API keys from environment variable
// Remove quotes if present (Render may add quotes)
let GEMINI_API_KEYS = [];
if (GEMINI_API_KEYS_STRING) {
  // Remove surrounding quotes if present
  let cleaned = GEMINI_API_KEYS_STRING.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  GEMINI_API_KEYS = cleaned.split(',').map(key => key.trim()).filter(key => key.length > 0);
}

// Debug: Log environment variable status
console.log('🔍 Environment Check:');
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   PORT: ${PORT}`);
console.log(`   GEMINI_API_KEYS_STRING exists: ${!!GEMINI_API_KEYS_STRING}`);
if (GEMINI_API_KEYS_STRING) {
  console.log(`   GEMINI_API_KEYS_STRING length: ${GEMINI_API_KEYS_STRING.length}`);
  console.log(`   GEMINI_API_KEYS_STRING preview: ${GEMINI_API_KEYS_STRING.substring(0, 30)}...`);
}
console.log(`   Parsed keys count: ${GEMINI_API_KEYS.length}`);

// Check for Secret Files location
if (fs.existsSync('/etc/secrets/.env')) {
  console.log('✅ Found Secret File at /etc/secrets/.env');
  const secretContent = fs.readFileSync('/etc/secrets/.env', 'utf8');
  console.log(`   Secret file size: ${secretContent.length} characters`);
  console.log(`   Secret file preview: ${secretContent.substring(0, 50)}...`);
}

// Validate required environment variables
if (GEMINI_API_KEYS.length === 0) {
  console.error('\n❌ ERROR: GEMINI_API_KEY or GEMINI_API_KEYS environment variable is required!');
  console.error('\nTroubleshooting:');
  console.error('1. Check if .env file exists in one of these locations:');
  envPaths.forEach(p => {
    const exists = fs.existsSync(p);
    console.error(`   ${exists ? '✅' : '❌'} ${p}`);
  });
  console.error('2. For Render Secret Files:');
  console.error('   - Go to Environment → Secret Files');
  console.error('   - Filename should be: .env');
  console.error('   - Make sure it contains: GEMINI_API_KEYS=key1,key2,key3');
  console.error('3. For Environment Variables:');
  console.error('   - Go to Environment → Environment Variables');
  console.error('   - Add: GEMINI_API_KEYS with your keys (comma-separated)');
  console.error('\nPlease create a .env file with:');
  console.error('  GEMINI_API_KEY=your_key (single key)');
  console.error('  OR');
  console.error('  GEMINI_API_KEYS=key1,key2,key3 (multiple keys for rotation)');
  process.exit(1);
}

// Track rate-limited keys with timestamps
const rateLimitedKeys = new Map(); // key -> timestamp when rate limited

// Get available API keys (excluding rate-limited ones)
function getAvailableApiKeys() {
  const now = Date.now();
  const available = [];
  
  for (const key of GEMINI_API_KEYS) {
    const rateLimitTime = rateLimitedKeys.get(key);
    if (!rateLimitTime || (now - rateLimitTime) >= API_KEY_COOLDOWN_MS) {
      // Key is not rate-limited or cooldown has expired
      if (rateLimitTime) {
        // Cooldown expired, remove from rate-limited map
        rateLimitedKeys.delete(key);
        console.log(`✅ API key cooldown expired, re-enabling key (last 4 chars: ...${key.slice(-4)})`);
      }
      available.push(key);
    }
  }
  
  return available;
}

// Mark an API key as rate-limited
function markKeyAsRateLimited(key) {
  rateLimitedKeys.set(key, Date.now());
  console.warn(`⚠️  API key rate limited (last 4 chars: ...${key.slice(-4)}), will retry after ${API_KEY_COOLDOWN_MS / 60000} minutes`);
}

// Check if error indicates rate limiting
function isRateLimitError(errorMessage, statusCode) {
  if (!errorMessage) return false;
  const msg = errorMessage.toLowerCase();
  return statusCode === 429 || 
         statusCode === 403 ||
         msg.includes('quota') ||
         msg.includes('rate limit') ||
         msg.includes('rate_limit') ||
         msg.includes('resource exhausted') ||
         msg.includes('quota exceeded') ||
         msg.includes('billing') ||
         msg.includes('permission denied');
}

console.log(`🔑 Loaded ${GEMINI_API_KEYS.length} API key(s) for rotation`);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['*'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or Chrome extensions)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

// Gemini API configuration
const GEMINI_API_VERSION = 'v1';
const GEMINI_MODEL_OPTIONS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

/**
 * Generate replies using Gemini API with model fallback and API key rotation
 */
async function generateRepliesWithGemini(pageText) {
  const prompt = `Generate 3 short, polite, professional LinkedIn reply suggestions (1-3 sentences each) for this post content: ${pageText}. Make them engaging and relevant. Format each reply on a new line, numbered 1, 2, 3.`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  // Get available API keys (excluding rate-limited ones)
  const availableKeys = getAvailableApiKeys();
  
  if (availableKeys.length === 0) {
    throw new Error('All API keys are currently rate-limited. Please try again later.');
  }

  let lastError = null;
  const triedKeys = [];
  const triedModels = [];

  // Try each available API key
  for (const apiKey of availableKeys) {
    triedKeys.push(apiKey.slice(-4)); // Store last 4 chars for logging
    
    // Try each model option until one works
    for (const model of GEMINI_MODEL_OPTIONS) {
      const apiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`;
      triedModels.push(model);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `API error: ${response.status}`;

          // Check if it's a rate limit error
          if (isRateLimitError(errorMessage, response.status)) {
            markKeyAsRateLimited(apiKey);
            lastError = new Error(`API key rate limited: ${errorMessage}`);
            // Break out of model loop and try next API key
            break;
          }

          // Check if it's a model not found error
          if (errorMessage.includes('not found') || errorMessage.includes('not supported')) {
            lastError = new Error(`Model "${model}" is not available. Trying fallback models...`);
            console.warn(`Model ${model} not found, trying next model...`);
            continue;
          }

          // Other errors - try next model
          lastError = new Error(errorMessage);
          continue;
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || 
            !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
          lastError = new Error('Invalid API response format');
          continue;
        }

        // Success! Return the result
        console.log(`✅ Successfully used API key (last 4: ...${apiKey.slice(-4)}) with model: ${model}`);
        return {
          text: data.candidates[0].content.parts[0].text,
          model: model,
          apiKeyUsed: apiKey.slice(-4) // Return last 4 chars for logging
        };
      } catch (error) {
        console.error(`Error with API key (last 4: ...${apiKey.slice(-4)}) and model ${model}:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If we've tried all models with this key and it wasn't rate-limited, 
    // continue to next key if available
    if (!rateLimitedKeys.has(apiKey)) {
      continue;
    }
  }

  // If we get here, all keys/models failed
  const errorMsg = `Unable to connect to Gemini API. ` +
    `Tried ${triedKeys.length} API key(s) and ${triedModels.length} model(s). ` +
    `Error: ${lastError?.message || 'Unknown error'}`;
  throw new Error(errorMsg);
}

/**
 * POST /api/generate-reply
 * Generate LinkedIn reply suggestions
 */
app.post('/api/generate-reply', 
  [
    // Input validation
    body('pageText')
      .trim()
      .isLength({ min: 50, max: 1500 })
      .withMessage('Page text must be between 50 and 1500 characters')
      .escape() // Sanitize input
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { pageText } = req.body;

      // Generate replies using Gemini API
      const result = await generateRepliesWithGemini(pageText);

      // Return success response
      res.json({
        success: true,
        text: result.text,
        model: result.model,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating replies:', error);

      // Don't expose internal error details in production
      const errorMessage = NODE_ENV === 'production' 
        ? 'Failed to generate replies. Please try again later.'
        : error.message;

      res.status(500).json({
        error: 'Internal server error',
        message: errorMessage
      });
    }
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LinkedIn Reply AI Backend Server running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🔒 CORS: ${allowedOrigins.includes('*') ? 'All origins' : allowedOrigins.join(', ')}`);
  console.log(`⏱️  Rate limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`);
  console.log(`🔄 API key rotation: ${GEMINI_API_KEYS.length} key(s) available, cooldown: ${API_KEY_COOLDOWN_MS / 60000} minutes`);
  
  if (NODE_ENV === 'development') {
    console.log(`\n⚠️  Running in DEVELOPMENT mode`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API endpoint: http://localhost:${PORT}/api/generate-reply\n`);
  }
});

module.exports = app;

