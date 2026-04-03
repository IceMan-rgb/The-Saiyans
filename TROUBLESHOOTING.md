# 🔧 Quick Troubleshooting Guide

## 🚨 "Cannot Connect to Server" Error

### Step 1: Check if Backend is Running

```bash
# Open a new terminal
cd backend-folder  # Navigate to your backend directory
npm start

# You should see something like:
# ✅ Server running on http://localhost:3001
# ✅ API listening on http://localhost:3001/api
```

### Step 2: Verify Backend Port

```bash
# Windows - Check if port 3001 is in use
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001
```

If something is running on port 3001, either:

- Stop that service, or
- Change backend port and update frontend config

### Step 3: Check Internet Connection

```javascript
// In browser console, test basic fetch:
fetch("http://localhost:3001/api/health")
  .then((r) => r.json())
  .then((d) => console.log("✅ Backend connected!", d))
  .catch((e) => console.error("❌ Connection failed:", e));
```

### Step 4: Configure Backend URL

**Option A: Automatic (Default)**

- For localhost: Backend should be at `http://localhost:3001`
- This is the default and should work without any configuration

**Option B: Manual Configuration**

```javascript
// In browser console:
localStorage.setItem("backendApiUrl", "http://localhost:3001/api");
location.reload();

// Verify:
console.log(API_BASE); // Should show your URL
```

**Option C: Environment Variable**

```javascript
// Add to HTML head before other scripts:
<script>window.BACKEND_API_URL = 'http://localhost:3001/api';</script>
```

## ✅ Testing Each Component

### Frontend is Loading ✓

- You see the form
- Page title shows "THE SAIYANS"
- Menu and styling appear correct

### API URL is Correct ✓

```javascript
// In browser console:
console.log(API_BASE);
// Should output: http://localhost:3001/api
```

### Backend is Reachable ✓

```javascript
// In browser console:
fetch(API_BASE + "/health")
  .then((r) => r.json())
  .then((d) => console.log("Connected:", d))
  .catch((e) => console.error("Failed:", e.message));
```

### Form Submission Works ✓

```
1. Fill out login form
2. Open DevTools (F12) → Network tab
3. Click Login
4. Look for POST request to /api/auth/login
5. Check response (should be green 200 status)
```

## 🔍 Network Tab Debugging

### To Inspect Failed Request:

1. Open DevTools (F12)
2. Go to "Network" tab
3. Try login/register
4. Look for a request (usually named `/api/auth/login` or `/api/auth/register`)
5. Click on it and check:

**Request Tab** - Should show:

```
POST /api/auth/login HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{"username":"test","password":"pass123"}
```

**Response Tab** - Should show:

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "...",
  "user": { "id": "...", "username": "test" }
}
```

### Common Network Issues:

| Status          | Meaning            | Solution                  |
| --------------- | ------------------ | ------------------------- |
| 404             | Endpoint not found | Check backend route paths |
| 500             | Server error       | Check backend logs        |
| 0 (no response) | Connection refused | Start backend server      |
| CORS error      | Request blocked    | Configure CORS on backend |

## 💻 Terminal Commands to Test

### Test Backend Endpoints (Bash/PowerShell)

```bash
# Test if backend is running
curl http://localhost:3001/api/health

# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"email\":\"test@test.com\",\"password\":\"pass123\"}"

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"pass123\"}"
```

## 🎯 Step-by-Step Debugging

### Issue: Form shows error message

```javascript
// 1. Copy error message from page
// 2. Search in browser console for more details
console.error(); // Look for network errors

// 3. Check what URL is being used
console.log("API Base:", API_BASE);

// 4. Test connection directly
fetch(API_BASE + "/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "test", password: "test" }),
})
  .then((r) => r.json())
  .then((d) => console.log("Response:", d))
  .catch((e) => console.error("Error:", e.message));
```

### Issue: Page doesn't redirect after login

```javascript
// 1. Check if token was saved
console.log("Token:", localStorage.getItem("accessToken"));

// 2. Check if user data was saved
console.log("User:", localStorage.getItem("userData"));

// 3. Manually redirect to test
window.location.href = "dashboard.html";
```

### Issue: Dashboard shows "no token" error

```javascript
// 1. Check localStorage
Object.keys(localStorage); // Should include 'accessToken'

// 2. Copy the token value and check if valid
const token = localStorage.getItem("accessToken");
console.log("Token present:", !!token);
console.log("Token value:", token);

// 3. Manually set token to test
localStorage.setItem("accessToken", "eyJhbGc...");
location.reload();
```

## 📝 Checklist for Troubleshooting

- [ ] Backend server is running (`npm start` successful)
- [ ] Backend is on port 3001 (or configured correctly)
- [ ] Frontend page loads correctly
- [ ] Browser console shows no errors
- [ ] Network tab shows API requests being sent
- [ ] API responses have correct JSON format
- [ ] localStorage is available (not disabled)
- [ ] CORS is configured on backend
- [ ] No typos in API URLs
- [ ] Tokens are being generated correctly

## 🆘 Complete Reset (Nuclear Option)

If everything is broken, try this:

```javascript
// In browser console:
// 1. Clear all storage
localStorage.clear();
sessionStorage.clear();

// 2. Close all tabs with the site
// 3. Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
// 4. Go to login.html
// 5. Check console for API URL
console.log(API_BASE);

// 6. If API_BASE is wrong, set it manually
localStorage.setItem("backendApiUrl", "http://localhost:3001/api");
location.reload();
```

## 📊 Expected Error Messages

### "Username already exists"

✅ **This is NORMAL** - You already registered this username

- Solution: Use a different username or delete the account first

### "Invalid credentials"

✅ **This is NORMAL** - Wrong username or password

- Solution: Check spelling and try again

### "Cannot connect to server"

❌ **This needs fixing** - Backend not running or wrong URL

- Solutions:
  1. Start backend: `npm start`
  2. Check port: 3001
  3. Set URL manually: `localStorage.setItem('backendApiUrl', 'correct-url')`

### "Invalid response from server"

❌ **This needs fixing** - Backend returning wrong format

- Solutions:
  1. Check backend logs
  2. Test backend with curl/Postman
  3. Verify response has `accessToken` and `user` fields

## 🔒 CORS Issues

**Symptom**: Error in console mentions "CORS" or "cross-origin"

**Solution - Add to Backend**:

```javascript
// In your backend server.js or app.js
const cors = require("cors");
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://localhost:3000",
      "https://iceman-rgb.github.io",
    ],
    credentials: true,
  }),
);
```

## 💡 Pro Tips

1. **Always check Console first** (F12 → Console tab)
2. **Always check Network tab** (F12 → Network tab)
3. **Reload with Ctrl+Shift+R** (clears cache)
4. **Test with curl first** (eliminates frontend errors)
5. **Check backend logs** (error details usually there)
6. **Use Firefox DevTools** (sometimes clearer than Chrome)
7. **Ask for help with screenshots of:**
   - Error message in console
   - Network tab request/response
   - Backend logs

## 🚀 Verified Working Setup

This configuration is known to work:

```javascript
// Frontend (any port)
// http://localhost:5500
// or file:///path/to/the-saiyans/login.html

// Backend
npm start
// Runs on http://localhost:3001

// Test command
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

---

**Still stuck?**

1. Screenshot the console error
2. Screenshot the Network tab request/response
3. Copy-paste the backend server logs
4. Check the AUTHENTICATION.md file for more details
