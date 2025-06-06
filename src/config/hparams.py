# -*- coding: utf-8 -*-
"""
Hyperparameters configuration cho ILLUMINUS Wav2Lip
"""

from dataclasses import dataclass
from typing import Tuple, Optional


@dataclass
class FrameConfig:
    """Frame configuration"""
    h: int = 224
    w: int = 224


@dataclass
class InferenceConfig:
    """Inference configuration"""
    batch_size: int = 1
    frame: FrameConfig = None
    model: dict = None
    
    def __post_init__(self):
        if self.frame is None:
            self.frame = FrameConfig()
        if self.model is None:
            self.model = {
                    "wav2lip": {"checkpoint": "data/checkpoints/wav2lip/lrs3-wav2lip.pth"},
    "nota_wav2lip": {"checkpoint": "data/checkpoints/wav2lip/lrs3-nota-wav2lip.pth"}
            }


@dataclass
class AudioConfig:
    """Audio processing configuration"""
    sample_rate: int = 16000
    hop_length: int = 200
    win_length: int = 800
    n_mels: int = 80
    num_mels: int = 80  # alias for n_mels
    n_fft: int = 800
    fmin: float = 55.0
    fmax: float = 7600.0
    
    # Audio preprocessing
    preemphasis: float = 0.97
    preemphasize: bool = True
    
    # STFT parameters
    hop_size: int = 200
    win_size: int = 800
    frame_shift_ms: Optional[float] = None  # None in YAML means ~
    use_lws: bool = False
    
    # Mel-scale parameters
    ref_level_db: float = 20.0
    min_level_db: float = -100.0
    max_abs_value: float = 4.0
    signal_normalization: bool = True
    allow_clipping_in_normalization: bool = True
    symmetric_mels: bool = True
    
    # Rescaling
    rescale: bool = True
    rescaling_max: float = 0.9


@dataclass
class VideoConfig:
    """Video processing configuration"""
    fps: int = 25
    img_size: int = 96
    resize_factor: int = 1
    rotate: bool = False
    crop: Tuple[int, int, int, int] = (0, -1, 0, -1)


@dataclass
class FaceConfig:
    """Face processing configuration"""
    img_size: int = 96
    video_fps: int = 25
    mel_step_size: int = 16


@dataclass
class ModelConfig:
    """Model configuration"""
    checkpoint_path: str = "data/checkpoints/wav2lip/lrs3-wav2lip.pth"  # Updated to match available files
    face_det_checkpoint: str = "data/checkpoints/face_detection/s3fd-619a316812.pth"
    device: str = "cuda"
    batch_size: int = 128
    face_det_batch_size: int = 16


@dataclass
class PipelineConfig:
    """Pipeline configuration"""
    pads: Tuple[int, int, int, int] = (0, 10, 0, 0)  # top, bottom, left, right
    nosmooth: bool = False
    static: bool = False
    temp_dir: str = "temp"
    result_dir: str = "static/results"


# Global configuration instances
inference = InferenceConfig()
audio = AudioConfig()
video = VideoConfig()
face = FaceConfig()
model = ModelConfig()
pipeline = PipelineConfig() 