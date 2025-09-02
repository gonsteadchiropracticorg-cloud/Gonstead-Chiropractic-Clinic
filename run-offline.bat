@echo off
echo.
echo ========================================
echo  Gonstead Chiropractic - Offline Mode
echo ========================================
echo.
echo Starting the clinic management system...
echo This will work completely OFFLINE!
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start the application in development mode (works offline)
echo.
echo Opening Gonstead Chiropractic Clinic Manager...
echo.
echo OFFLINE FEATURES AVAILABLE:
echo - Patient Records Management
echo - Appointment Scheduling  
echo - Prescription Generation
echo - Data Export (Excel/CSV)
echo - Medical Knowledge Base
echo.
echo Your browser will open automatically...
echo Press Ctrl+C to stop the application
echo.

start http://localhost:3000/admin
npm run dev
