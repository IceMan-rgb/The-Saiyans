# 🚀 COMPLETE GITHUB DEPLOYMENT SETUP GUIDE

## Overview

This guide provides step-by-step instructions to deploy **THE SAIYANS** to production:

- **Frontend** → GitHub Pages (automatic)
- **Backend** → Railway/Heroku/Render (your choice)

**Time to complete**: ~15 minutes

---

## Phase 1: Enable GitHub Pages (2 minutes)

### Step 1: Go to Repository Settings

1. Visit your repo: `https://github.com/iceman-rgb/The-Saiyans`
2. Click **Settings** (top right)
3. Click **Pages** (left sidebar)

### Step 2: Configure GitHub Pages

1. Under "Build and deployment" → "Source"
2. Select **Deploy from a branch**
3. Select branch: **main** (or master)
4. Click **Save**

GitHub will automatically build and deploy your frontend!

### Step 3: View Your Site

After ~1-2 minutes:

- Your site will be available at: `https://iceman-rgb.github.io/The-Saiyans/`
- GitHub will show the URL in the Pages section

**✅ Frontend deployed!** Now let's deploy the backend.

---

## Phase 2: Deploy Backend (10 minutes)

Choose ONE of the following options:

### Option A: Railway (RECOMMENDED - Easiest)

```bash
# 1. Go to https://railway.app and sign up with GitHub

# 2. Click "New Project" in Railway dashboard

# 3. Select "Deploy from GitHub"

# 4. Choose your repository and connect

# 5. Railway will auto-detect it's a Node.js project

# 6. Add environment variables:
#    - PORT: 3001
#    - NODE_ENV: production
#    - JWT_SECRET: (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
#    - ALLOWED_ORIGINS: https://iceman-rgb.github.io/The-Saiyans

# 7. Click "Deploy"

# 8. Get your API URL from Railway dashboard (looks like: https://the-saiyans-xxxx.up.railway.app)
```

### Option B: Render.com

```bash
# 1. Go to https://render.com and sign up with GitHub

# 2. Click "New +" and select "Web Service"

# 3. Connect your GitHub repo

# 4. Configure:
#    - Name: the-saiyans-api
#    - Build Command: npm install
#    - Start Command: npm start
#    - Plan: Free (or Paid)

# 5. Add environment variables (see above)

# 6. Click "Deploy"

# 7. Get your URL (format: https://the-saiyans-api.onrender.com)
```

### Option C: Heroku

```bash
# 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

# 2. heroku login

# 3. heroku create your-app-name

# 4. Set variables:
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set ALLOWED_ORIGINS="https://iceman-rgb.github.io/The-Saiyans"

# 5. git push heroku main

# 6. Your URL: https://your-app-name.herokuapp.com
```

**Save your backend API URL for the next step!** (e.g., `https://the-saiyans-xxxx.up.railway.app`)

---

## Phase 3: Connect Frontend to Backend (3 minutes)

### Step 1: Update API URLs

Edit these files and replace the API URL:

**File 1: `login.html`** (around line 200)

Find:

```javascript
if (window.location.hostname === "iceman-rgb.github.io")
  return "https://saiyans-api.herokuapp.com/api";
```

Replace with:

```javascript
if (window.location.hostname === "iceman-rgb.github.io")
  return "https://your-railway-url.up.railway.app/api"; // ← Update this
```

**File 2: `register.html`** (same change, around line 200)

**File 3: `dashboard.html`** (same change, around line 100)

### Step 2: Commit and Push

```bash
git add .
git commit -m "Update production API URLs for GitHub Pages deployment"
git push origin main
```

GitHub will automatically redeploy your frontend with the new API URLs!

### Step 3: Test

1. Wait 1-2 minutes for GitHub Pages to rebuild
2. Go to: `https://iceman-rgb.github.io/The-Saiyans/`
3. Try to **Register** a new account
4. Try to **Login** with that account
5. Open browser **DevTools** (F12) → **Console** and verify:
   - `📡 API Base URL: https://your-backend-url/api` ✅
   - No red CORS errors ✅

---

## ✅ Deployment Checklist

- [ ] GitHub Pages enabled in repository settings
- [ ] Frontend deployed to `https://iceman-rgb.github.io/The-Saiyans/`
- [ ] Backend deployed to Railway/Heroku/Render
- [ ] Backend `.env` has production values:
  - [ ] NODE_ENV=production
  - [ ] JWT_SECRET is strong (32+ chars)
  - [ ] ALLOWED_ORIGINS includes your GitHub Pages URL
- [ ] Frontend API URLs updated in login.html, register.html, dashboard.html
- [ ] Changes pushed to GitHub
- [ ] Frontend redeploys (wait 1-2 min)
- [ ] No CORS errors in browser console
- [ ] Can register new user successfully
- [ ] Can login and see dashboard
- [ ] Tokens saved in localStorage

---

## 🧪 Testing Your Deployment

### Test 1: Frontend Accessible

```bash
# Should return HTML (not 404)
curl -I https://iceman-rgb.github.io/The-Saiyans/
```

### Test 2: Backend Accessible

```bash
# Should return JSON response
curl https://your-backend-url/api/health
```

### Test 3: Registration Works

1. Open `https://iceman-rgb.github.io/The-Saiyans/register.html`
2. Fill in form: username, email, password
3. Click Register
4. Should redirect to dashboard (not show error)

### Test 4: Login Works

1. Go to login page
2. Enter credentials
3. Should get accessToken in console
4. Should redirect to dashboard

### Test 5: CORS Configured

1. Open DevTools (F12) → **Network** tab
2. Try to login
3. Click on the `/api/auth/login` request
4. Look for header: `Access-Control-Allow-Origin: https://iceman-rgb.github.io`
5. If missing = CORS not configured on backend

---

## 🐛 Troubleshooting

| Error                          | Solution                                           |
| ------------------------------ | -------------------------------------------------- |
| **"Cannot connect to server"** | Check API URL in HTML matches your backend domain  |
| **CORS Error**                 | Update ALLOWED_ORIGINS in backend .env and restart |
| **401 Unauthorized**           | JWT_SECRET mismatch between frontend and backend   |
| **Rate limited (429)**         | Wait 15 minutes or restart backend                 |
| **Blank page after register**  | Check browser console for errors (F12)             |
| **Database error**             | Ensure DATABASE_PATH is writable on backend server |

See **TROUBLESHOOTING.md** for more solutions.

---

## 📱 Your Production URLs

**Frontend:**

- Home: https://iceman-rgb.github.io/The-Saiyans/
- Login: https://iceman-rgb.github.io/The-Saiyans/login.html
- Register: https://iceman-rgb.github.io/The-Saiyans/register.html
- Dashboard: https://iceman-rgb.github.io/The-Saiyans/dashboard.html

**Backend (example with Railway):**

- API Base: https://the-saiyans-xxxx.up.railway.app/api
- Register: https://the-saiyans-xxxx.up.railway.app/api/auth/register
- Login: https://the-saiyans-xxxx.up.railway.app/api/auth/login

---

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Railway Documentation](https://railway.app/docs)
- [Render Documentation](https://render.com/docs)
- [Heroku Documentation](https://devcenter.heroku.com/)
- [Your BACKEND_HOSTING.md](./BACKEND_HOSTING.md) - Detailed backend setup
- [Your GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md) - GitHub Pages configuration

---

## 🎉 Success!

Once all tests pass:

1. Share your site: `https://iceman-rgb.github.io/The-Saiyans/`
2. Your authentication system is fully production-ready
3. Users can register, login, and access protected content
4. All data is persisted in production database
5. Rate limiting protects against abuse

**Congratulations on your production deployment!** 🚀
