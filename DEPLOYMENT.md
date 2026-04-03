# 🚀 THE SAIYANS - Deployment Guide

This guide explains how to deploy THE SAIYANS application to production.

## Architecture Overview

The application consists of two parts:

- **Frontend**: Static HTML/CSS/JS files (can be deployed to GitHub Pages, Netlify, Vercel, or any static hosting)
- **Backend**: Node.js Express server with SQLite database (needs server hosting: Heroku, Railway, Render, AWS, DigitalOcean, etc.)

## Deployment Options

### Option 1: GitHub Pages (Frontend) + Heroku (Backend) - Recommended for Beginners

#### Frontend Deployment (GitHub Pages)

1. Push your code to GitHub repository
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose your branch (usually `main`)
5. Your frontend will be available at: `https://yourgithubusername.github.io/The-Saiyans/`

#### Backend Deployment (Heroku)

1. **Install Heroku CLI**: Download from https://devcenter.heroku.com/articles/heroku-cli

2. **Create Heroku App**:

   ```bash
   heroku login
   heroku create saiyans-api
   ```

3. **Update .env for Production**:

   ```bash
   # Generate a secure JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Set environment variables on Heroku
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-generated-secure-key
   heroku config:set PORT=3001
   ```

4. **Add Procfile** (ensure it exists):

   ```
   web: node server.js
   ```

5. **Deploy**:

   ```bash
   git push heroku main
   ```

6. **Your API will be at**: `https://saiyans-api.herokuapp.com/api`

#### Update Frontend for Production

Edit your frontend files to point to the deployed backend:

**script.js** (line ~373):

```javascript
function getAPIBaseURL() {
  // Production backend URL
  if (window.location.hostname === "iceman-rgb.github.io") {
    return "https://saiyans-api.herokuapp.com/api"; // Replace with your Heroku URL
  }
  // Keep localhost for development
  return "http://localhost:3001/api";
}
```

Or set it via localStorage before loading the page:

```javascript
localStorage.setItem("backendApiUrl", "https://saiyans-api.herokuapp.com/api");
```

---

### Option 2: Railway.app (Full Stack - Simpler)

Railway automatically detects and deploys both frontend and backend from the same repository.

1. **Connect GitHub**:
   - Go to https://railway.app
   - Click "New Project"
   - Select your GitHub repository

2. **Configure Environment**:
   - Go to Variables tab
   - Add from `.env` file:
     - `NODE_ENV=production`
     - `JWT_SECRET=your-secure-key`
     - `PORT=3001`

3. **Deploy**: Railway auto-deploys on every push

4. **Frontend**: Served at the Railway URL root
5. **Backend**: Served at the Railway URL `/api`

---

### Option 3: Vercel (Frontend) + Cloud (Backend)

#### Frontend on Vercel:

```bash
npm install -g vercel
vercel
```

#### Backend on separate service (Render, Railway, or similar)

---

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure .env
cp .env.example .env
# Edit .env with your values

# 3. Start backend server
npm start
# Server runs at http://localhost:3001

# 4. Open frontend (in another terminal)
# Use VS Code Live Server or:
python -m http.server 5500
# Then open http://localhost:5500
```

## Environment Variables Checklist

Before deploying, ensure these are configured:

- [ ] `NODE_ENV=production`
- [ ] `PORT=3001` (or your deployed port)
- [ ] `JWT_SECRET` - Generate a secure random key (32+ characters)
- [ ] `ALLOWED_ORIGINS` - Include all frontend domains (comma-separated)
- [ ] `DATABASE_PATH` - Use SQLite or configure cloud database

## Security Checklist

- [ ] JWT secret is strong and random (not default)
- [ ] CORS includes only trusted origins
- [ ] HTTPS is enabled for production
- [ ] Rate limiting is active
- [ ] Database backups are configured
- [ ] Error messages don't expose sensitive information
- [ ] Helmet security headers are enabled
- [ ] HTTPS redirects from HTTP (if using SSL)

## Database Migration to Production

### SQLite (Current)

- Works for small deployments
- Data stored in `saiyans.db` file
- Backup by copying the file

### PostgreSQL (Recommended for Scale)

1. Update `server.js` to use PostgreSQL connection
2. Set `DATABASE_URL` environment variable
3. Run migrations to create tables

Example:

```javascript
// In server.js, use pg instead of sqlite3
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

## API Endpoint Reference

All endpoints are prefixed with `/api`:

- **Auth**: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`
- **Profile**: `/auth/profile`
- **Comments**: `GET /comments`, `POST /comments`
- **Quotes**: `GET /quotes`, `POST /quotes`
- **Notifications**: `GET /notifications`, `POST /notifications/:id/read`
- **Activity**: `GET /activity`
- **WebSocket**: Connect to `ws://hostname:port` for real-time updates

## CORS Configuration for Production

Update `server.js` line ~23 or `.env`:

```
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://yourgithubusername.github.io
```

## Monitoring & Logging

### Heroku Logs:

```bash
heroku logs --tail
```

### Local Testing:

```bash
npm run test-backend
# or manually test endpoints with curl:
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### "CORS error" or "Failed to fetch"

- Check that backend is running
- Verify frontend domain is in `ALLOWED_ORIGINS`
- Ensure API endpoint port is correct
- Check firewall/network settings

### "JWT_SECRET not set"

```bash
# Set it in your hosting platform:
heroku config:set JWT_SECRET=your-key
# or Railway/Render: Add to environment variables
```

### "Database locked" errors

- SQLite can have concurrency issues at scale
- Migrate to PostgreSQL for production
- Or use Railway/Render managed databases

### WebSocket connection fails

- Use `wss://` for HTTPS deployments
- Check WebSocket ports aren't blocked
- Verify hosting platform supports WebSocket

## Performance Optimization

1. **Enable CDN** for static frontend files
2. **Use database indexes** for frequently queried fields
3. **Implement caching** for API responses
4. **Enable gzip compression** (Helmet does this)
5. **Optimize images** in the Images/ folder
6. **Use lazy loading** for comments and quotes

## Backup & Recovery

### SQLite Backup:

```bash
# Download database
scp user@server:~/saiyans.db ./backup.db

# Or use your hosting platform's backup features
```

### Regular Backups:

- Schedule daily exports of user data
- Store in secure, separate location
- Test recovery procedures

## Custom Domain

### For GitHub Pages:

1. Buy a domain from Google Domains, Namecheap, etc.
2. In GitHub Settings → Pages → Custom domain
3. Add DNS records (CNAME or A record) as instructed

### For Backend:

1. Point API subdomain to your backend host
2. Enable SSL/HTTPS certificate (auto-renewal recommended)

## Next Steps

1. Test all features in production
2. Monitor logs and error rates
3. Set up automated backups
4. Configure email notifications for errors
5. Plan for scaling (load balancing, database replication)
6. Document any custom configurations

---

**Need Help?** Check individual platform documentation or open an issue on GitHub!
