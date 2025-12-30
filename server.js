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

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
// Render uses PORT environment variable, defaults to 3000 for local dev
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required!');
  console.error('Please create a .env file with GEMINI_API_KEY=your_key');
  process.exit(1);
}

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
 * Generate replies using Gemini API with model fallback
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

  let lastError = null;
  const triedModels = [];

  // Try each model option until one works
  for (const model of GEMINI_MODEL_OPTIONS) {
    const apiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
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

        // Check if it's a model not found error
        if (errorMessage.includes('not found') || errorMessage.includes('not supported')) {
          lastError = new Error(`Model "${model}" is not available. Trying fallback models...`);
          console.warn(`Model ${model} not found, trying next model...`);
          continue;
        }

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
      console.log(`Successfully used model: ${model}`);
      return {
        text: data.candidates[0].content.parts[0].text,
        model: model
      };
    } catch (error) {
      console.error(`Error with model ${model}:`, error.message);
      lastError = error;
      continue;
    }
  }

  // If we get here, all models failed
  const errorMsg = `Unable to connect to Gemini API. Tried models: ${triedModels.join(', ')}. ` +
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
  
  if (NODE_ENV === 'development') {
    console.log(`\n⚠️  Running in DEVELOPMENT mode`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API endpoint: http://localhost:${PORT}/api/generate-reply\n`);
  }
});

module.exports = app;
