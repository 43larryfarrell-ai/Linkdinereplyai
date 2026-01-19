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
const Flutterwave = require('flutterwave-node-v3');

const app = express();
// Render uses PORT environment variable, defaults to 3000 for local dev
const PORT = process.env.PORT || 3000;
// Trust proxy for proper rate limiting when behind reverse proxy (like Render)
// Only trust specific proxies to avoid security issues
app.set('trust proxy', ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);
const GEMINI_API_KEYS = process.env.GEMINI_API_KEYS ? 
  process.env.GEMINI_API_KEYS.split(',').map((key, index) => {
    let cleanKey = key.trim();
    cleanKey = cleanKey.replace(/[\s\n\r\t\v\f\x00-\x1F\x7F-\x9F]/g, '');
    cleanKey = cleanKey.replace(/^gemini_api_key_\d+/, '');
    cleanKey = cleanKey.replace(/^gemini_key_\d+/, '');
    return cleanKey;
  }).filter(key => key.length > 0) : [];
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

// API Key Rotation Configuration
let currentKeyIndex = 0;
const rateLimitedKeys = new Set();
const GEMINI_API_VERSION = 'v1';
const GEMINI_MODEL_OPTIONS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

// Debug: Check API keys and models
console.log('🔑 Available API keys:', GEMINI_API_KEYS.length);
console.log('🤖 Model options:', GEMINI_MODEL_OPTIONS);
console.log('🌍 Environment:', NODE_ENV);

// Function to get next available API key
function getNextApiKey() {
  let attempts = 0;
  while (attempts < GEMINI_API_KEYS.length) {
    const keyIndex = currentKeyIndex % GEMINI_API_KEYS.length;
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    
    if (!rateLimitedKeys.has(GEMINI_API_KEYS[keyIndex])) {
      console.log(`🔑 Using API key ${keyIndex + 1}/${GEMINI_API_KEYS.length}`);
      return GEMINI_API_KEYS[keyIndex];
    }
    attempts++;
  }
  
  // If all keys are rate limited, reset and return first key
  console.warn('⚠️ All API keys rate limited, resetting...');
  rateLimitedKeys.clear();
  currentKeyIndex = 0;
  return GEMINI_API_KEYS[0];
}

// Initialize Flutterwave
const flw = new Flutterwave(FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY);

// Validate required environment variables
if (!GEMINI_API_KEYS || GEMINI_API_KEYS.length === 0) {
  console.error('ERROR: GEMINI_API_KEYS environment variable is required!');
  console.error('Please create a .env file with GEMINI_API_KEYS=key1,key2,key3');
  console.error('Raw GEMINI_API_KEYS value:', process.env.GEMINI_API_KEYS);
  process.exit(1);
}

console.log(`Loaded ${GEMINI_API_KEYS.length} Gemini API keys`);
console.log('First key preview:', GEMINI_API_KEYS[0] ? GEMINI_API_KEYS[0].substring(0, 10) + '...' : 'None');
console.log('First key length:', GEMINI_API_KEYS[0] ? GEMINI_API_KEYS[0].length : 0);
console.log('First key starts with:', GEMINI_API_KEYS[0] ? GEMINI_API_KEYS[0].substring(0, 5) : 'None');
console.log('Raw GEMINI_API_KEYS:', process.env.GEMINI_API_KEYS);
console.log('Processed keys:', GEMINI_API_KEYS.map((key, i) => `${i + 1}: ${key.substring(0, 15)}... (${key.length} chars)`));

// Check available models for the first few API keys on startup
console.log('🔍 Checking available Gemini models...');
setTimeout(async () => {
  for (let i = 0; i < Math.min(3, GEMINI_API_KEYS.length); i++) {
    await listAvailableModels(GEMINI_API_KEYS[i]);
  }
}, 1000);

if (!FLUTTERWAVE_SECRET_KEY) {
  console.error('ERROR: FLUTTERWAVE_SECRET_KEY environment variable is required!');
  console.error('Please create a .env file with FLUTTERWAVE_SECRET_KEY=your_key');
  process.exit(1);
}

if (!FLUTTERWAVE_PUBLIC_KEY) {
  console.error('ERROR: FLUTTERWAVE_PUBLIC_KEY environment variable is required!');
  console.error('Please create a .env file with FLUTTERWAVE_PUBLIC_KEY=your_key');
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
const allowedOrigins = [
  'https://linkdinereplyai.onrender.com',
  'http://localhost:3000',
  'http://localhost:10000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any chrome-extension origin
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
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

// NowPayments endpoint
app.post('/api/nowpayments-create-invoice', async (req, res) => {
  try {
    const { price_amount, price_currency, order_description, order_id } = req.body;
    
    const invoiceData = {
      price_amount: price_amount,
      price_currency: price_currency,
      order_description: order_description,
      order_id: order_id,
      // Allow user to choose any cryptocurrency
      // pay_currency: "btc" // Uncomment to force specific crypto
    };

    const response = await fetch(`${process.env.NOWPAYMENTS_API_URL}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('NowPayments invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment endpoint
app.post('/api/create-payment', async (req, res) => {
  try {
    const { email, amount, currency = 'USD' } = req.body;
    
    // Generate unique transaction reference
    const tx_ref = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const paymentData = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      email: email,
      payment_options: 'card,banktransfer,ussd,mobilemoney,barter',
      redirect_url: `${req.protocol}://${req.get('host')}/payment-success`,
      customer: {
        email: email,
        name: 'LinkedIn Reply AI User'
      },
      customizations: {
        title: 'LinkedIn Reply AI Premium',
        description: 'Unlock unlimited AI replies',
        logo: 'https://linkdinereplyai.onrender.com/icons/icon128.png'
      }
    };

    const response = await flw.Charge.payment(paymentData);
    res.json(response);
  } catch (error) {
    console.error('Flutterwave payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment success callback
app.get('/payment-success', (req, res) => {
  const { status, tx_ref, transaction_id } = req.query;
  
  if (status === 'successful') {
    res.send(`
      <html>
        <head><title>Payment Successful</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #4CAF50;">✅ Payment Successful!</h1>
          <p>Thank you for upgrading to LinkedIn Reply AI Premium.</p>
          <p>Transaction ID: ${transaction_id}</p>
          <p>You can now close this window and return to the extension.</p>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <head><title>Payment Failed</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #f44336;">❌ Payment Failed</h1>
          <p>Something went wrong with your payment.</p>
          <p>Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

// Debug endpoint to check available models
app.get('/debug/models', async (req, res) => {
  try {
    const results = [];
    for (let i = 0; i < Math.min(3, GEMINI_API_KEYS.length); i++) {
      const models = await listAvailableModels(GEMINI_API_KEYS[i]);
      results.push({
        keyIndex: i + 1,
        keyPreview: GEMINI_API_KEYS[i].substring(0, 10) + '...',
        models: models?.map(m => ({ name: m.name, displayName: m.displayName })) || []
      });
    }
    res.json({
      success: true,
      apiVersion: GEMINI_API_VERSION,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List available models for an API key
 */
async function listAvailableModels(apiKey) {
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models?key=${apiKey}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`Failed to list models for key ${apiKey.substring(0, 10)}...: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`Available models for key ${apiKey.substring(0, 10)}...:`, 
      data.models?.map(m => m.name).filter(m => m.includes('gemini')) || 'No Gemini models found');
    return data.models || [];
  } catch (error) {
    console.error(`Error listing models for key ${apiKey.substring(0, 10)}...:`, error.message);
    return null;
  }
}

/**
 * Generate replies using Gemini API with API key rotation and model fallback
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
  const triedKeys = [];

  // Try each model option until one works
  for (const model of GEMINI_MODEL_OPTIONS) {
    const apiKey = getNextApiKey();
    triedKeys.push(apiKey.substring(0, 10) + '...');
    const apiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`;
    triedModels.push(model);

    console.log(`Trying model: ${model} with key: ${apiKey.substring(0, 15)}... (length: ${apiKey.length})`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`API Response Status: ${response.status} for model: ${model}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API error: ${response.status}`;

        console.log(`API Error Details:`, {
          model,
          status: response.status,
          message: errorMessage,
          apiKey: apiKey.substring(0, 10) + '...'
        });

        // Check if it's a rate limit error
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || response.status === 429) {
          rateLimitedKeys.add(apiKey);
          currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
          console.warn(`API key rate limited, switching to next key. Model ${model} failed.`);
          lastError = new Error(`Rate limit hit for key ending in ...${apiKey.substring(apiKey.length - 6)}`);
          continue;
        }

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
        console.log(`Invalid Response Format:`, data);
        continue;
      }

      // Success! Return the result
      console.log(`✅ SUCCESS! Used model: ${model} with key ending in ...${apiKey.substring(apiKey.length - 6)}`);
      return {
        text: data.candidates[0].content.parts[0].text,
        model: model,
        apiKey: apiKey.substring(0, 10) + '...'
      };
    } catch (error) {
      console.error(`❌ ERROR with model ${model} and key ${apiKey.substring(0, 10)}...:`, error.message);
      lastError = error;
      continue;
    }
  }

  // If we get here, all models and keys failed
  const errorMsg = `Unable to connect to Gemini API. Tried models: ${triedModels.join(', ')}. Tried keys: ${triedKeys.join(', ')}. ` +
    `Error: ${lastError?.message || 'Unknown error'}`;
  console.error(`❌ ALL MODELS AND KEYS FAILED:`, errorMsg);
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
    console.log('🔥 API called:', req.method, req.url);
    console.log('📄 Request body:', req.body);
    
    try {
      // Check validation errors
      const errors = validationResult(req);
      console.log('✅ Validation errors:', errors.array());
      
      if (!errors.isEmpty()) {
        console.log('❌ Validation failed:', errors.array());
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { pageText } = req.body;
      console.log('📝 Page text length:', pageText?.length || 0);

      // Generate replies using Gemini API
      console.log('🤖 Calling Gemini API...');
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

/**
 * POST /api/flutterwave/create-payment
 * Create Flutterwave payment link
 */
app.post('/api/flutterwave/create-payment',
  [
    // Input validation
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('tx_ref').isLength({ min: 1 }).withMessage('Transaction reference is required'),
    body('plan_type').isIn(['monthly', 'yearly', 'lifetime']).withMessage('Invalid plan type'),
    body('description').isLength({ min: 1 }).withMessage('Description is required')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { amount, currency, email, tx_ref, plan_type, description } = req.body;

      // Create payment link with Flutterwave
      const payload = {
        tx_ref: tx_ref,
        amount: amount,
        currency: currency,
        payment_options: 'card, ussd, mobilemoney, banktransfer',
        redirect_url: `${req.protocol}://${req.get('host')}/flutterwave/callback`,
        customer: {
          email: email,
          name: 'LinkedIn Reply AI User'
        },
        customizations: {
          title: 'LinkedIn Reply AI',
          description: description,
          logo: 'https://your-domain.com/logo.png' // TODO: Update with your logo URL
        }
      };

      const response = await flw.Charge.payment_link(payload);

      if (response.status === 'success') {
        res.json({
          success: true,
          data: {
            link: response.data.link,
            tx_ref: response.data.tx_ref
          },
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(response.message || 'Failed to create payment link');
      }

    } catch (error) {
      console.error('Error creating Flutterwave payment:', error);

      const errorMessage = NODE_ENV === 'production' 
        ? 'Failed to create payment. Please try again later.'
        : error.message;

      res.status(500).json({
        error: 'Internal server error',
        message: errorMessage
      });
    }
  }
);

/**
 * POST /api/flutterwave/webhook
 * Handle Flutterwave webhook events
 */
app.post('/api/flutterwave/webhook', (req, res) => {
  try {
    const webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    const secretHash = req.headers['verif-hash'];

    // Verify webhook signature
    if (!secretHash || (secretHash !== webhookHash)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = req.body;
    console.log('Flutterwave webhook received:', event);

    // Handle successful payment
    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const { tx_ref, customer, amount } = event.data;
      
      // Extract plan type from transaction reference
      const planType = tx_ref.split('-')[2]; // Format: pro-upgrade-{planType}-{timestamp}
      
      console.log(`Payment successful: ${planType} plan for ${customer.email}, Amount: ${amount}`);
      
      // TODO: Update user's pro status in your database
      // This would typically involve:
      // 1. Finding the user by email or extension ID
      // 2. Updating their subscription status
      // 3. Setting expiration date for monthly/yearly plans
      
      // For now, we'll just log the successful payment
      // In a real implementation, you'd store this in your database
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing Flutterwave webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /flutterwave/callback
 * Handle Flutterwave payment callback
 */
app.get('/flutterwave/callback', (req, res) => {
  const { status, tx_ref, transaction_id } = req.query;
  
  // Redirect back to extension with status
  // In a real implementation, you might want to show a success/failure page
  if (status === 'successful') {
    res.redirect(`https://your-extension-domain.com/success?tx_ref=${tx_ref}`);
  } else {
    res.redirect(`https://your-extension-domain.com/failure?tx_ref=${tx_ref}`);
  }
});

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

