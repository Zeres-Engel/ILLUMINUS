"""
Checkpoint Manager Service
Tự động tải và quản lý tất cả model checkpoints cho ILLUMINUS Wav2Lip
"""

import os
import hashlib
import requests
from pathlib import Path
from typing import Dict, Optional
from loguru import logger
import torch
from tqdm import tqdm


class CheckpointManager:
    """Service quản lý tự động download và verify checkpoints"""
    
    # 🔥 CHECKPOINT REGISTRY: Tất cả checkpoints cần thiết
    CHECKPOINT_REGISTRY = {
        'face_detection': {
            's3fd': {
                'url': 'https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth',
                'path': 'face_detection/s3fd-619a316812.pth',
                'md5': '619a316812',  # From filename
                'size_mb': 85,
                'description': 'S3FD Face Detection Model'
            }
        },
        'wav2lip': {
            'lrs3_wav2lip': {
                'url': 'https://netspresso-huggingface-demo-checkpoint.s3.us-east-2.amazonaws.com/compressed-wav2lip/lrs3-wav2lip.pth',
                'path': 'wav2lip/lrs3-wav2lip.pth',
                'md5': None,  # Will compute during download
                'size_mb': 139,
                'description': 'Original Wav2Lip Model trained on LRS3'
            },
            'lrs3_nota_wav2lip': {
                'url': 'https://netspresso-huggingface-demo-checkpoint.s3.us-east-2.amazonaws.com/compressed-wav2lip/lrs3-nota-wav2lip.pth',
                'path': 'wav2lip/lrs3-nota-wav2lip.pth',
                'md5': None,  # Will compute during download
                'size_mb': 5,
                'description': 'Optimized Nota Wav2Lip Model'
            }
        }
    }
    
    def __init__(self, base_dir: str = "data/checkpoints"):
        """
        Initialize Checkpoint Manager
        
        Args:
            base_dir: Base directory cho checkpoints
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        for category in self.CHECKPOINT_REGISTRY.keys():
            (self.base_dir / category).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"CheckpointManager initialized with base_dir: {self.base_dir}")
    
    def compute_md5(self, filepath: str) -> str:
        """Compute MD5 hash của file"""
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def download_file(self, url: str, filepath: str, expected_size_mb: Optional[int] = None) -> bool:
        """
        Download file với progress bar và validation
        
        Args:
            url: URL để download
            filepath: Path để save file
            expected_size_mb: Expected file size in MB
            
        Returns:
            True nếu download thành công
        """
        try:
            logger.info(f"🔄 Downloading: {url}")
            logger.info(f"📁 Saving to: {filepath}")
            
            # Create directory if not exists
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)
            
            # Download with progress bar
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            with open(filepath, 'wb') as f, tqdm(
                desc=Path(filepath).name,
                total=total_size,
                unit='B',
                unit_scale=True,
                unit_divisor=1024,
            ) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        pbar.update(len(chunk))
            
            # Validate file size
            actual_size_mb = Path(filepath).stat().st_size / (1024 * 1024)
            logger.info(f"✅ Downloaded: {actual_size_mb:.1f} MB")
            
            if expected_size_mb and abs(actual_size_mb - expected_size_mb) > 1:
                logger.warning(f"⚠️ Size mismatch: expected {expected_size_mb}MB, got {actual_size_mb:.1f}MB")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Download failed: {e}")
            # Cleanup partial download
            if os.path.exists(filepath):
                os.remove(filepath)
            return False
    
    def verify_checkpoint(self, category: str, name: str) -> bool:
        """
        Verify if checkpoint exists and is valid
        
        Args:
            category: Checkpoint category (face_detection, wav2lip)
            name: Checkpoint name
            
        Returns:
            True if checkpoint is valid
        """
        if category not in self.CHECKPOINT_REGISTRY:
            logger.error(f"Unknown category: {category}")
            return False
        
        if name not in self.CHECKPOINT_REGISTRY[category]:
            logger.error(f"Unknown checkpoint: {category}/{name}")
            return False
        
        checkpoint_info = self.CHECKPOINT_REGISTRY[category][name]
        filepath = self.base_dir / checkpoint_info['path']
        
        if not filepath.exists():
            logger.warning(f"⚠️ Checkpoint not found: {filepath}")
            return False
        
        # Check if file is loadable by torch
        try:
            torch.load(str(filepath), map_location='cpu')
            logger.info(f"✅ Checkpoint valid: {filepath}")
            return True
        except Exception as e:
            logger.error(f"❌ Checkpoint corrupted: {filepath} - {e}")
            return False
    
    def download_checkpoint(self, category: str, name: str, force: bool = False) -> bool:
        """
        Download specific checkpoint
        
        Args:
            category: Checkpoint category
            name: Checkpoint name
            force: Force re-download even if exists
            
        Returns:
            True if successful
        """
        if not force and self.verify_checkpoint(category, name):
            logger.info(f"✅ Checkpoint already exists: {category}/{name}")
            return True
        
        if category not in self.CHECKPOINT_REGISTRY:
            logger.error(f"Unknown category: {category}")
            return False
        
        if name not in self.CHECKPOINT_REGISTRY[category]:
            logger.error(f"Unknown checkpoint: {category}/{name}")
            return False
        
        checkpoint_info = self.CHECKPOINT_REGISTRY[category][name]
        filepath = self.base_dir / checkpoint_info['path']
        
        logger.info(f"🔽 Downloading {checkpoint_info['description']}")
        
        success = self.download_file(
            url=checkpoint_info['url'],
            filepath=str(filepath),
            expected_size_mb=checkpoint_info['size_mb']
        )
        
        if success:
            # Verify downloaded file
            if self.verify_checkpoint(category, name):
                logger.info(f"✅ Successfully downloaded and verified: {category}/{name}")
                return True
            else:
                logger.error(f"❌ Downloaded file failed verification: {category}/{name}")
                return False
        
        return False
    
    def download_all_checkpoints(self, force: bool = False) -> Dict[str, Dict[str, bool]]:
        """
        Download all required checkpoints
        
        Args:
            force: Force re-download all checkpoints
            
        Returns:
            Status dictionary
        """
        results = {}
        
        logger.info("🚀 Starting automatic checkpoint download...")
        
        for category, checkpoints in self.CHECKPOINT_REGISTRY.items():
            results[category] = {}
            
            for name, info in checkpoints.items():
                logger.info(f"📥 Processing {category}/{name}: {info['description']}")
                
                try:
                    success = self.download_checkpoint(category, name, force=force)
                    results[category][name] = success
                    
                    if success:
                        logger.info(f"✅ {category}/{name} ready")
                    else:
                        logger.error(f"❌ {category}/{name} failed")
                        
                except Exception as e:
                    logger.error(f"❌ Error downloading {category}/{name}: {e}")
                    results[category][name] = False
        
        # Summary
        total_checkpoints = sum(len(c) for c in self.CHECKPOINT_REGISTRY.values())
        successful = sum(1 for category in results.values() for status in category.values() if status)
        
        logger.info(f"📊 Checkpoint download summary: {successful}/{total_checkpoints} successful")
        
        if successful == total_checkpoints:
            logger.info("🎉 All checkpoints ready!")
        else:
            logger.warning(f"⚠️ {total_checkpoints - successful} checkpoints failed to download")
        
        return results
    
    def get_checkpoint_status(self) -> Dict[str, Dict[str, Dict[str, any]]]:
        """Get detailed status of all checkpoints"""
        status = {}
        
        for category, checkpoints in self.CHECKPOINT_REGISTRY.items():
            status[category] = {}
            
            for name, info in checkpoints.items():
                filepath = self.base_dir / info['path']
                
                checkpoint_status = {
                    'exists': filepath.exists(),
                    'valid': False,
                    'size_mb': 0,
                    'path': str(filepath),
                    'description': info['description']
                }
                
                if filepath.exists():
                    try:
                        checkpoint_status['size_mb'] = filepath.stat().st_size / (1024 * 1024)
                        checkpoint_status['valid'] = self.verify_checkpoint(category, name)
                    except Exception as e:
                        logger.warning(f"Error checking {category}/{name}: {e}")
                
                status[category][name] = checkpoint_status
        
        return status
    
    def cleanup_invalid_checkpoints(self) -> int:
        """Remove corrupted or invalid checkpoints"""
        removed = 0
        
        for category, checkpoints in self.CHECKPOINT_REGISTRY.items():
            for name, info in checkpoints.items():
                filepath = self.base_dir / info['path']
                
                if filepath.exists() and not self.verify_checkpoint(category, name):
                    logger.info(f"🗑️ Removing invalid checkpoint: {filepath}")
                    try:
                        filepath.unlink()
                        removed += 1
                    except Exception as e:
                        logger.error(f"Error removing {filepath}: {e}")
        
        logger.info(f"🧹 Cleaned up {removed} invalid checkpoints")
        return removed


# Global checkpoint manager instance
checkpoint_manager = CheckpointManager() 