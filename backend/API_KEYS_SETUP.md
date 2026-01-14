# 🔐 Where to Store Your API Keys

## Important: API Keys Are NOT in GitHub

Your `.env` file is **excluded from GitHub** (it's in `.gitignore`) to protect your secrets. However, you still need to create it locally and configure it on Render.

---

## 📍 Three Places to Store API Keys

### 1. **Local Development** (Your Computer)

Create a `.env` file in the `backend` folder for local development:

```bash
cd backend
cp .env.example .env
```

Then edit `.env` and add your actual API keys:

```env
# Replace these with your REAL Gemini API keys
GEMINI_API_KEYS=your_actual_key_1,your_actual_key_2,your_actual_key_3

PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_KEY_COOLDOWN_MS=3600000
```

**⚠️ This `.env` file stays on your computer only - never commit it to GitHub!**

---

### 2. **Render Production** (Cloud Server)

On Render, add environment variables through the **Render Dashboard**:

1. Go to your Render service dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEYS` | `your_key_1,your_key_2,your_key_3` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `ALLOWED_ORIGINS` | `*` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `API_KEY_COOLDOWN_MS` | `3600000` |

**✅ Render stores these securely - they're never in your code!**

---

### 3. **GitHub** (Template Only)

Only `.env.example` goes in GitHub - it's a **template** that shows what variables are needed, but contains no real keys:

```env
# This is just a template - safe to commit
GEMINI_API_KEYS=your_gemini_api_key_1,your_gemini_api_key_2,your_gemini_api_key_3
```

---

## 🔄 Workflow Summary

```
┌─────────────────────────────────────────────────┐
│  YOUR COMPUTER (Local Development)              │
│  └─ backend/.env                                │
│     ✅ Contains REAL API keys                   │
│     ❌ NOT in GitHub (.gitignore)               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  GITHUB (Public Repository)                     │
│  └─ backend/.env.example                        │
│     ✅ Template only (no real keys)             │
│     ✅ Safe to commit                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  RENDER (Production Server)                     │
│  └─ Environment Variables (Dashboard)            │
│     ✅ Contains REAL API keys                   │
│     ✅ Stored securely by Render                │
│     ❌ NOT in code repository                   │
└─────────────────────────────────────────────────┘
```

---

## ✅ Quick Setup Checklist

### Local Development:
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Edit `backend/.env` and add your real API keys
- [ ] Run `npm install` in backend folder
- [ ] Run `npm run dev` to start server
- [ ] Verify `.env` is in `.gitignore` (it should be)

### Render Production:
- [ ] Deploy code to GitHub
- [ ] Create Render web service
- [ ] Add environment variables in Render dashboard
- [ ] Deploy and test

---

## 🛡️ Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use different keys for dev/prod** - Don't use production keys locally
3. **Rotate keys regularly** - If a key is exposed, rotate it immediately
4. **Use multiple keys** - The rotation system helps when one key hits limits
5. **Don't share `.env` files** - Even in private messages or screenshots

---

## 🆘 Troubleshooting

### "GEMINI_API_KEY not found" error?
- ✅ Check `.env` file exists in `backend/` folder
- ✅ Check `.env` has `GEMINI_API_KEYS=` or `GEMINI_API_KEY=` set
- ✅ Restart your server after creating/editing `.env`

### Keys not working on Render?
- ✅ Check environment variables are set in Render dashboard
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Redeploy after adding/changing variables

---

## 📝 Example `.env` File (Local)

```env
# Your actual Gemini API keys (comma-separated)
GEMINI_API_KEYS=AIzaSyExample1,AIzaSyExample2,AIzaSyExample3

# Server config
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=*

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Key rotation cooldown (1 hour)
API_KEY_COOLDOWN_MS=3600000
```

**Remember:** Replace `AIzaSyExample1,AIzaSyExample2,AIzaSyExample3` with your real API keys!

