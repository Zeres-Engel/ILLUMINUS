# 🤖 ILLUMINUS Checkpoints Structure

Organized checkpoint management for ILLUMINUS Wav2Lip models and dependencies.

## 📁 Directory Structure

```
data/checkpoints/
├── 🎯 wav2lip/                    # Wav2Lip models
│   ├── lrs3-wav2lip.pth          # Original model (139MB)
│   └── lrs3-nota-wav2lip.pth     # Compressed model (4.9MB)
├── 👤 face_detection/            # Face detection models  
│   └── s3fd-619a316812.pth       # S3FD face detector (86MB)
├── 🎵 audio/                     # Audio processing models
│   └── (future audio models)
├── ⚙️ configs/                   # Model configurations
│   └── (model config files)
└── 📖 README.md                  # This documentation
```

## 🤖 Model Details

### 🎯 Wav2Lip Models

#### Original Model
- **File**: `lrs3-wav2lip.pth`
- **Size**: 139MB
- **Quality**: High quality lip-sync
- **Speed**: 1× (baseline)
- **Description**: Full-precision Wav2Lip model trained on LRS3 dataset
- **Use Case**: Best quality results, slower inference

#### Compressed Model  
- **File**: `lrs3-nota-wav2lip.pth`
- **Size**: 4.9MB
- **Quality**: Good quality lip-sync
- **Speed**: 28× faster
- **Description**: Compressed Wav2Lip model using neural optimization
- **Use Case**: Real-time applications, faster inference

### 👤 Face Detection Models

#### S3FD (S3 Face Detector)
- **File**: `s3fd-619a316812.pth`
- **Size**: 86MB
- **Architecture**: Single Shot Scale-invariant Face Detector
- **Input**: RGB images
- **Output**: Face bounding boxes with confidence scores
- **Use Case**: Accurate face detection for preprocessing

### 🎵 Audio Processing Models

Future models for audio preprocessing and enhancement will be stored here.

### ⚙️ Configuration Files

Model-specific configuration files and hyperparameters.

## 🚀 Automated Download

### Quick Start
```bash
# Download all models automatically
python scripts/download_models.py

# Or use platform-specific scripts
./scripts/download_models.sh      # Unix/Linux/macOS
scripts\download_models.bat       # Windows
```

### Advanced Usage
```bash
# List available models
python scripts/download_models.py --list

# Download specific categories
python scripts/download_models.py --category wav2lip
python scripts/download_models.py --category face_detection

# Custom download path
python scripts/download_models.py --path ./custom_models
```

## 📋 Model Information

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **Original Wav2Lip** | 139MB | 1× | High | Production, Quality-first |
| **Compressed Wav2Lip** | 4.9MB | 28× | Good | Real-time, Speed-first |
| **S3FD Face Detection** | 86MB | - | High | Face preprocessing |

## 🔄 Model Loading

Models are automatically loaded by the application:

### Wav2Lip Models
```python
# In wav2lip_pipeline_service.py
wav2lip_path = "data/checkpoints/wav2lip/lrs3-wav2lip.pth"
nota_path = "data/checkpoints/wav2lip/lrs3-nota-wav2lip.pth"
```

### Face Detection
```python  
# In face_detection_service.py
s3fd_path = "data/checkpoints/face_detection/s3fd-619a316812.pth"
```

## 🔍 Verification

### File Integrity
Models are verified using checksums during download:
- **S3FD**: MD5 contains `619a316812`
- **Wav2Lip models**: Size verification

### Manual Verification
```bash
# Check file sizes
ls -lh data/checkpoints/wav2lip/
ls -lh data/checkpoints/face_detection/

# Verify checksums (if available)
md5sum data/checkpoints/face_detection/s3fd-619a316812.pth
```

## 🛠️ Troubleshooting

### Missing Models
```bash
# Re-download specific category
python scripts/download_models.py --category wav2lip

# Re-download all models
python scripts/download_models.py
```

### Corrupted Downloads
```bash
# Remove corrupted files
rm data/checkpoints/wav2lip/lrs3-wav2lip.pth

# Re-download
python scripts/download_models.py --category wav2lip
```

### Disk Space Issues
```bash
# Check available space
df -h .

# Use only compressed model (saves ~134MB)
python scripts/download_models.py --category wav2lip
# Then manually remove: lrs3-wav2lip.pth
```

## 🔮 Future Models

Planned additions to the checkpoint structure:

- **Enhanced Audio Models**: Better audio preprocessing
- **Multi-language Models**: Support for different languages  
- **Real-time Models**: Ultra-fast models for live streaming
- **High-resolution Models**: 4K and 8K video support

## 📊 Storage Requirements

### Minimum Setup (Compressed only)
- Compressed Wav2Lip: 4.9MB
- S3FD Face Detection: 86MB
- **Total**: ~91MB

### Full Setup (All models)
- Original Wav2Lip: 139MB  
- Compressed Wav2Lip: 4.9MB
- S3FD Face Detection: 86MB
- **Total**: ~230MB

### Recommended Setup
For balanced performance and storage:
- Use **compressed Wav2Lip** for most applications
- Keep **original Wav2Lip** for high-quality productions
- Always include **S3FD** for face detection

## 🤝 Contributing

When adding new models:

1. **Organize by category**: Place in appropriate subdirectory
2. **Update documentation**: Add model details to this README
3. **Update download script**: Add model to `MODELS_CONFIG`
4. **Test thoroughly**: Verify model loading and functionality
5. **Add checksums**: Include MD5/SHA256 for verification

## 📞 Support

### Model Issues
- **Slow loading**: Check disk I/O and available RAM
- **CUDA errors**: Verify GPU compatibility and drivers
- **Model not found**: Run download script to ensure files exist

### Download Issues  
- **Network errors**: Check internet connection and firewall
- **Disk space**: Ensure sufficient storage available
- **Permissions**: Check write permissions to data/ directory

---

**Model Sources:**
- **Wav2Lip**: [Original Research](https://github.com/Rudrabha/Wav2Lip)
- **S3FD**: [Face Alignment Library](https://github.com/1adrianb/face-alignment)
- **Compressed Models**: [Netspresso Optimization](https://www.netspresso.ai/)

**Made with ❤️ by Andrew**  
*GPU-Accelerated Real-Time Lip Sync Generation* 