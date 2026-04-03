const http = require("http");

// Simple test to check if the backend is running
function testBackend() {
  console.log("🧪 Testing THE SAIYANS Backend...\n");

  const options = {
    hostname: "localhost",
    port: 3001,
    path: "/api/health",
    method: "GET",
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const response = JSON.parse(data);

        if (res.statusCode === 200 && response.status === "OK") {
          console.log("✅ Backend is running successfully!");
          console.log("📊 Server Status:", response.status);
          console.log("🕒 Server Time:", response.timestamp);
          console.log("🏷️  Version:", response.version);
          console.log("\n🎉 All systems operational!");
          console.log("\n📡 API Endpoints:");
          console.log("   Health: http://localhost:3001/api/health");
          console.log("   Auth: http://localhost:3001/api/auth");
          console.log("   Comments: http://localhost:3001/api/comments");
          console.log("   Quotes: http://localhost:3001/api/quotes");
          console.log("\n🌐 Frontend: Open Association.html in your browser");
        } else {
          console.log("❌ Backend responded but with unexpected data");
          console.log("Response:", response);
        }
      } catch (error) {
        console.log("❌ Failed to parse backend response");
        console.log("Raw response:", data);
      }
    });
  });

  req.on("error", (error) => {
    console.log("❌ Cannot connect to backend server");
    console.log("Error:", error.message);
    console.log("\n🔧 Make sure the backend is running:");
    console.log("   npm start");
    console.log("\n📋 If you haven't set up the backend yet:");
    console.log("   1. Install Node.js from https://nodejs.org/");
    console.log("   2. Run: npm install");
    console.log("   3. Run: npm run init-db");
    console.log("   4. Run: npm start");
  });

  req.on("timeout", () => {
    console.log("⏰ Connection timeout - backend may not be running");
    req.destroy();
  });

  req.end();
}

// Run the test
testBackend();
