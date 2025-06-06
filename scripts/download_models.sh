#!/bin/bash
# ILLUMINUS Wav2Lip - Model Downloader (Unix/Linux)
# Author: Andrew (ngpthanh15@gmail.com)

set -e  # Exit on error

echo ""
echo "====================================================="
echo "   🌟 ILLUMINUS Wav2Lip - Model Downloader"
echo "====================================================="
echo ""

# Change to script directory parent
cd "$(dirname "$0")/.."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.7+ and try again"
    exit 1
fi

# Check if requests module is available
if ! python3 -c "import requests" &> /dev/null; then
    echo "⚠️  Installing required packages..."
    pip3 install requests
fi

# Run the download script
echo "🚀 Starting model download..."
python3 scripts/download_models.py "$@"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All models downloaded successfully!"
    echo "🎉 Ready to use ILLUMINUS Wav2Lip!"
else
    echo ""
    echo "❌ Download failed! Check the error messages above."
    exit 1
fi 