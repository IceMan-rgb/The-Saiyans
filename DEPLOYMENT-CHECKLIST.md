# 🚀 Production Deployment Checklist

Use this checklist before deploying THE SAIYANS to production.

## Backend Security

- [ ] **JWT Secret**: Generated strong random secret (32+ characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] **Environment Variables**:
  - [ ] `NODE_ENV=production` (not development)
  - [ ] `JWT_SECRET` set to secure value in production
  - [ ] `PORT` configured for your hosting (usually 3000, 8080, or assigned by platform)
  - [ ] `ALLOWED_ORIGINS` includes only trusted frontend domains

- [ ] **Database**:
  - [ ] Database file has proper permissions (readable/writable)
  - [ ] Backups are scheduled
  - [ ] Consider migrating to PostgreSQL for better scaling

- [ ] **Admin Account**:
  - [ ] Default admin password changed
  - [ ] Or create new admin account and delete default

- [ ] **Middleware**:
  - [ ] Helmet security headers enabled (✅ already configured)
  - [ ] CORS properly configured (✅ dynamic origin support)
  - [ ] Rate limiting configured (✅ enabled)
  - [ ] Input validation active (✅ enabled)

## Frontend Configuration

- [ ] **API URLs**:
  - [ ] `script.js` uses `getAPIBaseURL()` function (✅ implemented)
  - [ ] `dashboard.html` uses dynamic API detection (✅ implemented)
  - [ ] `register.html` uses dynamic API detection (✅ implemented)
  - [ ] All hardcoded `localhost:3001` removed (✅ fixed)

- [ ] **Navigation Links**:
  - [ ] No links to deleted pages (Association.html → index.html)
  - [ ] All navigation updated (✅ fixed)

- [ ] **Environment Detection**:
  - [ ] Frontend properly detects production backend URL
  - [ ] WebSocket URL configured for production (wss:// for HTTPS)

## Hosting Configuration

### For Heroku:

- [ ] `Procfile` exists with correct startup command (✅ created)
- [ ] `package.json` has correct start script
- [ ] `package-lock.json` committed to repository
- [ ] Environment variables set via Heroku dashboard or CLI

### For Railway/Render:

- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`

### For Other Platforms:

- [ ] Memory/CPU requirements met
- [ ] Node.js version compatible (v14+)
- [ ] Database storage available
- [ ] WebSocket support enabled (if using real-time features)

## HTTPS & SSL

- [ ] SSL certificate installed or auto-provisioned
- [ ] HTTPS redirects from HTTP
- [ ] Mixed content warnings resolved
- [ ] WebSocket uses `wss://` instead of `ws://`

## Testing Before Production

```bash
# 1. Test backend locally
npm install
npm run init-db
npm start

# 2. Test all endpoints
npm test

# 3. Test authentication workflow
# - Register new user
# - Login with new user
# - Access protected endpoints

# 4. Test data persistence
# - Add comments/quotes
# - Refresh page
# - Verify data still exists

# 5. Test error handling
# - Invalid credentials
# - Missing required fields
# - Rate limiting (make multiple requests)

# 6. Test frontend with deployed backend
# - Update API URL in code or localStorage
# - Test all features (login, register, comments, etc.)
```

## CORS Configuration Verification

Ensure `ALLOWED_ORIGINS` includes:

- [ ] Your GitHub Pages domain (e.g., `https://username.github.io/The-Saiyans`)
- [ ] Your custom domain (if applicable)
- [ ] Remove or comment out localhost entries for production
- [ ] No wildcard `*` unless development/testing

## Production Database Considerations

### SQLite (Current)

- ✅ Good for: Under 10k users, simple deployments
- ⚠️ Issues at scale: Single file, limited concurrency
- 📈 Upgrade path: PostgreSQL

### PostgreSQL (Recommended)

- ✅ Better for: Production, scaling, multiple connections
- ⚠️ Requires: Cloud database service or managed hosting

**Migration Steps**:

1. Set up PostgreSQL database
2. Get connection string (DATABASE_URL)
3. Update `server.js` to use PostgreSQL driver
4. Run migrations to create tables
5. Test with production data

## Monitoring & Logging

- [ ] Error tracking configured (Sentry, LogRocket, etc.)
- [ ] Uptime monitoring enabled (Uptime Robot, Pingdom)
- [ ] Logs stored in persistent location
- [ ] Alert notifications configured for critical errors

## Backup & Recovery

- [ ] Automated daily backups scheduled
- [ ] Database exports stored securely
- [ ] Recovery tested (restore and verify data)
- [ ] Backup storage has redundancy

## Performance Optimization

- [ ] Database indexes verified (✅ configured)
- [ ] Image assets optimized
- [ ] Gzip compression enabled (✅ Helmet does this)
- [ ] CSS/JS minified (optional but recommended)

## First-Time Production Checks

After deploying:

1. [ ] **Visits** frontend URL - pages load correctly
2. [ ] **Checks** backend health: `GET /api/health`
3. [ ] **Tests** registration workflow
4. [ ] **Tests** login/logout
5. [ ] **Verifies** JWT tokens in localStorage
6. [ ] **Checks** CORS headers in response
7. [ ] **Tests** all API endpoints
8. [ ] **Monitors** server logs for errors
9. [ ] **Checks** database connectivity
10. [ ] **Tests** rate limiting
11. [ ] **Verifies** SSL certificate validity
12. [ ] **Checks** all navigation links

## Documentation & Handoff

- [ ] Deployment steps documented
- [ ] Authentication credentials stored securely (not in code)
- [ ] Emergency contacts listed
- [ ] Rollback procedure documented
- [ ] Team trained on maintenance procedures

## Post-Deploy Improvements

- [ ] Set up continuous deployment (auto-deploy on push)
- [ ] Add automated tests/CI/CD pipeline
- [ ] Implement feature flags for gradual rollouts
- [ ] Configure analytics and monitoring
- [ ] Plan capacity for expected growth

---

## Quick Reference

**Heroku Quick Deploy:**

```bash
heroku login
heroku create saiyans-api
heroku config:set NODE_ENV=production JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
git push heroku main
heroku logs --tail
```

**Railway Quick Setup:**

- Connect GitHub repo to Railway.app
- Add environment variables in Variables tab
- Auto-deploys on every push

**Local Testing:**

```bash
npm install && npm run init-db && npm start
# Frontend: Open in browser or use Live Server
```

---

✅ **When all items are checked**, you're ready for production deployment!
