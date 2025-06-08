@echo off
REM ILLUMINUS Wav2Lip - Model Downloader (Windows)
REM Author: Andrew (ngpthanh15@gmail.com)

echo.
echo =====================================================
echo   ILLUMINUS Wav2Lip - Model Downloader
echo =====================================================
echo.

cd /d "%~dp0\.."

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Check if requests module is available
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Installing required packages...
    pip install requests
)

REM Run the download script
echo 🚀 Starting model download...
python scripts/download_models.py

if errorlevel 1 (
    echo.
    echo ❌ Download failed! Check the error messages above.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ All models downloaded successfully!
    echo 🎉 Ready to use ILLUMINUS Wav2Lip!
    pause
) 