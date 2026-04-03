const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const WebSocket = require("ws");
const realtime = require("./realtime");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

// Middleware
app.use(helmet());

// CORS Configuration - Support for production environments
const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Dynamic CORS origin configuration
if (process.env.NODE_ENV === "production") {
  // For production, read from environment variable
  const allowedOriginsString =
    process.env.ALLOWED_ORIGINS || "https://iceman-rgb.github.io";
  const allowedOrigins = allowedOriginsString.split(",").map((o) => o.trim());

  corsOptions.origin = function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests without origin (API clients)
    if (allowedOrigins.some((o) => origin === o || origin.endsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: ${origin} not allowed`));
    }
  };
} else {
  // For development, allow all localhost and file:// access
  corsOptions.origin = function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5500",
      "http://localhost:5501",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
      "https://iceman-rgb.github.io",
      "file://",
    ];
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed === "file://") return origin.startsWith("file://");
      return origin === allowed;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  };
}

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: "Too many authentication attempts, please try again later.",
});

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

pool.on("connect", () => {
  console.log("✓ Connected to PostgreSQL database.");
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        profile_picture TEXT,
        bio TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        quote TEXT NOT NULL,
        character VARCHAR(255) NOT NULL,
        anime VARCHAR(255) NOT NULL,
        submitter VARCHAR(255) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        refresh_token VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ Database tables initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

initializeDatabase();

// Middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Optional authentication (for endpoints that work with or without auth)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

// AUTHENTICATION ROUTES

// Register new user
app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email, and password are required" });
  }

  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({
      error:
        "Username must be at least 3 characters, password at least 6 characters",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email],
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Username or email already exists" });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if this is admin registration (special password)
    const isAdmin = password === "admin123";

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id",
      [username, email, passwordHash, isAdmin],
    );

    const userId = result.rows[0].id;
    const user = { id: userId, username, email };

    // Generate tokens
    const accessToken = jwt.sign(user, JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: userId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await pool.query(
      "INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)",
      [userId, refreshToken, expiresAt.toISOString()],
    );

    res.status(201).json({
      message: "User created successfully",
      user: { id: userId, username, email, is_admin: isAdmin },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login user
app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1",
      [username],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    // Generate tokens
    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    const accessToken = jwt.sign(userPayload, JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, expiresAt.toISOString()],
    );

    res.json({
      message: "Login successful",
      user: userPayload,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh access token
app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {
    // Verify refresh token exists in database
    const sessionResult = await pool.query(
      "SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP",
      [refreshToken],
    );

    if (sessionResult.rows.length === 0) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const session = sessionResult.rows[0];

    // Get user data
    const userResult = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [session.user_id],
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "15m" });

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout (invalidate refresh token)
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (refreshToken) {
    try {
      await pool.query("DELETE FROM sessions WHERE refresh_token = $1", [
        refreshToken,
      ]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  res.json({ message: "Logged out successfully" });
});

// Get current user profile
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at, last_login, is_admin, profile_picture, bio FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Upload profile picture
app.post("/api/auth/profile/picture", authenticateToken, async (req, res) => {
  try {
    const fileData = req.body.profilePicture;

    if (!fileData) {
      return res.status(400).json({ error: "No image data provided" });
    }

    await pool.query("UPDATE users SET profile_picture = $1 WHERE id = $2", [
      fileData,
      req.user.id,
    ]);

    res.json({
      message: "Profile picture updated successfully",
      profile_picture: fileData,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to process upload" });
  }
});

// Update user profile
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  const { bio } = req.body;

  try {
    await pool.query("UPDATE users SET bio = $1 WHERE id = $2", [
      bio || "",
      req.user.id,
    ]);

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get all comments
app.get("/api/comments", optionalAuth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `
      SELECT c.id, c.user_id, c.username, c.text, c.timestamp, c.expires_at,
             u.profile_picture, u.bio
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.expires_at > CURRENT_TIMESTAMP OR c.expires_at IS NULL
      ORDER BY c.timestamp DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset],
    );

    res.json({ comments: result.rows || [] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Create new comment
app.post("/api/comments", optionalAuth, async (req, res) => {
  const { text } = req.body;
  const userId = req.user ? req.user.id : null;
  const username = req.user ? req.user.username : req.body.username;

  if (!text || !username) {
    return res.status(400).json({ error: "Text and username are required" });
  }

  if (text.length > 1000) {
    return res
      .status(400)
      .json({ error: "Comment too long (max 1000 characters)" });
  }

  // Set expiration (5 days from now)
  const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  try {
    const result = await pool.query(
      `
      INSERT INTO comments (user_id, username, text, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
      [userId, username, text, expiresAt.toISOString()],
    );

    res.status(201).json({
      message: "Comment posted successfully",
      comment: {
        id: result.rows[0].id,
        user_id: userId,
        username,
        text,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Comment creation error:", error);
    res.status(500).json({ error: "Failed to save comment" });
  }
});

// QUOTES ROUTES

// Get approved quotes
app.get("/api/quotes", async (req, res) => {
  const category = req.query.category;
  let query = "SELECT * FROM quotes WHERE approved = true";
  let params = [];

  if (category && category !== "all") {
    query += " AND anime = $1";
    params.push(category);
  }

  query += " ORDER BY timestamp DESC";

  try {
    const result = await pool.query(query, params);
    res.json({ quotes: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Submit new quote
app.post("/api/quotes", optionalAuth, async (req, res) => {
  const { quote, character, anime, submitter } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!quote || !character || !anime || !submitter) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (quote.length > 500) {
    return res
      .status(400)
      .json({ error: "Quote too long (max 500 characters)" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO quotes (quote, character, anime, submitter, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
      [quote, character, anime, submitter, userId],
    );

    res.status(201).json({
      message: "Quote submitted successfully! It will be reviewed by our team.",
      quote: {
        id: result.rows[0].id,
        quote,
        character,
        anime,
        submitter,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Quote submission error:", error);
    res.status(500).json({ error: "Failed to submit quote" });
  }
});

// Get pending quotes (admin only)
app.get("/api/quotes/pending", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query(
      "SELECT is_admin FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const quotesResult = await pool.query(
      "SELECT * FROM quotes WHERE approved = false ORDER BY timestamp DESC",
    );

    res.json({ quotes: quotesResult.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Approve quote (admin only)
app.put("/api/quotes/:id/approve", authenticateToken, async (req, res) => {
  const quoteId = req.params.id;

  try {
    // Check if user is admin
    const userResult = await pool.query(
      "SELECT is_admin FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const updateResult = await pool.query(
      "UPDATE quotes SET approved = true WHERE id = $1",
      [quoteId],
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: "Quote not found" });
    }

    res.json({ message: "Quote approved successfully" });
  } catch (error) {
    console.error("Quote approval error:", error);
    res.status(500).json({ error: "Failed to approve quote" });
  }
});

// Delete quote (admin only)
app.delete("/api/quotes/:id", authenticateToken, async (req, res) => {
  const quoteId = req.params.id;

  try {
    // Check if user is admin
    const userResult = await pool.query(
      "SELECT is_admin FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const deleteResult = await pool.query("DELETE FROM quotes WHERE id = $1", [
      quoteId,
    ]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "Quote not found" });
    }

    res.json({ message: "Quote deleted successfully" });
  } catch (error) {
    console.error("Quote deletion error:", error);
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

// UTILITY ROUTES

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Get server stats
app.get("/api/stats", async (req, res) => {
  try {
    const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
    const commentCount = await pool.query(
      "SELECT COUNT(*) as count FROM comments WHERE expires_at > CURRENT_TIMESTAMP",
    );
    const quoteCount = await pool.query(
      "SELECT COUNT(*) as count FROM quotes WHERE approved = true",
    );

    res.json({
      users: parseInt(userCount.rows[0].count),
      comments: parseInt(commentCount.rows[0].count),
      quotes: parseInt(quoteCount.rows[0].count),
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Admin stats (requires authentication and admin role)
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query(
      "SELECT is_admin FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
    const pendingQuotes = await pool.query(
      "SELECT COUNT(*) as count FROM quotes WHERE approved = false",
    );

    res.json({
      totalUsers: parseInt(userCount.rows[0].count),
      onlineUsers: realtime.activeUsers.size,
      pendingQuotes: parseInt(pendingQuotes.rows[0].count),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Get online users list
app.get("/api/users/status/online", async (req, res) => {
  try {
    // Get list of online user IDs from WebSocket
    const onlineUserIds = Array.from(realtime.activeUsers.keys());

    if (onlineUserIds.length === 0) {
      return res.json({ users: [] });
    }

    // Fetch user details from database
    const placeholders = onlineUserIds.map((_, i) => `$${i + 1}`).join(",");
    const result = await pool.query(
      `SELECT id, username, profile_picture FROM users WHERE id IN (${placeholders})`,
      onlineUserIds,
    );

    res.json({ users: result.rows || [] });
  } catch (error) {
    console.error("Error fetching online users:", error);
    res.status(500).json({ error: "Failed to fetch online users" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  try {
    await pool.end();
    console.log("Database connection pool closed.");
  } catch (err) {
    console.error("Error closing database pool:", err);
  }
  process.exit(0);
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🏆 THE SAIYANS API Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
});

// WebSocket server setup
const wss = new WebSocket.Server({ server });
realtime.initializeWebSocket(wss, db, JWT_SECRET);
