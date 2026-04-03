@echo off
echo 🏆 THE SAIYANS - Backend Setup Script
echo ======================================
echo.

echo 📦 Installing Node.js...
echo Please download and install Node.js from: https://nodejs.org/
echo Recommended: LTS version
echo.
echo After installing Node.js, run this script again.
echo.

pause

echo.
echo 🔧 Installing dependencies...
npm install

echo.
echo 🗄️ Initializing database...
npm run init-db

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start the server:
echo    npm start
echo.
echo 📡 API will be available at: http://localhost:3001/api
echo 🌐 Open Association.html in your browser
echo.

pause