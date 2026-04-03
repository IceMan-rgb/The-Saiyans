# 🏆 THE SAIYANS - Backend Setup Script
Write-Host "🏆 THE SAIYANS - Backend Setup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "   Recommended: LTS version" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing Node.js, run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✅ npm is available: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗄️ Initializing database..." -ForegroundColor Yellow
npm run init-db

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to initialize database!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the server:" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "📡 API will be available at: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host "🌐 Open Association.html in your browser" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"