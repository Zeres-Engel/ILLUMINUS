@echo off
REM Restart Container with WebSocket Disconnect Fixes
REM Author: Andrew (ngpthanh15@gmail.com)

echo 🔧 Restarting ILLUMINUS with WebSocket Fixes
echo ============================================

echo 🛑 Stopping container...
docker-compose stop illuminus

echo ⏳ Waiting for graceful shutdown...
timeout /t 5 /nobreak > nul

echo 🚀 Starting container with fixes...
docker-compose start illuminus

echo ⏳ Waiting for services to initialize...
timeout /t 10 /nobreak > nul

echo 🧪 Testing WebSocket connectivity...
echo.

echo 📡 General health check:
curl -s http://localhost:8000/health
echo.

echo 🔌 WebSocket health check:
curl -s http://localhost:8000/ws/health
echo.

echo ✅ Container restarted with WebSocket disconnect fixes!
echo.
echo 🚀 WebSocket Disconnect Fixes Applied:
echo   - Proper connection state checking
echo   - Graceful disconnect handling  
echo   - Auto-disconnect after processing
echo   - Better error message filtering
echo.
echo 📝 Test WebSocket now:
echo   - Browser: http://localhost:8000/websocket-test
echo   - CLI: python scripts/websocket_test_client.py --audio sample.wav --image person.jpg
echo.

pause 