const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // npm install node-fetch
require('dotenv').config(); // Load .env locally

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (popup.html, popup.js)
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Root route (test if server is live)
app.get('/', (req, res) => {
  res.send('Server is live!');
});

// /api/reply route for your extension
app.post('/api/reply', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt missing' });

  try {
    // Call Gemini API
    const response = await fetch('https://api.gemini.com/v1/ai', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    res.json({ reply: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gemini API error' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
