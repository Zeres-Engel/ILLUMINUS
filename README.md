<div align="center">
  <img src="docs/images/logo.svg" alt="ILLUMINUS Logo" width="200" height="200">
</div>

# 🌟 ILLUMINUS Wav2Lip

## GPU-Accelerated Real-Time Lip Sync Generation

**ILLUMINUS Wav2Lip** là một ứng dụng web tiên tiến để tạo ra video lip-sync chất lượng cao với tốc độ xử lý nhanh. Ứng dụng tích hợp **face detection pipeline** và hỗ trợ **GPU acceleration** để đem lại trải nghiệm tốt nhất.

### ✨ Tính năng nổi bật

- 🚀 **GPU Acceleration**: Hỗ trợ CUDA để xử lý nhanh gấp nhiều lần so với CPU
- 🎯 **Advanced Face Detection**: Tích hợp S3FD face detection với batch processing
- 🔧 **Modular Architecture**: Kiến trúc module hóa dễ bảo trì và mở rộng
- 🎨 **Modern Web UI**: Giao diện web hiện đại với advanced options
- 📊 **Real-time Metrics**: Hiển thị FPS, processing time và device usage
- 🐳 **Docker Ready**: Triển khai đơn giản với Docker Compose
- 📝 **Comprehensive Logging**: Logging chi tiết với rotation và retention

### 🛠️ Kiến trúc hệ thống

```
ILLUMINUS Wav2Lip/
├── 🎯 Face Detection Pipeline
│   ├── S3FD Face Detection
│   ├── Batch Processing với OOM Recovery
│   └── Temporal Smoothing
├── 🚀 Video Processing Pipeline  
│   ├── Video Frame Loading/Saving
│   ├── Audio Processing với FFmpeg
│   └── Multiple Format Support
├── 🧠 AI Models
│   ├── Original Wav2Lip Model
│   └── Compressed Model (28× faster)
└── 🌐 Web Application
    ├── FastAPI Backend
    ├── Modern React-style UI
    └── Real-time Progress Tracking
```

### 🚀 Cài đặt và chạy

#### 📦 Docker Compose

```bash
# Clone repository
git clone https://github.com/Zeres-Engel/ILLUMINUS.git
cd ILLUMINUS

# Chạy ứng dụng
docker-compose up
```

Vậy là xong! Ứng dụng sẽ chạy tại `http://localhost:8000`

### 🚀 Tải Model Tự Động

**Bước 1: Tải tất cả models**
```bash
# Tự động tải tất cả models cần thiết
python scripts/download_models.py

# Hoặc sử dụng script theo hệ điều hành
scripts\download_models.bat       # Windows
./scripts/download_models.sh      # Unix/Linux/macOS
```

**Bước 2: Tải models theo loại**
```bash
# Chỉ tải Wav2Lip models
python scripts/download_models.py --category wav2lip

# Chỉ tải Face Detection model  
python scripts/download_models.py --category face_detection

# Xem danh sách models có sẵn
python scripts/download_models.py --list
```

### 💻 Sử dụng

#### 🌐 Web Interface (Traditional)

1. **Tải Models**: Chạy script tải model tự động (xem phía trên)

2. **Truy cập**: Mở browser và vào `http://localhost:8000`

3. **Upload Files**:
   - Upload video có chứa khuôn mặt
   - Upload audio file để sync

4. **Cấu hình**:
   - **Model**: Original Wav2Lip hoặc Compressed (28× faster)
   - **Device**: Auto/GPU/CPU
   - **Advanced Options**: Face detection settings, video processing

5. **Generate**: Nhấn "Generate Video" và chờ kết quả

#### ⚡ WebSocket API (Real-time)

**WebSocket Endpoint**: `ws://localhost:8000/ws/lip-sync`

```bash
# Test WebSocket connectivity
python scripts/websocket_test_client.py

# Process with audio + image
python scripts/websocket_test_client.py --audio sample.wav --image person.jpg

# Browser test client
curl http://localhost:8000/websocket-test
```

**Features**:
- **Real-time processing** với progress updates
- **Base64 input/output** cho audio, image và video
- **Concurrent connections** support
- **Error handling** và retry logic
- **Performance metrics** tracking

### ⚙️ Advanced Options

#### Face Detection Settings
- **Padding**: Điều chỉnh vùng face detection (top, bottom, left, right)
- **Batch Size**: Số frames xử lý cùng lúc (8, 16, 32)
- **Smoothing**: Bật/tắt temporal smoothing

#### Video Processing
- **Resize Factor**: Giảm resolution để xử lý nhanh hơn
- **Static Mode**: Sử dụng static image thay vì video
- **Auto-rotation**: Tự động xoay video nếu cần

### 🤖 Quản lý Models

#### Cấu trúc Checkpoint Mới
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

### 📁 Cấu trúc project

```
ILLUMINUS/
├── 📱 app.py                    # FastAPI application
├── 🐳 docker-compose.yml       # Docker orchestration
├── 🔧 requirements.txt         # Python dependencies
├── 📋 config/                  # Configuration files
├── 🧩 src/                     # Source modules
│   ├── services/               # Business logic services
│   │   ├── face_detection_service.py
│   │   ├── video_processing_service.py
│   │   └── wav2lip_pipeline_service.py
│   ├── models/                 # AI model wrappers
│   ├── utils/                  # Utility functions
│   └── config/                 # Config management
├── 🎨 templates/               # Web UI templates
├── 📁 static/                  # Static assets
├── 📊 data/                    # Data and model management
│   └── checkpoints/            # Organized AI model checkpoints
├── 📜 scripts/                 # Automation scripts
│   ├── download_models.py      # Model download automation
│   ├── download_models.bat     # Windows script
│   └── download_models.sh      # Unix/Linux script
├── 🔍 face_detection/          # Face detection module
├── 🎬 nota_wav2lip/            # Wav2Lip implementation
└── 📝 logs/                    # Application logs
```

### 🔍 Troubleshooting

#### Common Issues

**1. WebSocket Connection Issues**
```bash
# Error: "Unsupported upgrade request" or "No WebSocket library detected"

# Fix cho Docker:
scripts\fix_websocket_docker.bat

# Fix cho Development:
scripts\install_websocket_deps.bat

# Hoặc manual install:
pip install "uvicorn[standard]" websockets
```

**2. GPU not detected**
```bash
# Check CUDA availability trong container
docker-compose exec illuminus python -c "import torch; print(torch.cuda.is_available())"
```

**3. Out of memory errors**
- Giảm `face_det_batch_size` từ 16 xuống 8 hoặc 4
- Tăng `resize_factor` từ 1 lên 2 hoặc 4
- Chuyển sang `cpu` mode

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

1. Fork repository từ [https://github.com/Zeres-Engel/ILLUMINUS](https://github.com/Zeres-Engel/ILLUMINUS)
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

### 📄 License

Dự án được phát hành dưới **Apache License 2.0**

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