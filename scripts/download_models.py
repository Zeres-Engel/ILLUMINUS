#!/usr/bin/env python3
"""
ILLUMINUS Wav2Lip - Automated Model Download Script
Downloads all required checkpoints to organized data/checkpoints/ structure

Author: Andrew (ngpthanh15@gmail.com)
Version: 1.0.0
"""

import os
import sys
import requests
import hashlib
import tarfile
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlparse
import argparse

# Model configurations
MODELS_CONFIG = {
    "wav2lip": {
        "original": {
            "url": "https://netspresso-huggingface-demo-checkpoint.s3.us-east-2.amazonaws.com/compressed-wav2lip/lrs3-wav2lip.pth",
            "filename": "lrs3-wav2lip.pth",
            "size": "139MB",
            "description": "Original Wav2Lip model - High quality",
            "md5": None  # Add if available
        },
        "compressed": {
            "url": "https://netspresso-huggingface-demo-checkpoint.s3.us-east-2.amazonaws.com/compressed-wav2lip/lrs3-nota-wav2lip.pth", 
            "filename": "lrs3-nota-wav2lip.pth",
            "size": "4.9MB",
            "description": "Compressed Wav2Lip model - 28× faster",
            "md5": None
        }
    },
    "face_detection": {
        "s3fd": {
            "url": "https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth",
            "filename": "s3fd-619a316812.pth", 
            "size": "86MB",
            "description": "S3FD Face Detection model",
            "md5": "619a316812"
        }
    },
    "samples": {
        "inference_data": {
            "url": "https://netspresso-huggingface-demo-checkpoint.s3.us-east-2.amazonaws.com/data/compressed-wav2lip-inference/sample.tar.gz",
            "filename": "sample.tar.gz",
            "size": "~50MB", 
            "description": "Sample inference data",
            "extract": True,
            "extract_to": "sample/"
        }
    }
}

class ModelDownloader:
    def __init__(self, base_path: str = "data/checkpoints"):
        self.base_path = Path(base_path)
        self.create_directories()
        
    def create_directories(self):
        """Create organized checkpoint directories"""
        directories = [
            self.base_path / "wav2lip",
            self.base_path / "face_detection", 
            self.base_path / "audio",
            self.base_path / "configs",
            Path("sample")  # For sample data
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"📁 Created directory: {directory}")
    
    def download_file(self, url: str, destination: Path, description: str = "") -> bool:
        """Download file with progress bar"""
        try:
            print(f"🚀 Downloading {description}...")
            print(f"📍 URL: {url}")
            print(f"💾 Destination: {destination}")
            
            # Check if file already exists
            if destination.exists():
                print(f"✅ File already exists: {destination}")
                return True
            
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(destination, 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        file.write(chunk)
                        downloaded += len(chunk)
                        
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            print(f"\r📊 Progress: {progress:.1f}% ({downloaded:,}/{total_size:,} bytes)", end='')
            
            print(f"\n✅ Downloaded successfully: {destination}")
            return True
            
        except requests.RequestException as e:
            print(f"❌ Error downloading {url}: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def verify_checksum(self, file_path: Path, expected_md5: Optional[str]) -> bool:
        """Verify file checksum if provided"""
        if not expected_md5:
            return True
            
        try:
            print(f"🔍 Verifying checksum for {file_path}...")
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            
            calculated = hash_md5.hexdigest()
            if expected_md5.lower() in calculated.lower():
                print(f"✅ Checksum verified: {calculated}")
                return True
            else:
                print(f"❌ Checksum mismatch! Expected: {expected_md5}, Got: {calculated}")
                return False
                
        except Exception as e:
            print(f"⚠️ Could not verify checksum: {e}")
            return True  # Continue anyway
    
    def extract_archive(self, archive_path: Path, extract_to: Path):
        """Extract tar.gz archives"""
        try:
            print(f"📦 Extracting {archive_path} to {extract_to}...")
            extract_to.mkdir(parents=True, exist_ok=True)
            
            with tarfile.open(archive_path, 'r:gz') as tar:
                tar.extractall(extract_to)
                
            print(f"✅ Extracted successfully to {extract_to}")
            
            # Clean up archive
            archive_path.unlink()
            print(f"🗑️ Cleaned up archive: {archive_path}")
            
        except Exception as e:
            print(f"❌ Error extracting {archive_path}: {e}")
    
    def download_category(self, category: str, models_dict: Dict) -> List[str]:
        """Download all models in a category"""
        failed_downloads = []
        
        print(f"\n🎯 Downloading {category.upper()} models...")
        print("=" * 50)
        
        for model_name, config in models_dict.items():
            url = config["url"]
            filename = config["filename"]
            description = config.get("description", f"{category} - {model_name}")
            md5_hash = config.get("md5")
            
            # Determine destination
            if category == "samples":
                destination = Path(filename)
            else:
                destination = self.base_path / category / filename
            
            # Download
            success = self.download_file(url, destination, description)
            
            if success:
                # Verify checksum
                if not self.verify_checksum(destination, md5_hash):
                    failed_downloads.append(f"{category}/{model_name}")
                    continue
                
                # Extract if needed
                if config.get("extract", False):
                    extract_to = Path(config.get("extract_to", category))
                    self.extract_archive(destination, extract_to)
                    
            else:
                failed_downloads.append(f"{category}/{model_name}")
        
        return failed_downloads
    
    def download_all(self, categories: Optional[List[str]] = None) -> bool:
        """Download all models or specific categories"""
        if categories is None:
            categories = list(MODELS_CONFIG.keys())
        
        print("🌟 ILLUMINUS Wav2Lip - Model Downloader")
        print("=" * 50)
        print(f"📥 Downloading to: {self.base_path.absolute()}")
        print(f"🎯 Categories: {', '.join(categories)}")
        print()
        
        all_failed = []
        
        for category in categories:
            if category not in MODELS_CONFIG:
                print(f"⚠️ Unknown category: {category}")
                continue
                
            failed = self.download_category(category, MODELS_CONFIG[category])
            all_failed.extend(failed)
        
        # Summary
        print("\n" + "=" * 50)
        print("📋 DOWNLOAD SUMMARY")
        print("=" * 50)
        
        if all_failed:
            print(f"❌ Failed downloads ({len(all_failed)}):")
            for failed in all_failed:
                print(f"   • {failed}")
            return False
        else:
            print("✅ All downloads completed successfully!")
            print("\n🎉 Ready to use ILLUMINUS Wav2Lip!")
            return True
    
    def list_models(self):
        """List all available models"""
        print("🌟 ILLUMINUS Wav2Lip - Available Models")
        print("=" * 50)
        
        for category, models in MODELS_CONFIG.items():
            print(f"\n🎯 {category.upper()}")
            print("-" * 30)
            
            for model_name, config in models.items():
                print(f"📦 {model_name}")
                print(f"   Size: {config.get('size', 'Unknown')}")
                print(f"   File: {config['filename']}")
                print(f"   Desc: {config.get('description', 'No description')}")
                print()

def main():
    parser = argparse.ArgumentParser(
        description="ILLUMINUS Wav2Lip Model Downloader",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/download_models.py                    # Download all models
  python scripts/download_models.py --list             # List available models  
  python scripts/download_models.py --category wav2lip # Download only Wav2Lip models
  python scripts/download_models.py --path ./models    # Custom download path
        """
    )
    
    parser.add_argument(
        "--category", "-c",
        nargs="+",
        choices=list(MODELS_CONFIG.keys()),
        help="Download specific categories only"
    )
    
    parser.add_argument(
        "--path", "-p",
        default="data/checkpoints",
        help="Base path for downloads (default: data/checkpoints)"
    )
    
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List available models and exit"
    )
    
    args = parser.parse_args()
    
    downloader = ModelDownloader(args.path)
    
    if args.list:
        downloader.list_models()
        return
    
    success = downloader.download_all(args.category)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 