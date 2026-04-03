# 🔐 Authentication Setup Guide

This guide explains how to set up and configure the login/registration system for The Saiyans.

## 📋 Overview

The authentication system consists of:

- **Frontend**: HTML forms with JavaScript form handlers (login.html, register.html)
- **Backend**: Node.js API server with JWT token management
- **Storage**: LocalStorage for tokens and user data

## 🚀 Quick Start

### 1. Environment Configuration

#### For Local Development:

```javascript
// The system automatically detects localhost:
// http://localhost:3001/api (default)

// Or manually set in browser console:
localStorage.setItem("backendApiUrl", "http://your-api-url/api");
```

#### For GitHub Pages (Deployed):

```javascript
// Add to window before frontend loads:
window.BACKEND_API_URL = "https://your-production-api/api";

// Or set in localStorage:
localStorage.setItem("backendApiUrl", "https://your-production-api/api");
```

### 2. Backend API Requirements

Your API must implement these endpoints:

#### Register: `POST /api/auth/register`

```json
Request:
{
  "username": "warrior_name",
  "email": "email@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_optional",
  "user": {
    "id": "user_id",
    "username": "warrior_name",
    "email": "email@example.com"
  }
}

Error Response (400+):
{
  "error": "Username already exists"
}
```

#### Login: `POST /api/auth/login`

```json
Request:
{
  "username": "warrior_name_or_email",
  "password": "password123"
}

Response (200 OK):
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_optional",
  "user": {
    "id": "user_id",
    "username": "warrior_name",
    "email": "email@example.com"
  }
}

Error Response (401/404):
{
  "error": "Invalid credentials"
}
```

## 🧪 Testing Locally

### Step 1: Start Your Backend Server

```bash
# In your backend project directory
npm start
# Should run on http://localhost:3001
```

### Step 2: Open Frontend in Browser

```bash
# Option A: Using VS Code Live Server
# Right-click on login.html → "Open with Live Server"

# Option B: Using Python
python -m http.server 5500
# Visit http://localhost:5500/login.html

# Option C: Direct file path
# file:///path/to/The-Saiyans/login.html
```

### Step 3: Test Registration

1. Navigate to **register.html**
2. Fill in form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm: `password123`
   - Check "I agree to Terms"
3. Click "Create Account"
4. Should redirect to **dashboard.html** if successful

### Step 4: Test Login

1. Navigate to **login.html**
2. Fill in form:
   - Username: `testuser` (or email)
   - Password: `password123`
   - Optional: Check "Remember me"
3. Click "Login"
4. Should redirect to **dashboard.html** if successful

## 🐛 Troubleshooting

### Problem: "Cannot connect to server"

**Cause**: Backend API not running or wrong URL

**Solution**:

```javascript
// Check API base URL in browser console:
console.log(API_BASE);

// Manually set correct URL:
localStorage.setItem("backendApiUrl", "http://your-actual-api-url/api");

// Refresh page
location.reload();
```

### Problem: "Invalid response from server"

**Cause**: Backend returning wrong JSON format

**Solution**:

- Check backend logs for errors
- Verify response has: `accessToken`, `refreshToken` (optional), `user` object
- Backend should return proper error messages in `error` field

### Problem: Login works but dashboard is blank

**Cause**: Dashboard doesn't check for valid tokens

**Solution**:
Add token validation to dashboard.html:

```javascript
// In dashboard.html
const token = localStorage.getItem("accessToken");
if (!token) {
  window.location.href = "login.html"; // Redirect if not logged in
}
```

### Problem: "Username already exists" during registration

**Solution**: Use a unique username or different email address

## 🔒 Security Notes

### Current Implementation:

- ✅ Passwords sent over HTTPS (in production)
- ✅ JWT tokens stored in localStorage
- ✅ Tokens validated on each request
- ✅ CORS should be configured on backend

### Recommended Improvements:

- 🔐 Use `httpOnly` cookies instead of localStorage (more secure)
- 🔐 Implement token refresh mechanism
- 🔐 Add rate limiting on login attempts
- 🔐 Implement password reset functionality
- 🔐 Add email verification for new accounts
- 🔐 Use HTTPS in production (critical)

## 📱 API Response Debugging

### Check Token Storage:

```javascript
// In browser console
localStorage.getItem("accessToken");
localStorage.getItem("userData");
JSON.parse(localStorage.getItem("userData"));
```

### Monitor Network Requests:

1. Open Browser DevTools (F12)
2. Go to "Network" tab
3. Make a login/registration request
4. Click on the request to see:
   - Request headers
   - Request body
   - Response headers
   - Response body

### Check Console Logs:

```javascript
// Frontend logs useful info:
console.log("📡 API Base URL:", API_BASE); // Shown on page load
// Plus error messages with detailed info
```

## 🔄 Token Management

### Automatic Token Usage:

Frontend automatically includes token in requests:

```javascript
headers: {
  "Authorization": "Bearer " + token,
  "Content-Type": "application/json"
}
```

### Token Expiration:

When token expires:

1. Backend returns 401 Unauthorized
2. Frontend should redirect to login
3. Or implement automatic token refresh

## 📦 File Structure

```
The-Saiyans/
├── login.html           # Login form with JS handler
├── register.html        # Registration form with JS handler
├── dashboard.html       # Protected page (needs token)
├── style.css            # Shared styling
├── script.js            # Shared utilities
└── AUTH_SETUP.md        # This file
```

## ✅ Checklist

- [ ] Backend API running on localhost:3001
- [ ] Backend implements /api/auth/register endpoint
- [ ] Backend implements /api/auth/login endpoint
- [ ] Frontend can reach backend (check console logs)
- [ ] Registration form works and creates accounts
- [ ] Login form works with registered credentials
- [ ] Dashboard checks for valid token
- [ ] Logout redirects to login page
- [ ] Tokens refresh when expired (optional but recommended)

## 📞 Support

If experiencing issues:

1. Check browser console (F12) for error messages
2. Check backend logs for API errors
3. Verify Network tab for failed requests
4. Ensure backend is running and reachable
5. Review this guide's troubleshooting section

---

**Last Updated**: 2024
**Version**: 1.0
