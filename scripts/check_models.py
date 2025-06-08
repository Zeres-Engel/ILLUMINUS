#!/usr/bin/env python3
"""
ILLUMINUS Wav2Lip - Model Checker Script
Verifies that all required models are present and valid

Author: Andrew (ngpthanh15@gmail.com)
Version: 1.0.0
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple
import sys

# Required models with their expected sizes (in bytes)
REQUIRED_MODELS = {
    "data/checkpoints/wav2lip/lrs3-wav2lip.pth": {
        "min_size": 130_000_000,  # ~130MB minimum
        "max_size": 150_000_000,  # ~150MB maximum
        "description": "Original Wav2Lip Model",
        "category": "wav2lip"
    },
    "data/checkpoints/wav2lip/lrs3-nota-wav2lip.pth": {
        "min_size": 4_000_000,    # ~4MB minimum
        "max_size": 6_000_000,    # ~6MB maximum
        "description": "Compressed Wav2Lip Model",
        "category": "wav2lip"
    },
    "data/checkpoints/face_detection/s3fd-619a316812.pth": {
        "min_size": 80_000_000,   # ~80MB minimum
        "max_size": 100_000_000,  # ~100MB maximum
        "description": "S3FD Face Detection Model",
        "category": "face_detection"
    }
}

OPTIONAL_MODELS = {
    "sample/": {
        "description": "Sample inference data",
        "category": "samples"
    }
}

def format_size(size_bytes: int) -> str:
    """Format bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f}TB"

def check_model(path: str, config: Dict) -> Tuple[bool, str]:
    """Check if a model file exists and has correct size"""
    file_path = Path(path)
    
    if not file_path.exists():
        return False, "❌ Missing"
    
    if file_path.is_dir():
        # Directory check (for samples)
        if any(file_path.iterdir()):
            return True, "✅ Present"
        else:
            return False, "❌ Empty directory"
    
    # File size check
    size = file_path.stat().st_size
    min_size = config.get("min_size", 0)
    max_size = config.get("max_size", float('inf'))
    
    if size < min_size:
        return False, f"❌ Too small ({format_size(size)})"
    elif size > max_size:
        return False, f"⚠️ Too large ({format_size(size)})"
    else:
        return True, f"✅ OK ({format_size(size)})"

def main():
    print("🌟 ILLUMINUS Wav2Lip - Model Checker")
    print("=" * 50)
    print()
    
    missing_models = []
    invalid_models = []
    valid_models = []
    
    # Check required models
    print("🎯 REQUIRED MODELS")
    print("-" * 30)
    
    for model_path, config in REQUIRED_MODELS.items():
        is_valid, status = check_model(model_path, config)
        description = config["description"]
        
        print(f"{description:<30} {status}")
        
        if not is_valid:
            if "Missing" in status:
                missing_models.append(model_path)
            else:
                invalid_models.append(model_path)
        else:
            valid_models.append(model_path)
    
    print()
    
    # Check optional models
    print("📦 OPTIONAL MODELS")
    print("-" * 30)
    
    for model_path, config in OPTIONAL_MODELS.items():
        is_valid, status = check_model(model_path, config)
        description = config["description"]
        
        print(f"{description:<30} {status}")
    
    print()
    
    # Summary
    print("📋 SUMMARY")
    print("=" * 50)
    
    total_required = len(REQUIRED_MODELS)
    total_valid = len(valid_models)
    
    print(f"✅ Valid models: {total_valid}/{total_required}")
    print(f"❌ Missing models: {len(missing_models)}")
    print(f"⚠️ Invalid models: {len(invalid_models)}")
    
    if missing_models:
        print("\n📥 MISSING MODELS:")
        for model in missing_models:
            print(f"   • {model}")
        print("\n💡 To download missing models:")
        print("   python scripts/download_models.py")
    
    if invalid_models:
        print("\n⚠️ INVALID MODELS:")
        for model in invalid_models:
            print(f"   • {model}")
        print("\n💡 To re-download invalid models:")
        print("   python scripts/download_models.py")
    
    if not missing_models and not invalid_models:
        print("\n🎉 All required models are present and valid!")
        print("✨ Ready to use ILLUMINUS Wav2Lip!")
        return True
    else:
        print("\n🔧 Please download the missing/invalid models before using the application.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 