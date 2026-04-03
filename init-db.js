const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
require("dotenv").config();

console.log("🏆 Initializing THE SAIYANS Database...");

// Create database
const db = new sqlite3.Database("./saiyans.db", (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to SQLite database");
});

// Initialize tables
db.serialize(() => {
  console.log("📋 Creating tables...");

  // Users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_admin BOOLEAN DEFAULT FALSE
  )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating users table:", err.message);
      } else {
        console.log("✅ Users table created");
      }
    },
  );

  // Comments table
  db.run(
    `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating comments table:", err.message);
      } else {
        console.log("✅ Comments table created");
      }
    },
  );

  // Quotes table
  db.run(
    `CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote TEXT NOT NULL,
    character TEXT NOT NULL,
    anime TEXT NOT NULL,
    submitter TEXT NOT NULL,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating quotes table:", err.message);
      } else {
        console.log("✅ Quotes table created");
      }
    },
  );

  // Sessions table
  db.run(
    `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating sessions table:", err.message);
      } else {
        console.log("✅ Sessions table created");
      }
    },
  );

  // Create indexes for better performance
  console.log("🔍 Creating indexes...");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_comments_timestamp ON comments(timestamp)",
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_comments_expires ON comments(expires_at)",
  );
  db.run("CREATE INDEX IF NOT EXISTS idx_quotes_approved ON quotes(approved)");
  db.run("CREATE INDEX IF NOT EXISTS idx_quotes_anime ON quotes(anime)");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token)",
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)",
  );

  console.log("✅ Indexes created");

  // Insert sample data
  console.log("📝 Inserting sample data...");

  // Sample quotes
  const sampleQuotes = [
    {
      quote: "I'm gonna become the King of the Pirates!",
      character: "Monkey D. Luffy",
      anime: "One Piece",
      submitter: "Saiyan Admin",
    },
    {
      quote: "Power comes in response to a need, not a desire.",
      character: "Goku",
      anime: "Dragon Ball",
      submitter: "Saiyan Admin",
    },
    {
      quote: "If you don't take risks, you can't create a future.",
      character: "Monkey D. Luffy",
      anime: "One Piece",
      submitter: "Saiyan Admin",
    },
    {
      quote: "The moment you give up is the moment you let someone else win.",
      character: "Kuroko Tetsuya",
      anime: "Kuroko no Basket",
      submitter: "Saiyan Admin",
    },
    {
      quote: "A lesson without pain is meaningless.",
      character: "Edward Elric",
      anime: "Fullmetal Alchemist",
      submitter: "Saiyan Admin",
    },
  ];

  sampleQuotes.forEach((quote, index) => {
    db.run(
      `
      INSERT OR IGNORE INTO quotes (quote, character, anime, submitter, approved)
      VALUES (?, ?, ?, ?, 1)
    `,
      [quote.quote, quote.character, quote.anime, quote.submitter],
      (err) => {
        if (err) {
          console.error(`❌ Error inserting quote ${index + 1}:`, err.message);
        }
      },
    );
  });

  console.log("✅ Sample quotes inserted");

  // Create admin user if FIRST_USER_IS_ADMIN is true
  if (process.env.FIRST_USER_IS_ADMIN === "true") {
    console.log("👑 Creating admin user...");

    bcrypt.hash("admin123", 12, (err, hash) => {
      if (err) {
        console.error("❌ Error hashing admin password:", err.message);
        return;
      }

      db.run(
        `
        INSERT OR IGNORE INTO users (username, email, password_hash, is_admin)
        VALUES (?, ?, ?, 1)
      `,
        ["admin", "admin@saiyans.com", hash],
        function (err) {
          if (err) {
            console.error("❌ Error creating admin user:", err.message);
          } else if (this.changes > 0) {
            console.log("✅ Admin user created:");
            console.log("   Username: admin");
            console.log("   Email: admin@saiyans.com");
            console.log("   Password: admin123");
            console.log("   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!");
          } else {
            console.log("ℹ️  Admin user already exists");
          }
        },
      );
    });
  }

  // Close database connection
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error("❌ Error closing database:", err.message);
      } else {
        console.log("✅ Database initialization complete!");
        console.log("🏆 THE SAIYANS Database is ready!");
        console.log("");
        console.log("🚀 To start the server:");
        console.log("   npm install");
        console.log("   npm run init-db  # (if not done already)");
        console.log("   npm start");
        console.log("");
        console.log("📡 API will be available at: http://localhost:3001/api");
      }
    });
  }, 1000);
});
