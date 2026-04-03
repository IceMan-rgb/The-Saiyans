const WebSocket = require("ws");

// Track active users and connections
const activeUsers = new Map();
const userConnections = new Map();

function initializeWebSocket(wss, pool, JWT_SECRET) {
  // WebSocket connection handler
  wss.on("connection", (ws) => {
    console.log("🔗 New WebSocket connection");
    let userId = null;
    let username = null;

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case "AUTH":
            handleAuth(ws, data, pool, JWT_SECRET, (uid, uname) => {
              userId = uid;
              username = uname;
            });
            break;
          case "PING":
            ws.send(JSON.stringify({ type: "PONG", timestamp: new Date() }));
            break;
          case "NOTIFICATION_READ":
            if (userId)
              markNotificationAsRead(userId, data.notificationId, ws, pool);
            break;
          case "STATUS_UPDATE":
            if (userId) updateUserStatus(userId, data.status, ws, pool);
            break;
          case "BROADCAST":
            if (userId && data.message) {
              broadcastToAll({
                type: "ACTIVITY",
                username,
                message: data.message,
                timestamp: new Date(),
              });
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (userId) {
        setUserOffline(userId, pool);
      }
      console.log("🔌 WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
}

function handleAuth(ws, data, pool, JWT_SECRET, callback) {
  const jwt = require("jsonwebtoken");

  jwt.verify(data.token, JWT_SECRET, (err, user) => {
    if (err) {
      ws.send(JSON.stringify({ type: "AUTH_FAILED", error: "Invalid token" }));
      return;
    }

    activeUsers.set(user.id, {
      username: user.username,
      email: user.email,
      status: "online",
      ws,
    });

    if (!userConnections.has(user.id)) {
      userConnections.set(user.id, []);
    }
    userConnections.get(user.id).push(ws);

    // Track online status in memory (activeUsers Map)

    ws.send(
      JSON.stringify({
        type: "AUTH_SUCCESS",
        user: { id: user.id, username: user.username, email: user.email },
      }),
    );

    broadcastToAll({
      type: "USER_ONLINE",
      username: user.username,
      timestamp: new Date(),
      onlineCount: activeUsers.size,
    });

    callback(user.id, user.username);
  });
}

async function setUserOffline(userId, pool) {
  activeUsers.delete(userId);
  // Track offline status in memory (activeUsers Map)

  try {
    const result = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
    if (result.rows.length > 0) {
      broadcastToAll({
        type: "USER_OFFLINE",
        username: result.rows[0].username,
        onlineCount: activeUsers.size,
      });
    }
  } catch (err) {
    console.error("Error fetching user for offline notification:", err);
  }
}

async function updateUserStatus(userId, status, ws, pool) {
  // Update user status in memory
  const user = activeUsers.get(userId);
  if (user) {
    user.status = status;
  }

  ws.send(JSON.stringify({ type: "STATUS_UPDATED", status }));
}

async function markNotificationAsRead(userId, notificationId, ws, pool) {
  try {
    await pool.query(
      "UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2",
      [notificationId, userId]
    );
    ws.send(
      JSON.stringify({ type: "NOTIFICATION_READ_SUCCESS", notificationId }),
    );
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
}

function broadcastToAll(message) {
  // This is a placeholder - real implementation requires access to wss
  // The actual broadcast happens in server.js
}

function broadcastToUser(userId, message) {
  const connections = userConnections.get(userId);
  if (connections) {
    const WebSocket = require("ws");
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

function getActiveUsers() {
  return Array.from(activeUsers.values());
}

module.exports = {
  initializeWebSocket,
  broadcastToUser,
  getActiveUsers,
  activeUsers,
  userConnections,
};
