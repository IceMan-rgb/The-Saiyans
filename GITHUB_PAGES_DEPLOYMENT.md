# GitHub Pages Deployment Guide for THE SAIYANS

## 🚀 Overview

This guide covers deploying **THE SAIYANS** frontend to GitHub Pages and configuring it to work with a production backend API.

**What gets deployed**: Frontend (HTML, CSS, JavaScript)
**What stays separate**: Backend API (Node.js/Express)

---

## 📋 Prerequisites

- GitHub repository with the code
- Backend API deployed to a platform like:
  - ✅ Heroku (legacy, still works)
  - ✅ Railway.app
  - ✅ Render.com
  - ✅ Vercel
  - ✅ Self-hosted server
- Git installed locally

---

## Step 1: Enable GitHub Pages

### Option A: Using GitHub Web Interface

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **main** (or your default branch)
4. Click **Save**
5. Wait 1-2 minutes for GitHub to build and deploy
6. Your site will be available at: `https://username.github.io/The-Saiyans`

### Option B: Using Command Line

```bash
# No command needed! GitHub detects and auto-builds from master/main branch
# Just push your code and GitHub Pages will automatically deploy
```

---

## Step 2: Deploy Backend API

Your backend needs to be hosted separately. Choose one:

### 🎯 **Recommended: Railway.app** (Easiest)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize Railway project
railway init

# 4. Add environment variables
railway variables set JWT_SECRET="your-secure-secret-key-here"
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS="https://username.github.io/The-Saiyans"

# 5. Deploy
railway up

# 6. Get your API URL
railway link  # Shows your production URL
```

### Alternative: Heroku

```bash
# 1. Install Heroku CLI
# 2. heroku login
# 3. heroku create your-app-name
# 4. git push heroku main
# 5. heroku config:set JWT_SECRET="your-secure-key"
```

### Alternative: Render.com

```bash
# 1. Connect your GitHub repo
# 2. Create new Web Service
# 3. Set build: npm install
# 4. Set start: npm start
# 5. Add environment variables in dashboard
```

---

## Step 3: Update Frontend API Configuration

The frontend automatically detects and uses different API URLs based on hostname:

**In `login.html` (lines ~195-215):**

```javascript
function getAPIBaseURL() {
  // Check if backend URL is specified in window config
  if (window.BACKEND_API_URL) return window.BACKEND_API_URL;

  // Check localStorage for stored backend URL
  const storedUrl = localStorage.getItem("backendApiUrl");
  if (storedUrl) return storedUrl;

  // For localhost development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:3001/api";
  }

  // For GitHub Pages - UPDATE THIS with your production backend
  if (window.location.hostname === "iceman-rgb.github.io") {
    return "https://your-railway-app-name.up.railway.app/api"; // ← UPDATE THIS
  }

  return "http://localhost:3001/api";
}
```

### 🔧 Update Your Production API URL

Find the line with `iceman-rgb.github.io` and update it:

```javascript
// OLD:
if (window.location.hostname === "iceman-rgb.github.io")
  return "https://saiyans-api.herokuapp.com/api";

// NEW (with Railway):
if (window.location.hostname === "iceman-rgb.github.io")
  return "https://your-railway-app-name.up.railway.app/api";

// NEW (with Render):
if (window.location.hostname === "iceman-rgb.github.io")
  return "https://your-app-name.onrender.com/api";
```

Do the same for `register.html` and `dashboard.html`.

**Alternative (Better): Use Environment Variable**

Instead of hardcoding, you can set it dynamically:

```html
<script>
  // At the top of your page (before other scripts)
  window.BACKEND_API_URL = "https://your-railway-app-name.up.railway.app/api";
</script>
```

---

## Step 4: Configure CORS on Backend

In your production `.env` file on your backend server:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://username.github.io/The-Saiyans,https://your-backend-domain.com
JWT_SECRET=your-super-secure-random-key-here
```

**Generate a secure JWT_SECRET:**

```bash
# Run this in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5: Test Your Deployment

### Test URL Structure

- **Frontend**: `https://iceman-rgb.github.io/The-Saiyans/login.html`
- **Backend API**: `https://your-backend.app/api/auth/login`

### Test Login Flow

1. Open your GitHub Pages URL: `https://username.github.io/The-Saiyans/`
2. Go to **Login** page
3. Try logging in (or register first if no account)
4. Open **Developer Console** (F12) and check:
   - Network tab should show requests to your production backend
   - Console should show: `📡 API Base URL: https://your-backend.app/api`
   - No CORS errors

### Debug CORS Issues

If you see CORS errors in console:

1. Check that frontend domain is in `ALLOWED_ORIGINS` on backend
2. Format: `https://username.github.io/The-Saiyans` (with `/The-Saiyans`)
3. Restart your backend service

---

## Step 6: Automate Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v3
        with:
          build_dir: .
          keep_history: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This automatically deploys every time you push to `main`.

---

## 📊 Deployment Checklist

- [ ] GitHub Pages enabled in repository settings
- [ ] Backend API deployed (Railway/Heroku/Render)
- [ ] Backend `.env` configured with production JWT_SECRET
- [ ] Backend `.env` ALLOWED_ORIGINS includes your GitHub Pages URL
- [ ] Frontend API URLs updated in all HTML files
- [ ] No CORS errors in browser console
- [ ] Login/Register forms work with production backend
- [ ] Dashboard loads user profile from production API
- [ ] GitHub Actions workflow set up (optional but recommended)
- [ ] Tokens stored in localStorage working correctly

---

## 🔐 Security Checklist

- ✅ JWT_SECRET is strong (32+ random characters)
- ✅ .env file is in .gitignore (never commit secrets)
- ✅ NODE_ENV set to "production" on production server
- ✅ CORS origins restricted to your domain only
- ✅ HTTPS enforced (GitHub Pages auto-uses HTTPS)
- ✅ Rate limiting active on backend
- ✅ Passwords hashed with bcryptjs (salt 12)
- ✅ No sensitive data in HTML/JavaScript files

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"

```
✗ Solution: Check API URL in login.html matches your production backend
✗ Check browser console Network tab for 404 or CORS errors
✗ Verify backend domain in ALLOWED_ORIGINS on server
```

### Issue: CORS Error - "No 'Access-Control-Allow-Origin'"

```
✗ Solution: Update ALLOWED_ORIGINS in backend .env:
  ALLOWED_ORIGINS=https://username.github.io/The-Saiyans
✗ Restart backend server after updating .env
```

### Issue: GitHub Pages shows blank page

```
✗ Solution: Check that HTML files are in root directory:
  - index.html ✓
  - login.html ✓
  - register.html ✓
  - dashboard.html ✓
  - style.css ✓
  - script.js ✓
```

### Issue: Tokens not persisting

```
✗ Solution: Check localStorage is enabled:
  - Inspect → Application → Local Storage
  - Should show accessToken, refreshToken, userData
```

---

## 📱 Useful URLs

- **GitHub Pages**: `https://username.github.io/The-Saiyans`
- **Railway Dashboard**: https://railway.app/dashboard
- **Heroku Dashboard**: https://dashboard.heroku.com/apps
- **Render Dashboard**: https://dashboard.render.com

---

## ✅ Next Steps

1. Deploy backend to Railway/Heroku/Render
2. Update API URLs in HTML files
3. Push code to GitHub
4. Test at your GitHub Pages URL
5. Monitor for errors in browser console

**Questions?** Check **TROUBLESHOOTING.md** or review **DEPLOYMENT_GUIDE.md** for additional details.
