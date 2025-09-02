# Gonstead Chiropractic - Offline Mode Launcher
# This script starts the clinic management system in offline mode

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Gonstead Chiropractic - Offline Mode" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting the clinic management system..." -ForegroundColor Green
Write-Host "This will work completely OFFLINE!" -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🏥 OFFLINE FEATURES AVAILABLE:" -ForegroundColor Cyan
Write-Host "• Patient Records Management" -ForegroundColor White
Write-Host "• Appointment Scheduling" -ForegroundColor White
Write-Host "• Prescription Generation" -ForegroundColor White
Write-Host "• Data Export (Excel/CSV)" -ForegroundColor White
Write-Host "• Medical Knowledge Base" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Opening in your default browser..." -ForegroundColor Green
Write-Host "📝 All data will be saved locally for offline use" -ForegroundColor Yellow
Write-Host "🔄 When internet returns, data will sync automatically" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Red
Write-Host ""

# Open browser and start the application
Start-Process "http://localhost:3000/admin"
npm run dev
