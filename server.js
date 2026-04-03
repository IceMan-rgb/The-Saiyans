const express = require("express");
const sqlite3 = require("sqlite3").verbose();
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
const db = new sqlite3.Database("./saiyans.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_admin BOOLEAN DEFAULT FALSE,
    profile_picture TEXT,
    bio TEXT
  )`);

  // Add columns if they don't exist (for existing databases)
  db.run(`PRAGMA table_info(users)`, [], (err, rows) => {
    // This is handled by SQLite's ALTER TABLE approach
  });

  // Create profile_picture column if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN profile_picture TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      // Column already exists or another error
    }
  });

  // Create bio column if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      // Column already exists or another error
    }
  });

  // Comments table
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Quotes table
  db.run(`CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote TEXT NOT NULL,
    character TEXT NOT NULL,
    anime TEXT NOT NULL,
    submitter TEXT NOT NULL,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Sessions table for refresh tokens
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

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
    db.get(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        if (existingUser) {
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
        db.run(
          "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
          [username, email, passwordHash, isAdmin ? 1 : 0],
          function (err) {
            if (err) {
              return res.status(500).json({ error: "Failed to create user" });
            }

            // Generate tokens
            const user = { id: this.lastID, username, email };
            const accessToken = jwt.sign(user, JWT_SECRET, {
              expiresIn: "15m",
            });
            const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
              expiresIn: "7d",
            });

            // Store refresh token
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            db.run(
              "INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (?, ?, ?)",
              [user.id, refreshToken, expiresAt.toISOString()],
            );

            res.status(201).json({
              message: "User created successfully",
              user: { id: user.id, username, email, is_admin: isAdmin ? 1 : 0 },
              accessToken,
              refreshToken,
            });
          },
        );
      },
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login user
app.post("/api/auth/login", authLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [
        user.id,
      ]);

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
      db.run(
        "INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (?, ?, ?)",
        [user.id, refreshToken, expiresAt.toISOString()],
      );

      res.json({
        message: "Login successful",
        user: userPayload,
        accessToken,
        refreshToken,
      });
    },
  );
});

// Refresh access token
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  // Verify refresh token exists in database
  db.get(
    "SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > CURRENT_TIMESTAMP",
    [refreshToken],
    (err, session) => {
      if (err || !session) {
        return res.status(403).json({ error: "Invalid refresh token" });
      }

      // Get user data
      db.get(
        "SELECT id, username, email FROM users WHERE id = ?",
        [session.user_id],
        (err, user) => {
          if (err || !user) {
            return res.status(403).json({ error: "User not found" });
          }

          // Generate new access token
          const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "15m" });

          res.json({ accessToken });
        },
      );
    },
  );
});

// Logout (invalidate refresh token)
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (refreshToken) {
    db.run("DELETE FROM sessions WHERE refresh_token = ?", [refreshToken]);
  }

  res.json({ message: "Logged out successfully" });
});

// Get current user profile
app.get("/api/auth/profile", authenticateToken, (req, res) => {
  db.get(
    "SELECT id, username, email, created_at, last_login, is_admin, profile_picture, bio FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    },
  );
});

// Upload profile picture
app.post("/api/auth/profile/picture", authenticateToken, (req, res) => {
  try {
    // Handle base64 image data
    const fileData = req.body.profilePicture;

    if (!fileData) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Store base64 data or file URL
    // For this implementation, we'll store the base64 data directly in the database
    // In production, you'd want to store files in cloud storage

    db.run(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [fileData, req.user.id],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to update profile picture" });
        }

        res.json({
          message: "Profile picture updated successfully",
          profile_picture: fileData,
        });
      },
    );
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to process upload" });
  }
});

// Update user profile
app.put("/api/auth/profile", authenticateToken, (req, res) => {
  const { bio } = req.body;

  db.run(
    "UPDATE users SET bio = ? WHERE id = ?",
    [bio || "", req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to update profile" });
      }

      res.json({ message: "Profile updated successfully" });
    },
  );
});

// COMMENTS ROUTES

// Get all comments
app.get("/api/comments", optionalAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    `
    SELECT c.id, c.user_id, c.username, c.text, c.timestamp, c.expires_at,
           u.profile_picture, u.bio
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.expires_at > CURRENT_TIMESTAMP OR c.expires_at IS NULL
    ORDER BY c.timestamp DESC
    LIMIT ? OFFSET ?
  `,
    [limit, offset],
    (err, comments) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ comments: comments || [] });
    },
  );
});

// Create new comment
app.post("/api/comments", optionalAuth, (req, res) => {
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

  db.run(
    `
    INSERT INTO comments (user_id, username, text, expires_at)
    VALUES (?, ?, ?, ?)
  `,
    [userId, username, text, expiresAt.toISOString()],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save comment" });
      }

      res.status(201).json({
        message: "Comment posted successfully",
        comment: {
          id: this.lastID,
          user_id: userId,
          username,
          text,
          timestamp: new Date().toISOString(),
        },
      });
    },
  );
});

// QUOTES ROUTES

// Get approved quotes
app.get("/api/quotes", (req, res) => {
  const category = req.query.category;
  let query = "SELECT * FROM quotes WHERE approved = 1";
  let params = [];

  if (category && category !== "all") {
    query += " AND anime = ?";
    params.push(category);
  }

  query += " ORDER BY timestamp DESC";

  db.all(query, params, (err, quotes) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ quotes });
  });
});

// Submit new quote
app.post("/api/quotes", optionalAuth, (req, res) => {
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

  db.run(
    `
    INSERT INTO quotes (quote, character, anime, submitter, user_id)
    VALUES (?, ?, ?, ?, ?)
  `,
    [quote, character, anime, submitter, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to submit quote" });
      }

      res.status(201).json({
        message:
          "Quote submitted successfully! It will be reviewed by our team.",
        quote: {
          id: this.lastID,
          quote,
          character,
          anime,
          submitter,
          timestamp: new Date().toISOString(),
        },
      });
    },
  );
});

// Get pending quotes (admin only)
app.get("/api/quotes/pending", authenticateToken, (req, res) => {
  // Check if user is admin
  db.get(
    "SELECT is_admin FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err || !user || !user.is_admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      db.all(
        "SELECT * FROM quotes WHERE approved = 0 ORDER BY timestamp DESC",
        (err, quotes) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          res.json({ quotes });
        },
      );
    },
  );
});

// Approve quote (admin only)
app.put("/api/quotes/:id/approve", authenticateToken, (req, res) => {
  const quoteId = req.params.id;

  // Check if user is admin
  db.get(
    "SELECT is_admin FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err || !user || !user.is_admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      db.run(
        "UPDATE quotes SET approved = 1 WHERE id = ?",
        [quoteId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Failed to approve quote" });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: "Quote not found" });
          }

          res.json({ message: "Quote approved successfully" });
        },
      );
    },
  );
});

// Delete quote (admin only)
app.delete("/api/quotes/:id", authenticateToken, (req, res) => {
  const quoteId = req.params.id;

  // Check if user is admin
  db.get(
    "SELECT is_admin FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err || !user || !user.is_admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      db.run("DELETE FROM quotes WHERE id = ?", [quoteId], function (err) {
        if (err) {
          return res.status(500).json({ error: "Failed to delete quote" });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Quote not found" });
        }

        res.json({ message: "Quote deleted successfully" });
      });
    },
  );
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
app.get("/api/stats", (req, res) => {
  const stats = {};

  // Get user count
  db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
    if (!err) stats.users = result.count;

    // Get comment count
    db.get(
      "SELECT COUNT(*) as count FROM comments WHERE expires_at > CURRENT_TIMESTAMP",
      (err, result) => {
        if (!err) stats.comments = result.count;

        // Get quote count
        db.get(
          "SELECT COUNT(*) as count FROM quotes WHERE approved = 1",
          (err, result) => {
            if (!err) stats.quotes = result.count;

            res.json(stats);
          },
        );
      },
    );
  });
});

// Admin stats (requires authentication and admin role)
app.get("/api/admin/stats", authenticateToken, (req, res) => {
  // Check if user is admin
  db.get(
    "SELECT is_admin FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err || !user || !user.is_admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const stats = {};

      // Get total registered users
      db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
        if (!err) stats.totalUsers = result.count;

        // Get currently online users from WebSocket activeUsers
        stats.onlineUsers = realtime.activeUsers.size;

        // Get pending quotes count
        db.get(
          "SELECT COUNT(*) as count FROM quotes WHERE approved = 0",
          (err, result) => {
            if (!err) stats.pendingQuotes = result.count;

            res.json(stats);
          },
        );
      });
    },
  );
});

// Get online users list
app.get("/api/users/status/online", (req, res) => {
  try {
    // Get list of online user IDs from WebSocket
    const onlineUserIds = Array.from(realtime.activeUsers.keys());

    if (onlineUserIds.length === 0) {
      return res.json({ users: [] });
    }

    // Fetch user details from database
    const placeholders = onlineUserIds.map(() => "?").join(",");
    db.all(
      `SELECT id, username, profile_picture FROM users WHERE id IN (${placeholders})`,
      onlineUserIds,
      (err, users) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        res.json({ users: users || [] });
      },
    );
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
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
    process.exit(0);
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🏆 THE SAIYANS API Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
});

// WebSocket server setup
const wss = new WebSocket.Server({ server });
realtime.initializeWebSocket(wss, db, JWT_SECRET);
