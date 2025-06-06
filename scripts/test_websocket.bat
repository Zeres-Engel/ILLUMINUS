@echo off
REM ILLUMINUS WebSocket API Test Script (Windows)
REM Author: Andrew (ngpthanh15@gmail.com)

echo 🌟 ILLUMINUS WebSocket API Test Suite
echo =====================================

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if server is running
echo 📡 Checking server status...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Server not running. Please start the server first:
    echo    python app.py
    pause
    exit /b 1
)

echo ✅ Server is running!

REM Install WebSocket client dependencies if needed
echo 📦 Installing WebSocket client dependencies...
pip install websockets >nul 2>&1

REM Run tests
echo 🧪 Running WebSocket tests...
echo.

echo 1. Simple connectivity test:
python scripts/websocket_test_client.py
echo.

echo 2. Opening browser test client...
start http://localhost:8000/websocket-test
echo.

echo 3. Testing WebSocket health endpoint:
curl http://localhost:8000/ws/health
echo.

echo ✅ Test suite completed!
echo.
echo 📝 Next steps:
echo   - Visit http://localhost:8000/websocket-test for browser testing
echo   - Use Python client: python scripts/websocket_test_client.py --audio sample.wav --image person.jpg
echo   - Check documentation: docs/websocket_api_guide.md
echo.

pause 