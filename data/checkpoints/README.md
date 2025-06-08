# 🤖 ILLUMINUS AI Models

Essential AI models for ILLUMINUS Wav2Lip lip synchronization.

## 📁 Directory Structure

```
data/checkpoints/
├── 👤 face_detection/            # Face detection model
│   └── s3fd-619a316812.pth       # S3FD face detector (86MB)
└── 🎯 wav2lip/                   # Wav2Lip models
    ├── lrs3-wav2lip.pth          # Original model (139MB)
    └── lrs3-nota-wav2lip.pth     # Compressed model (5MB)
```

## 🤖 Model Details

### 👤 Face Detection Model
- **File**: `s3fd-619a316812.pth`
- **Size**: 86MB
- **Purpose**: Detects faces in input videos/images
- **Architecture**: S3FD (Single Shot Scale-invariant Face Detector)

### 🎯 Wav2Lip Models

#### Original Model
- **File**: `lrs3-wav2lip.pth`
- **Size**: 139MB
- **Quality**: High precision lip-sync
- **Speed**: 1× (baseline)
- **Use Case**: Best quality results

#### Compressed Model  
- **File**: `lrs3-nota-wav2lip.pth`
- **Size**: 5MB
- **Quality**: Good lip-sync quality
- **Speed**: 28× faster
- **Use Case**: Real-time applications

## 🔥 Getting Models

### Option 1: Automatic Download (Recommended)

**Just start ILLUMINUS - models download automatically!**

```bash
# Start the application
python app.py
# Models download automatically when needed
```

### Option 2: Manual Download

If you prefer to download manually, click these direct links:

#### 👤 Face Detection Model (86MB)
**[📥 Download S3FD Model](https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth)**
- Save as: `data/checkpoints/face_detection/s3fd-619a316812.pth`

#### 🎯 Wav2Lip Models

**[📥 Download Original Model (139MB)](https://netspresso-huggingface-demo-checkpoint.s3.us-east-2.amazonaws.com/compressed-wav2lip/lrs3-wav2lip.pth)**
- Save as: `data/checkpoints/wav2lip/lrs3-wav2lip.pth`

**[📥 Download Compressed Model (5MB)](https://netspresso-huggingface-demo-checkpoint.s3.us-east-2.amazonaws.com/compressed-wav2lip/lrs3-nota-wav2lip.pth)**
- Save as: `data/checkpoints/wav2lip/lrs3-nota-wav2lip.pth`

## 📊 Storage Requirements

| Setup | Models | Total Size |
|-------|--------|------------|
| **Minimum** | Face Detection + Compressed Wav2Lip | ~91MB |
| **Recommended** | Face Detection + Both Wav2Lip | ~230MB |
| **Quality-First** | All models | ~230MB |

## 🔍 Verification

### Check Model Status
```bash
# Via API
curl http://localhost:8000/checkpoints/status

# Manual check
ls -la data/checkpoints/face_detection/
ls -la data/checkpoints/wav2lip/
```

### File Integrity
- **S3FD**: Filename contains `619a316812`
- **Models**: Auto-verified during download

## 🛠️ Troubleshooting

### Missing Models
- **Automatic**: Models download on first use
- **Manual**: Click download links above
- **Force Download**: `curl -X POST http://localhost:8000/checkpoints/auto-setup`

### Corrupted Downloads
```bash
# Remove corrupted files
rm data/checkpoints/face_detection/s3fd-619a316812.pth
rm data/checkpoints/wav2lip/*.pth

# Restart application (auto-download will trigger)
python app.py
```

---

**✨ Made with ❤️ by Andrew**  
*Automatic AI model management for seamless user experience* 