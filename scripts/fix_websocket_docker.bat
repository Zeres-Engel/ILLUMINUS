@echo off
REM Fix WebSocket Docker Issue
REM Author: Andrew (ngpthanh15@gmail.com)

echo 🔧 ILLUMINUS WebSocket Docker Fix
echo ================================

echo 🛑 Stopping current containers...
docker-compose down

echo 🧹 Cleaning up Docker cache...
docker system prune -f

echo 🏗️ Rebuilding containers with WebSocket support...
docker-compose build --no-cache

echo 🚀 Starting containers with updated dependencies...
docker-compose up -d

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak > nul

echo 🧪 Testing WebSocket connectivity...
echo.

echo 📡 Health check:
curl -s http://localhost:8000/health
echo.

echo 🔌 WebSocket health check:
curl -s http://localhost:8000/ws/health
echo.

echo ✅ WebSocket fix completed!
echo.
echo 📝 Next steps:
echo   - Visit http://localhost:8000/websocket-test
echo   - Test WebSocket: python scripts/websocket_test_client.py
echo.

pause 