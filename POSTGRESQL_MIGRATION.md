# PostgreSQL Migration Guide - THE SAIYANS

## ✅ Migration Complete!

Your backend has been successfully migrated from SQLite to PostgreSQL. This is **required for Render, Railway, and most cloud platforms**.

---

## 🎯 Quick Start

### Option 1: Deploy to Render with PostgreSQL (EASIEST)

Render includes free PostgreSQL! No setup needed.

1. Go to https://render.com
2. Create new Web Service from GitHub repo
3. Add Environment Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<your-generated-secret>
   DATABASE_URL=<Render auto-fills this>
   ALLOWED_ORIGINS=https://your-frontend-domain
   ```
4. Render auto-creates PostgreSQL database
5. Click Deploy

That's it! Render handles everything.

### Option 2: Deploy to Railway with PostgreSQL

Railway also includes free PostgreSQL.

1. Go to https://railway.app
2. Create new project from GitHub
3. Add PostgreSQL plugin in dashboard
4. Environment Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<your-generated-secret>
   DATABASE_URL=<Railway auto-fills this>
   ALLOWED_ORIGINS=https://your-frontend-domain
   ```
5. Deploy

---

## 💻 Local Development with PostgreSQL

If you want to test locally before deploying:

### Mac (using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create database
createdb saiyans

# In your .env file:
DATABASE_URL=postgresql://$(whoami)@localhost:5432/saiyans
```

### Windows (using PostgreSQL Installer)

1. Download from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for `postgres` user
4. Create database:
   ```bash
   createdb saiyans
   ```
5. In your .env file:
   ```
   DATABASE_URL=postgresql://postgres:your-password@localhost:5432/saiyans
   ```

### Linux (Ubuntu/Debian)

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb saiyans

# In .env file:
DATABASE_URL=postgresql://postgres@localhost:5432/saiyans
```

### Docker (Easiest Alternative)

```bash
# Run PostgreSQL in Docker
docker run --name saiyans-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=saiyans \
  -p 5432:5432 \
  -d postgres:latest

# In .env file:
DATABASE_URL=postgresql://postgres:password@localhost:5432/saiyans
```

---

## 🔧 Environment Variable Setup

### For Render:

Render auto-provides `DATABASE_URL` when you add PostgreSQL plugin.

Just manually add:

```env
NODE_ENV=production
JWT_SECRET=<your-secret>
ALLOWED_ORIGINS=https://your-frontend-domain
```

### For Railway:

Railway auto-provides `DATABASE_URL` from PostgreSQL plugin.

Add:

```env
NODE_ENV=production
JWT_SECRET=<your-secret>
ALLOWED_ORIGINS=https://your-frontend-domain
```

### For Self-Hosted:

```env
DATABASE_URL=postgresql://user:password@host:5432/saiyans
NODE_ENV=production
JWT_SECRET=<your-secret>
ALLOWED_ORIGINS=https://your-frontend-domain
```

---

## 🚀 What Changed

**Before**: SQLite (single file database)

```javascript
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("./saiyans.db");
```

**Now**: PostgreSQL (client-server database)

```javascript
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### Key Differences

| Aspect            | SQLite           | PostgreSQL            |
| ----------------- | ---------------- | --------------------- |
| File-based        | Yes              | No (client-server)    |
| Works in browser  | No               | No                    |
| Cloud-friendly    | ❌ No            | ✅ Yes                |
| External database | ❌ No            | ✅ Yes                |
| Concurrency       | Limited          | Excellent             |
| Query syntax      | `?` placeholders | `$1, $2` placeholders |

All business logic remains identical - only database driver changed!

---

## ✅ Database Tested

### Tables Created Automatically:

1. **users** - User accounts with bcryptjs password hashes
2. **comments** - Community comments (auto-expire after 5 days)
3. **quotes** - Anime quotes (pending approval)
4. **sessions** - Refresh tokens for authentication

All tables are created on first server start. No manual migration needed.

---

## 🔑 Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Examples:

```
# Render (auto-provided):
postgresql://user:xxxx@pg.render.com:5432/saiyans_prod

# Railway (auto-provided):
postgresql://user:xxxx@db.railway.internal:5432/railway

# Local development:
postgresql://postgres:password@localhost:5432/saiyans

# Self-hosted:
postgresql://admin:securepass@db.example.com:5432/saiyans
```

---

## 🧪 Test Database Connection

```bash
# Test connection (before deploying):
psql postgresql://user:password@host:5432/database

# Or use Node.js:
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Connection failed:', err);
  else console.log('✅ Connected! Time:', res.rows[0].now);
  process.exit(0);
});
"
```

---

## 🐛 Common Issues

### "Error: connect ECONNREFUSED"

```
✗ PostgreSQL not running
✓ Solution: Start PostgreSQL service (brew services start postgresql, systemctl, etc.)
```

### "Error: password authentication failed"

```
✗ Wrong password in DATABASE_URL
✓ Solution: Check password, reset if needed
```

### "Error: database does not exist"

```
✗ Database not created yet
✓ Solution: createdb saiyans
```

### "Error: PROTOCOL_ERROR: Column count mismatch"

```
✗ Old SQLite database still being referenced
✓ Solution: Ensure DATABASE_URL points to PostgreSQL, not SQLite file
```

---

## 📊 Query Syntax Changes

If you need to customize queries:

**SQLite (old):**

```javascript
db.run("INSERT INTO users VALUES (?, ?, ?)", [id, name, email]);
db.get("SELECT * FROM users WHERE id = ?", [id]);
```

**PostgreSQL (new):**

```javascript
await pool.query("INSERT INTO users VALUES ($1, $2, $3)", [id, name, email]);
const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
const rows = result.rows;
```

Key differences:

- Use `$1, $2, $3` instead of `?` for placeholders
- Use `async/await` instead of callbacks
- Results in `result.rows` array
- Single row: `result.rows[0]`
- Row count: `result.rowCount` (not `this.changes`)

---

## ✨ Benefits of PostgreSQL

✅ Cloud-ready (required for most platforms)
✅ Scales to millions of users
✅ Better performance with concurrent connections
✅ Supports complex queries
✅ Built-in security features
✅ Industry standard for production apps
✅ Better data integrity

---

## 📞 Deployment Checklist

- [ ] .env file has DATABASE_URL set correctly
- [ ] NODE_ENV set to "production"
- [ ] JWT_SECRET is long and random
- [ ] ALLOWED_ORIGINS includes your frontend domain
- [ ] PostgreSQL database created (if self-hosted)
- [ ] Database accessible from production environment
- [ ] Tables will auto-create on first run
- [ ] Can register new user without errors
- [ ] Can login successfully
- [ ] Tokens stored in localStorage working

---

## 🎉 You're Ready to Deploy!

Your backend is now PostgreSQL-compatible and ready for:

- **Render.com** ✅ (Recommended - easiest)
- **Railway.app** ✅ (Great alternative)
- **Heroku** ✅ (Using PostgreSQL addon)
- **Self-hosted** ✅ (With PostgreSQL server)
- **Any cloud platform** ✅ (With PostgreSQL database)

Choose your platform and deploy! 🚀
