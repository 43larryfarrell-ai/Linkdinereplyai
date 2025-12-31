# 🚀 GitHub Setup Guide

## Step-by-Step Instructions to Push Your Code to GitHub

### Option 1: Using Cursor's Built-in Git (Easiest) ⭐

Since you've connected Cursor to GitHub, this is the easiest way:

1. **Open Source Control in Cursor:**
   - Press `Ctrl+Shift+G` OR
   - Click the Source Control icon in the left sidebar (looks like a branch/fork icon)

2. **Stage All Files:**
   - You'll see a list of files with "+" buttons
   - Click the "+" next to "Changes" to stage all files
   - OR click individual "+" buttons for specific files

3. **Commit Your Changes:**
   - Type a commit message in the box at the top (e.g., "Initial commit: LinkedIn Reply AI")
   - Press `Ctrl+Enter` or click the checkmark ✓ button

4. **Push to GitHub:**
   - Click the "..." (three dots) menu at the top
   - Select "Push" or "Publish Branch"
   - If it's your first time, Cursor will ask you to create a repository on GitHub
   - Follow the prompts to create and push!

---

### Option 2: Using Command Line (If Git is installed)

#### Step 1: Restart Your Terminal
After installing Git, **close and reopen** PowerShell/Command Prompt, or restart Cursor.

#### Step 2: Initialize Git Repository
```bash
cd "C:\Users\hp\Downloads\LinkedInReplyAI\LinkedInReplyAI"
git init
```

#### Step 3: Configure Git (First Time Only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Step 4: Add All Files
```bash
git add .
```

#### Step 5: Create First Commit
```bash
git commit -m "Initial commit: LinkedIn Reply AI with API key rotation"
```

#### Step 6: Create Repository on GitHub
1. Go to [github.com](https://github.com)
2. Click the "+" icon → "New repository"
3. Name it: `LinkedInReplyAI` (or any name you like)
4. **Don't** initialize with README (you already have files)
5. Click "Create repository"

#### Step 7: Connect and Push
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace:
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

---

### Option 3: Using GitHub Desktop (If Installed)

1. Open GitHub Desktop
2. Click "File" → "Add Local Repository"
3. Browse to: `C:\Users\hp\Downloads\LinkedInReplyAI\LinkedInReplyAI`
4. Click "Publish repository" button
5. Follow the prompts to create and push to GitHub

---

## ✅ What Gets Pushed to GitHub

**Files that WILL be in GitHub:**
- ✅ All source code (`.js`, `.html`, `.json` files)
- ✅ Documentation (`.md` files)
- ✅ Configuration files (`package.json`, `manifest.json`, `render.yaml`)
- ✅ `.env.example` (template, no secrets)

**Files that WON'T be in GitHub (protected by `.gitignore`):**
- ❌ `backend/.env` (contains your API keys)
- ❌ `node_modules/` (dependencies)
- ❌ Log files
- ❌ OS/IDE files

---

## 🆘 Troubleshooting

### "Git is not recognized"
- **Solution:** Restart your terminal/PowerShell after installing Git
- OR use Cursor's built-in Git (Option 1 above)

### "Permission denied" or authentication errors
- **Solution:** You may need to authenticate. GitHub Desktop handles this automatically, or use GitHub CLI

### "Repository already exists"
- **Solution:** If you already created a repo on GitHub, just connect to it:
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
  ```

---

## 📝 Quick Checklist

- [ ] Files are ready (`.env` deleted, `.gitignore` in place)
- [ ] Git repository initialized
- [ ] Files staged and committed
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Verify files on GitHub (check that `.env` is NOT there)

---

## 🎯 Recommended: Use Cursor's Git Integration

Since you've already connected Cursor to GitHub, **Option 1 is the easiest** - just use the Source Control panel in Cursor!

