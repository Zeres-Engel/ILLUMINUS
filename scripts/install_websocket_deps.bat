@echo off
REM Install WebSocket Dependencies for Development
REM Author: Andrew (ngpthanh15@gmail.com)

echo 🔧 Installing WebSocket Dependencies
echo ====================================

echo 📦 Installing uvicorn with standard WebSocket support...
pip install "uvicorn[standard]==0.24.0"

echo 📦 Installing additional WebSocket libraries...
pip install websockets==11.0.3

echo 📦 Installing optional dependencies for better performance...
pip install python-multipart aiofiles

echo ✅ Dependencies installed successfully!
echo.

echo 🚀 Starting server with WebSocket support...
echo.

python app.py

pause 