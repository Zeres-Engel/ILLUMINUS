from typing import Dict, Type

import torch
from pathlib import Path
from loguru import logger

from . import NotaWav2Lip, Wav2Lip, Wav2LipBase

MODEL_REGISTRY: Dict[str, Type[Wav2LipBase]] = {
    'wav2lip': Wav2Lip,
    'nota_wav2lip': NotaWav2Lip
}

def _load(checkpoint_path, device):
    assert device in ['cpu', 'cuda']

    # 🔥 OPTIMIZATION: Auto-download if checkpoint doesn't exist
    checkpoint_path = Path(checkpoint_path)
    
    if not checkpoint_path.exists():
        logger.warning(f"⚠️ Checkpoint not found: {checkpoint_path}")
        logger.info("🔄 Attempting automatic download...")
        
        try:
            # Import checkpoint manager
            from src.services.checkpoint_manager import checkpoint_manager
            
            # Map checkpoint paths to registry
            checkpoint_map = {
                'data/checkpoints/wav2lip/lrs3-wav2lip.pth': ('wav2lip', 'lrs3_wav2lip'),
                'data/checkpoints/wav2lip/lrs3-nota-wav2lip.pth': ('wav2lip', 'lrs3_nota_wav2lip'),
            }
            
            checkpoint_key = str(checkpoint_path)
            if checkpoint_key in checkpoint_map:
                category, name = checkpoint_map[checkpoint_key]
                logger.info(f"🔽 Auto-downloading: {category}/{name}")
                
                success = checkpoint_manager.download_checkpoint(category, name)
                if success:
                    logger.info(f"✅ Auto-download successful: {checkpoint_path}")
                else:
                    logger.error(f"❌ Auto-download failed: {checkpoint_path}")
                    raise FileNotFoundError(f"Could not download checkpoint: {checkpoint_path}")
            else:
                logger.error(f"❌ Unknown checkpoint path: {checkpoint_path}")
                raise FileNotFoundError(f"Checkpoint not found and not in auto-download registry: {checkpoint_path}")
                
        except ImportError as e:
            logger.error(f"❌ Could not import checkpoint_manager: {e}")
            raise FileNotFoundError(f"Checkpoint not found: {checkpoint_path}")
    
    logger.info(f"📂 Loading checkpoint from: {checkpoint_path}")
    if device == 'cuda':
        return torch.load(str(checkpoint_path))
    return torch.load(str(checkpoint_path), map_location=lambda storage, _: storage)

def load_model(model_name: str, device, checkpoint, **kwargs) -> Wav2LipBase:

    cls = MODEL_REGISTRY[model_name.lower()]
    assert issubclass(cls, Wav2LipBase)

    model = cls(**kwargs)
    checkpoint_data = _load(checkpoint, device)
    model.load_state_dict(checkpoint_data)
    model = model.to(device)
    return model.eval()

def count_params(model):
    return sum(p.numel() for p in model.parameters())
