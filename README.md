<div align="center">
  <img src="docs/images/logo.svg" alt="ILLUMINUS Logo" width="200" height="200">
</div>

# 🌟 ILLUMINUS Wav2Lip

## GPU-Accelerated Real-Time Lip Sync Generation

**ILLUMINUS Wav2Lip** is an advanced web application for creating high-quality lip-sync videos with fast processing speed. The application integrates **face detection pipeline** and supports **GPU acceleration** for the best experience.

### ✨ Key Features

- 🚀 **GPU Acceleration**: CUDA support for processing many times faster than CPU
- 🎯 **Advanced Face Detection**: Integrated S3FD face detection with batch processing
- 🔧 **Modular Architecture**: Modularized architecture for easy maintenance and expansion
- 🎨 **Modern Web UI**: Modern web interface with advanced options
- 📊 **Real-time Metrics**: Display FPS, processing time and device usage
- 🐳 **Docker Ready**: Simple deployment with Docker Compose
- 📝 **Comprehensive Logging**: Detailed logging with rotation and retention
- ⚡ **WebSocket API**: Real-time processing with live progress updates
- 🔄 **Auto-loop Mode**: Automatically loops video/images to match audio length

### 🛠️ System Architecture

```
ILLUMINUS Wav2Lip/
├── 🎯 Face Detection Pipeline
│   ├── S3FD Face Detection
│   ├── Batch Processing with OOM Recovery
│   └── Temporal Smoothing
├── 🚀 Video Processing Pipeline  
│   ├── Video Frame Loading/Saving
│   ├── Audio Processing with FFmpeg
│   └── Multiple Format Support
├── 🧠 AI Models
│   ├── Original Wav2Lip Model
│   └── Compressed Model (28× faster)
├── 🌐 Web Application
│   ├── FastAPI Backend
│   ├── Modern React-style UI
│   └── Real-time Progress Tracking
└── ⚡ WebSocket API
    ├── Real-time Processing
    ├── Live Progress Updates
    └── Auto-loop Video Support
```

### 🚀 Installation and Setup

#### 📦 Docker Compose

```bash
# Clone repository
git clone https://github.com/Zeres-Engel/ILLUMINUS.git
cd ILLUMINUS

# Run application
docker-compose up
```

That's it! The application will run at `http://localhost:8000`

### 🚀 Automatic Model Download

**Step 1: Download all models**
```bash
# Automatically download all required models
python scripts/download_models.py

# Or use OS-specific scripts
scripts\download_models.bat       # Windows
./scripts/download_models.sh      # Unix/Linux/macOS
```

**Step 2: Download models by category**
```bash
# Download only Wav2Lip models
python scripts/download_models.py --category wav2lip

# Download only Face Detection model  
python scripts/download_models.py --category face_detection

# View available models list
python scripts/download_models.py --list
```

### 💻 Usage

#### 🌐 Web Interface (Traditional)

1. **Download Models**: Run automatic model download script (see above)

2. **Access**: Open browser and go to `http://localhost:8000`

3. **Upload Files**:
   - Upload video containing a face
   - Upload audio file to sync

4. **Configuration**:
   - **Model**: Original Wav2Lip or Compressed (28× faster)
   - **Device**: Auto/GPU/CPU
   - **Advanced Options**: Face detection settings, video processing

5. **Generate**: Click "Generate Video" and wait for results

#### ⚡ WebSocket API (Real-time)

**WebSocket Endpoint**: `ws://localhost:8000/ws/lip-sync`

```bash
# Test WebSocket connectivity
python scripts/websocket_test_client.py

# Process with audio + video/image
python scripts/websocket_test_client.py --audio sample.wav --video person.mp4

# Browser test client
curl http://localhost:8000/websocket-test
```

**Features**:
- **Real-time processing** with progress updates
- **Base64 input/output** for audio, video and results
- **Auto-loop support** for short videos/images
- **Concurrent connections** support
- **Error handling** and retry logic
- **Performance metrics** tracking

### ⚙️ Advanced Options

#### Face Detection Settings
- **Padding**: Adjust face detection area (top, bottom, left, right)
- **Batch Size**: Number of frames processed simultaneously (8, 16, 32)
- **Smoothing**: Enable/disable temporal smoothing

#### Video Processing
- **Resize Factor**: Reduce resolution for faster processing
- **Auto-loop Mode**: Automatically loop short videos/images to match audio
- **Auto-rotation**: Automatically rotate video if needed

### 🤖 Model Management

#### New Checkpoint Structure
```
data/checkpoints/
├── 🎯 wav2lip/                    # Wav2Lip models
│   ├── lrs3-wav2lip.pth          # Original (139MB) 
│   └── lrs3-nota-wav2lip.pth     # Compressed (4.9MB)
├── 👤 face_detection/            # Face detection
│   └── s3fd-619a316812.pth       # S3FD detector (86MB)
├── 🎵 audio/                     # Audio models (future)
└── ⚙️ configs/                   # Model configs
```

#### Storage Requirements
- **Minimum**: ~91MB (compressed + face detection)
- **Full Setup**: ~230MB (all models)
- **Recommended**: Keep both Wav2Lip models

### 📁 Project Structure

```
ILLUMINUS/
├── 📱 app.py                    # FastAPI application
├── 🐳 docker-compose.yml       # Docker orchestration
├── 🔧 requirements.txt         # Python dependencies
├── 📋 config/                  # Configuration files
├── 🧩 src/                     # Source modules
│   ├── routes/                 # API routes
│   │   ├── websocket_api.py    # WebSocket real-time API
│   │   └── rest_api.py         # REST API endpoints
│   ├── services/               # Business logic services
│   │   ├── face_detection_service.py
│   │   ├── video_processing_service.py
│   │   └── wav2lip_pipeline_service.py
│   ├── models/                 # AI model wrappers
│   ├── utils/                  # Utility functions
│   └── config/                 # Config management
├── 🎨 frontend/                # Frontend assets
│   ├── templates/              # HTML templates
│   └── assets/                 # CSS/JS/Images
├── 📁 static/                  # Static file storage
├── 📊 data/                    # Data and model management
│   └── checkpoints/            # Organized AI model checkpoints
├── 📜 scripts/                 # Automation scripts
│   ├── download_models.py      # Model download automation
│   ├── websocket_test_client.py # WebSocket test client
│   ├── download_models.bat     # Windows script
│   └── download_models.sh      # Unix/Linux script
├── 🔍 face_detection/          # Face detection module
├── 🎬 nota_wav2lip/            # Wav2Lip implementation
├── 📚 docs/                    # Documentation
└── 📝 logs/                    # Application logs
```

### 🔍 Troubleshooting

#### Common Issues

**1. WebSocket Connection Issues**
```bash
# Error: "Unsupported upgrade request" or "No WebSocket library detected"

# Fix for Docker:
scripts\fix_websocket_docker.bat

# Fix for Development:
scripts\install_websocket_deps.bat

# Or manual install:
pip install "uvicorn[standard]" websockets
```

**2. GPU not detected**
```bash
# Check CUDA availability in container
docker-compose exec illuminus python -c "import torch; print(torch.cuda.is_available())"
```

**3. Out of memory errors**
- Reduce `face_det_batch_size` from 16 to 8 or 4
- Increase `resize_factor` from 1 to 2 or 4
- Switch to `cpu` mode

**4. FFmpeg issues (Ubuntu/Linux)**
```bash
# Install FFmpeg
sudo apt-get update
sudo apt-get install ffmpeg
```

**5. Container issues**
```bash
# Rebuild container
docker-compose down
docker-compose up --build
```

### 🤝 Contributing

1. Fork repository from [https://github.com/Zeres-Engel/ILLUMINUS](https://github.com/Zeres-Engel/ILLUMINUS)
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

### 📄 License

This project is released under **Apache License 2.0**

### 🙏 Acknowledgments

- **[Rudrabha Mukhopadhyay](https://github.com/Rudrabha/Wav2Lip)** - Original Wav2Lip
- **[Adrian Bulat](https://github.com/1adrianb/face-alignment)** - Face detection library

### 👨‍💻 About the Developer

**Andrew** - AI Engineer passionate about computer vision and deep learning

- 🔭 Currently studying at FPT University
- 💬 Ask me about **Data Structure and Algorithm**
- 📫 Contact: **ngpthanh15@gmail.com**
- ⚡ Fun fact: **I am a friendly person with a strong drive for progress**

### 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Zeres-Engel/ILLUMINUS/issues)
- **Email**: ngpthanh15@gmail.com
- **GitHub**: [@Zeres-Engel](https://github.com/Zeres-Engel)

---

**Made with ❤️ by Andrew**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![CUDA](https://img.shields.io/badge/CUDA-supported-green.svg)](https://developer.nvidia.com/cuda-zone)