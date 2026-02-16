@echo off
echo ==========================================
echo   Degloor Mart - Full System Startup
echo ==========================================
echo.
echo Phase 1: Cleaning up ports (3000, 3001, 3003, 5000)...
echo This stops any existing backend/frontend processes to avoid conflicts.
echo.

:: Kill processes on specific ports
for %%P in (3000 3001 3003 5000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%P" ^| find "LISTENING"') do (
        echo Killing process on port %%P (PID: %%a)...
        taskkill /f /pid %%a >nul 2>&1
    )
)
timeout /t 2 /nobreak >nul


:: Navigate to script directory to ensure relative paths work
cd /d "%~dp0"

echo 1. Starting Backend Server (Port 5000)...
if exist "backend" (
    start "DegloorMart Backend" cmd /k "cd backend && npm run dev"
) else (
    echo ERROR: backend directory not found!
)

echo 2. Starting Admin Dashboard (Port 3000)...
if exist "admin-dashboard" (
    start "DegloorMart Admin" cmd /k "cd admin-dashboard && npm run dev"
) else (
    echo ERROR: admin-dashboard directory not found!
)

echo 3. Starting Delivery App (Port 3001)...
if exist "delivery-app" (
    start "DegloorMart Delivery App" cmd /k "cd delivery-app && npm run dev"
) else (
    echo ERROR: delivery-app directory not found!
)

echo 4. Starting Restaurant App (Port 3003)...
if exist "restaurant-app" (
    start "DegloorMart Restaurant App" cmd /k "cd restaurant-app && npm run dev"
) else (
    echo ERROR: restaurant-app directory not found!
)

echo 5. Starting User App (Expo)...
if exist "user-app" (
    start "DegloorMart User App" cmd /k "cd user-app && npm run start -- --reset-cache"
) else (
    echo ERROR: user-app directory not found!
)

echo.
echo All services launched! 
echo Check the individual windows for logs.
echo.
pause
