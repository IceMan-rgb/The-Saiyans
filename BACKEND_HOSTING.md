# Backend Hosting Configuration Guide

## Overview

After deploying your frontend to GitHub Pages, you need to host the backend API on a separate platform. This guide covers the most popular options.

---

## Quick Comparison

| Platform        | Free Tier        | Startup Speed | Ease        | Best For          |
| --------------- | ---------------- | ------------- | ----------- | ----------------- |
| **Railway**     | ✅ $5/mo         | ⚡ Fast       | ⭐⭐⭐ Easy | **RECOMMENDED**   |
| **Render**      | ✅ Free (sleeps) | 🐢 Slower     | ⭐⭐⭐ Easy | Small projects    |
| **Heroku**      | ❌ Paid only     | ⚡ Very Fast  | ⭐⭐ Medium | Production        |
| **Fly.io**      | ✅ Free tier     | ⚡ Very Fast  | ⭐⭐ Medium | Global deployment |
| **Self-hosted** | 💰 VPS cost      | Varies        | ⭐ Hard     | Full control      |

---

## 🎯 Railway.app (RECOMMENDED)

Railway is the easiest and most reliable for this project.

### Setup Steps

#### 1. Create Account

- Go to https://railway.app
- Sign up with GitHub (easiest)
- Connect your GitHub account

#### 2. Create New Project

```bash
# Option A: Via CLI (if you have Railway CLI installed)
npm install -g @railway/cli
railway login
railway init
railway add

# Option B: Via Web Dashboard
# Click "Create New" → "Deploy from GitHub"
# Select your The-Saiyans repository
```

#### 3. Configure Environment Variables

In Railway Dashboard:

1. Click on your project
2. Go to **Variables**
3. Add these variables:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-a-secure-key>
DATABASE_PATH=./saiyans.db
ALLOWED_ORIGINS=https://username.github.io/The-Saiyans,https://your-custom-domain.com
```

#### 4. Generate JWT Secret

In your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as JWT_SECRET value.

#### 5. Deploy

```bash
# Via CLI
railway up

# Or just commit your code and Railway auto-deploys from GitHub
```

#### 6. Get Your API URL

In Railway Dashboard:

- Your URL will be like: `https://the-saiyans-prod-xxxx.up.railway.app`
- Use this in your frontend: `https://the-saiyans-prod-xxxx.up.railway.app/api`

#### 7. Connect to Frontend

Update `login.html`, `register.html`, `dashboard.html`:

```javascript
// Change this line (around line 195):
if (window.location.hostname === "iceman-rgb.github.io")
  return "https://the-saiyans-prod-xxxx.up.railway.app/api"; // ← Update this
```

### Database Persistence on Railway

Railway automatically persists your SQLite database. But it's ephemeral, so you have two options:

**Option 1: Use Railway PostgreSQL (Recommended for production)**

```bash
# In Railway, add PostgreSQL plugin
# Update server.js to use PostgreSQL instead of SQLite
```

**Option 2: Keep SQLite (Good enough for small projects)**

```bash
# SQLite database (./saiyans.db) automatically persists on Railway
# Works for up to ~1000 concurrent users
```

---

## 💜 Render.com

Good alternative if Railway has issues.

### Setup Steps

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: `the-saiyans-api`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Paid for performance)

6. Add Environment Variables:
   - Click on your service
   - Go to **Environment**
   - Add variables same as Railway above

7. Get your URL (like `https://the-saiyans-api.onrender.com`)

### ⚠️ Render Free Tier Limitation

- Services spin down after 15 minutes of inactivity
- First request after sleep takes 30+ seconds
- Better for testing, use paid for production

---

## 🚀 Heroku (Legacy but Reliable)

Heroku removed free tier, but still reliable for paid plans.

### Setup Steps

```bash
# 1. Install Heroku CLI
curl https://cli.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Create app
heroku create your-app-name

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set ALLOWED_ORIGINS="https://iceman-rgb.github.io/The-Saiyans"

# 5. Deploy
git push heroku main

# 6. Check logs
heroku logs --tail
```

Your API URL: `https://your-app-name.herokuapp.com/api`

---

## 🪶 Fly.io

Fast, global deployment with generous free tier.

### Setup Steps

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Launch
fly launch --name the-saiyans-api

# 4. Set secrets
fly secrets set NODE_ENV=production
fly secrets set JWT_SECRET="your-secret-key"
fly secrets set ALLOWED_ORIGINS="https://iceman-rb.github.io/The-Saiyans"

# 5. Deploy
fly deploy
```

Your API URL: `https://the-saiyans-api.fly.dev/api`

---

## 💻 Self-Hosted (Advanced)

If you have your own VPS or server:

### On Your Server

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Clone repo
git clone https://github.com/your-username/The-Saiyans.git
cd The-Saiyans

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install dependencies
npm install

# 5. Create .env file
cp .env.example .env
nano .env  # Edit with your values

# 6. Start server with PM2 (keeps running)
npm install -g pm2
pm2 start server.js --name "saiyans-api"
pm2 startup
pm2 save

# 7. Setup Nginx reverse proxy
sudo apt install nginx
# Configure nginx to forward to http://localhost:3001
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📊 Monitoring & Logs

### Railway

```bash
railroad logs -f  # Real-time logs
```

### Render

- Dashboard → Logs tab

### Heroku

```bash
heroku logs --tail
```

### Fly.io

```bash
fly logs
```

---

## 🔧 Common Issues & Solutions

### Issue: Database Not Persisting

```
✗ Problem: Data lost after server restart
✓ Solution: Use Railway PostgreSQL or Render PostgreSQL
✓ Or: Upload SQLite to persistent storage
```

### Issue: CORS Error on Production

```
✗ Error: "Access-Control-Allow-Origin" missing
✓ Solution:
  - Update ALLOWED_ORIGINS in backend .env
  - Include full GitHub Pages URL: https://username.github.io/The-Saiyans
  - Restart backend service
```

### Issue: JWT Secret not Loading

```
✗ Error: "JWT error" or "token invalid"
✓ Solution:
  - Verify JWT_SECRET is set in environment variables
  - Use strong random string (32+ chars)
  - Restart backend after setting
```

### Issue: Too Many Login Attempts (429 error)

```
✗ Problem: Rate limiting is blocking you
✓ Solution:
  - Wait 15 minutes or
  - Contact admin to restart rate limiter or
  - Check for automated login attempts
```

---

## ✅ Final Checklist

After deploying backend:

- [ ] Backend API running and accessible at `https://your-api.com/api`
- [ ] JWT_SECRET configured and strong
- [ ] NODE_ENV set to "production"
- [ ] ALLOWED_ORIGINS includes your GitHub Pages URL
- [ ] Database initialized (tables exist)
- [ ] Can register new user without errors
- [ ] Can login successfully and get tokens
- [ ] Frontend receives proper CORS headers
- [ ] No "Cannot connect to server" errors on frontend
- [ ] Rate limiting active (protection against brute force)

---

## 📞 Quick Contact & Resources

| Issue           | Resource                      |
| --------------- | ----------------------------- |
| Railway support | https://railway.app/support   |
| Render docs     | https://render.com/docs       |
| Heroku docs     | https://devcenter.heroku.com/ |
| Fly.io docs     | https://fly.io/docs/          |

---

**Next Step**: Deploy your backend using one of these methods, then update the frontend API URLs!
