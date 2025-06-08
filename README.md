<div align="center">
  <img src="static/favicon.svg" alt="ILLUMINUS Logo" width="120" height="120">
  
  # ⭐ ILLUMINUS Wav2Lip
  
  ## Real-Time AI-Powered Lip Synchronization Platform
  
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
  [![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
  [![CUDA](https://img.shields.io/badge/CUDA-supported-green.svg)](https://developer.nvidia.com/cuda-zone)
  [![WebSocket](https://img.shields.io/badge/WebSocket-API-purple.svg)](https://github.com/Zeres-Engel/ILLUMINUS)
  
  **Advanced AI-powered lip synchronization web application with cosmic-themed UI, GPU acceleration, and real-time WebSocket processing.**

  ### 🌐 **[✨ Try Live Demo ✨](http://illuminusw2l.io.vn/)**
  **Experience ILLUMINUS Wav2Lip in action! No installation required.**
</div>

---

## 🌟 Features

> ### 🚀 **[Try it now at illuminusw2l.io.vn](http://illuminusw2l.io.vn/)** - No setup required!

- 🚀 **GPU Acceleration**: CUDA support for up to 28× faster processing
- 🎯 **Advanced Face Detection**: S3FD face detection with batch processing
- ⚡ **Real-time WebSocket API**: Bi-directional communication with progress updates
- 🎨 **Cosmic Web Interface**: Modern UI with particle effects and animations
- 🤖 **Multiple AI Models**: Original Wav2Lip (139MB) and Compressed (4.9MB)
- 🔧 **Flexible Configuration**: Customizable face detection and video processing
- 🐳 **Docker Support**: One-command deployment
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌐 **Live Production Demo**: Experience the full power at [illuminusw2l.io.vn](http://illuminusw2l.io.vn/)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ILLUMINUS Wav2Lip                        │
├─────────────────────────────────────────────────────────────┤
│  🌐 Frontend (Cosmic UI)                                   │
│  ├── HTML5 + TailwindCSS + Cosmic Effects                 │
│  ├── WebSocket Client with Real-time Updates              │
│  └── Drag & Drop File Upload (Video/Image + Audio)        │
├─────────────────────────────────────────────────────────────┤
│  ⚡ FastAPI Backend                                         │
│  ├── WebSocket API (/ws/lip-sync)                         │
│  ├── Health Check & Utilities                             │
│  └── Base64 Input/Output Processing                       │
├─────────────────────────────────────────────────────────────┤
│  🧠 AI Processing Pipeline                                 │
│  ├── S3FD Face Detection (Batch Processing)               │
│  ├── Wav2Lip Models (Original & Compressed)               │
│  ├── GPU/CUDA Acceleration                                │
│  └── Video Generation & Encoding                          │
├─────────────────────────────────────────────────────────────┤
│  🔧 Infrastructure                                         │
│  ├── Docker Containerization                              │
│  ├── Automatic Model Download                             │
│  └── Comprehensive Logging                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 🌐 Try Online Demo (Fastest!)

**[🎬 Launch ILLUMINUS Wav2Lip →](http://illuminusw2l.io.vn/)**

Experience the full application instantly without any installation:
- ✨ Upload your video/image and audio files
- 🤖 Choose between Original or Compressed AI models  
- ⚡ Real-time processing with progress updates
- 📥 Download your cosmic lip-sync result

---

### 🐳 Local Installation (Docker)

```bash
# Clone the repository
git clone https://github.com/Zeres-Engel/ILLUMINUS.git
cd ILLUMINUS

# Run with Docker Compose
docker-compose up

# Access the application
open http://localhost:8000
```
---

## 📋 Step-by-Step Installation Guide

### Prerequisites

- **Python 3.8+** (3.9+ recommended)
- **FFmpeg** for video processing
- **CUDA 11.0+** (optional, for GPU acceleration)
- **Docker** (optional, for containerized deployment)

### 1. Environment Setup

#### Linux/Ubuntu
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install FFmpeg
sudo apt install ffmpeg -y

# Install CUDA (optional, for GPU support)
# Follow NVIDIA CUDA installation guide for your system
```

### 2. Project Setup

```bash
# Clone repository
git clone https://github.com/Zeres-Engel/ILLUMINUS.git
cd ILLUMINUS

# Create and activate virtual environment
python3 -m venv illuminus_env

# Activate environment
source illuminus_env/bin/activate  # Linux/Mac
# .\illuminus_env\Scripts\activate  # Windows PowerShell
# illuminus_env\Scripts\activate.bat  # Windows CMD
```

### 3. Dependencies Installation

```bash
# Install Python packages
pip install --upgrade pip
pip install -r requirements.txt

# For development (optional)
pip install -r requirements-dev.txt
```

### 4. AI Models Download

```bash
# Download all required models automatically
python scripts/download_models.py

# Or download specific categories
python scripts/download_models.py --category wav2lip
python scripts/download_models.py --category face_detection

# Check available models
python scripts/download_models.py --list
```

### 5. Configuration

```bash
# Copy example configuration (optional)
cp config/config.example.yaml config/config.yaml

# Edit configuration if needed
nano config/config.yaml
```

### 6. Launch Application

```bash
# Start the server
python app.py

# Alternative with uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Access the application
# Open browser and navigate to: http://localhost:8000
```

---

## 🔧 How It Works

### 1. Input Processing
- **Video/Image Upload**: Supports MP4, AVI, MOV formats for video; JPG, PNG for images
- **Audio Upload**: Supports MP3, WAV, M4A formats
- **File Validation**: Automatic file type detection and size validation

### 2. AI Processing Pipeline

#### Face Detection
```python
# S3FD Face Detection with batch processing
face_detection_service = FaceDetectionService(
    device='cuda',
    batch_size=16
)
faces = face_detection_service.detect_faces(video_frames)
```

#### Lip Synchronization
```python
# Wav2Lip AI model processing
wav2lip_service = Wav2LipPipelineService(
    model_type='nota_wav2lip',  # or 'wav2lip'
    device='cuda'
)
result = wav2lip_service.process_video_audio(
    video_path, audio_path
)
```

### 3. WebSocket Communication

#### Client to Server
```json
{
  "type": "process",
  "audio_base64": "base64-encoded-audio",
  "image_base64": "base64-encoded-image",
  "options": {
    "model_type": "nota_wav2lip",
    "device": "auto",
    "pads": [0, 10, 0, 0],
    "resize_factor": 2
  }
}
```

#### Server to Client
```json
{
  "type": "progress",
  "percentage": 75,
  "message": "Processing lip synchronization...",
  "frames_processed": 150,
  "total_frames": 200
}
```

### 4. Output Generation
- **Video Encoding**: H.264 MP4 format
- **Base64 Response**: Direct download via WebSocket
- **Quality Options**: Configurable resolution and bitrate

---

## 🧪 WebSocket API Testing

### Method 1: Live Online Demo
```bash
# Try the production WebSocket API
open http://illuminusw2l.io.vn/websocket-test
```

### Method 2: Local Web Interface
```bash
# Access the built-in WebSocket test client
open http://localhost:8000/websocket-test
```

### Method 3: Python Client
```python
import asyncio
import websockets
import json
import base64

async def test_websocket():
    uri = "ws://localhost:8000/ws/lip-sync"
    
    async with websockets.connect(uri) as websocket:
        # Load files
        with open("test_audio.wav", "rb") as audio_file:
            audio_base64 = base64.b64encode(audio_file.read()).decode()
        
        with open("test_image.jpg", "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode()
        
        # Send processing request
        message = {
            "type": "process",
            "audio_base64": audio_base64,
            "image_base64": image_base64,
            "options": {
                "model_type": "nota_wav2lip",
                "device": "auto"
            }
        }
        
        await websocket.send(json.dumps(message))
        
        # Receive responses
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data['type']}")
            
            if data['type'] == 'result':
                # Save result video
                video_data = base64.b64decode(data['video_base64'])
                with open("result.mp4", "wb") as f:
                    f.write(video_data)
                break

# Run test
asyncio.run(test_websocket())
```

### Method 4: Command Line Client
```bash
# Use the included test script
python scripts/websocket_test_client.py --audio sample.wav --image person.jpg

# With custom options
python scripts/websocket_test_client.py \
    --audio sample.wav \
    --image person.jpg \
    --model nota_wav2lip \
    --device cuda
```

### Method 5: WebSocket Libraries

#### JavaScript (Browser)
```javascript
// Connect to live demo
const ws = new WebSocket('ws://illuminusw2l.io.vn/ws/lip-sync');
// Or connect to local instance
// const ws = new WebSocket('ws://localhost:8000/ws/lip-sync');

ws.onopen = function() {
    console.log('WebSocket connected');
    
    // Send processing request
    ws.send(JSON.stringify({
        type: 'process',
        audio_base64: audioBase64,
        image_base64: imageBase64,
        options: { model_type: 'nota_wav2lip' }
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data.type);
};
```

#### curl (HTTP Upgrade)
```bash
# Test live demo WebSocket
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     http://illuminusw2l.io.vn/ws/lip-sync

# Or test local instance
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     http://localhost:8000/ws/lip-sync
```

---

## 🐳 Docker Deployment

### Quick Start
```bash
# Clone and run
git clone https://github.com/Zeres-Engel/ILLUMINUS.git
cd ILLUMINUS
docker-compose up
```

### Custom Configuration

#### docker-compose.yml
```yaml
version: '3.8'

services:
  illuminus:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - ILLUMINUS_DEBUG=false
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

#### Dockerfile Customization
```dockerfile
FROM nvidia/cuda:11.8-runtime-ubuntu20.04

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy application
COPY . /app
WORKDIR /app

# Install Python packages
RUN pip install -r requirements.txt

# Download models
RUN python scripts/download_models.py

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "app.py"]
```

### Production Deployment
```bash
# Build production image
docker build -t illuminus:prod .

# Run with GPU support
docker run --gpus all -p 8000:8000 illuminus:prod

# Run with volume mounts
docker run --gpus all \
    -p 8000:8000 \
    -v $(pwd)/data:/app/data \
    -v $(pwd)/logs:/app/logs \
    illuminus:prod

# Docker Swarm deployment
docker stack deploy -c docker-compose.yml illuminus

# Kubernetes deployment
kubectl apply -f k8s/
```

---

## ⚙️ Configuration Options

### Model Configuration
```python
# config/models.yaml
models:
  wav2lip:
    original:
      url: "https://github.com/Rudrabha/Wav2Lip/releases/download/v1.0/wav2lip_gan.pth"
      size: "139MB"
      speed: "1x"
    compressed:
      url: "custom_compressed_model.pth"
      size: "4.9MB" 
      speed: "28x"
      
  face_detection:
    s3fd:
      url: "https://github.com/adrianbulat/face_alignment/releases/download/v1.0/s3fd-619a316812.pth"
      size: "86MB"
```

### Server Configuration
```python
# config/server.yaml
server:
  host: "0.0.0.0"
  port: 8000
  debug: false
  cors_origins: ["*"]
  
processing:
  default_device: "auto"
  max_file_size: 100MB
  temp_dir: "temp/"
  result_dir: "static/results/"
  
websocket:
  ping_interval: 30
  ping_timeout: 10
  max_connections: 100
```

---

## 📊 Performance Benchmarks

### Processing Speed Comparison
| Model | Device | Resolution | FPS | Memory Usage |
|-------|--------|------------|-----|--------------|
| Original Wav2Lip | CPU | 720p | 0.5 FPS | 2GB RAM |
| Original Wav2Lip | GPU | 720p | 15 FPS | 4GB VRAM |
| Compressed Model | CPU | 720p | 14 FPS | 1GB RAM |
| Compressed Model | GPU | 720p | 420 FPS | 2GB VRAM |

### File Size Limits
- **Video Input**: Up to 100MB
- **Image Input**: Up to 10MB  
- **Audio Input**: Up to 50MB
- **Output Video**: Varies based on input length

---

## 🔍 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed
```bash
# Check if server is running
curl http://localhost:8000/health

# Test WebSocket endpoint
wscat -c ws://localhost:8000/ws/lip-sync

# Check firewall settings
sudo ufw allow 8000
```

#### 2. CUDA Not Detected
```bash
# Check CUDA installation
nvidia-smi
python -c "import torch; print(torch.cuda.is_available())"

# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 3. FFmpeg Issues
```bash
# Install FFmpeg
# Ubuntu/Debian
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

#### 4. Out of Memory Errors
```python
# Reduce batch sizes in config
face_det_batch_size: 8  # Default: 16
wav2lip_batch_size: 64  # Default: 128
resize_factor: 2        # Default: 1
```

#### 5. Model Download Failed
```bash
# Manual model download
mkdir -p data/checkpoints/wav2lip
wget https://github.com/Rudrabha/Wav2Lip/releases/download/v1.0/wav2lip_gan.pth \
     -O data/checkpoints/wav2lip/lrs3-wav2lip.pth

# Check disk space
df -h

# Check internet connection
ping github.com
```

---

## 📚 API Reference

### WebSocket Endpoints

#### `/ws/lip-sync`
Main processing endpoint for real-time lip synchronization.

**Input Message Format:**
```json
{
  "type": "process",
  "audio_base64": "string",
  "image_base64": "string", 
  "options": {
    "model_type": "nota_wav2lip | wav2lip",
    "device": "auto | cuda | cpu",
    "audio_format": "wav | mp3 | m4a",
    "image_format": "jpg | png",
    "pads": [top, bottom, left, right],
    "resize_factor": 1,
    "face_det_batch_size": 16,
    "static": false,
    "nosmooth": false
  }
}
```

**Response Message Types:**
```json
// Progress Update
{
  "type": "progress",
  "percentage": 75,
  "message": "Processing...",
  "frames_processed": 150,
  "total_frames": 200
}

// Success Result
{
  "type": "result", 
  "video_base64": "string",
  "processing_time": 45.2,
  "inference_fps": 15.8,
  "frames_processed": 200
}

// Error Response
{
  "type": "error",
  "message": "Error description",
  "error_code": "validation_error"
}
```

### REST Endpoints

#### `GET /health`
System health check and status information.

#### `GET /ws/stats`
WebSocket connection statistics and performance metrics.

#### `GET /`
Main web interface.

#### `GET /websocket-test`
WebSocket API testing interface.

---

## 🤝 Contributing

### Development Setup
```bash
# Clone for development
git clone https://github.com/Zeres-Engel/ILLUMINUS.git
cd ILLUMINUS

# Create development environment
python -m venv dev_env
source dev_env/bin/activate

# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run tests
pytest tests/

# Start development server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Code Style
- **Python**: Black, isort, flake8
- **JavaScript**: Prettier, ESLint
- **Documentation**: Google-style docstrings

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Rudrabha Mukhopadhyay](https://github.com/Rudrabha/Wav2Lip)** - Original Wav2Lip research and implementation
- **[Adrian Bulat](https://github.com/1adrianb/face-alignment)** - Face alignment and detection libraries
- **PyTorch Team** - Deep learning framework
- **FastAPI Team** - Modern web framework
- **OpenAI** - AI research inspiration

---

## 📞 Support & Contact

- **📧 Email**: [ngpthanh15@gmail.com](mailto:ngpthanh15@gmail.com)
- **🌐 GitHub**: [@Zeres-Engel](https://github.com/Zeres-Engel)
- **🐛 Issues**: [GitHub Issues](https://github.com/Zeres-Engel/ILLUMINUS/issues)
- **📚 Documentation**: [Wiki](https://github.com/Zeres-Engel/ILLUMINUS/wiki)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Zeres-Engel/ILLUMINUS&type=Date)](https://star-history.com/#Zeres-Engel/ILLUMINUS&Date)

---

<div align="center">

**Made with ❤️ by [Andrew](https://github.com/Zeres-Engel)**

*Transforming the future of AI-powered video generation, one cosmic lip-sync at a time* ✨

### 🌟 **[Experience ILLUMINUS Live →](http://illuminusw2l.io.vn/)**

</div>
