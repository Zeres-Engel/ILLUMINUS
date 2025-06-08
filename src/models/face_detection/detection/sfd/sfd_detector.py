import os
import cv2
import torch
from torch.utils.model_zoo import load_url
from pathlib import Path
from loguru import logger

from ..core import FaceDetector

from .net_s3fd import s3fd
from .bbox import *
from .detect import *

models_urls = {
    's3fd': 'https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth',
}

# 🔥 OPTIMIZATION: Local checkpoint paths to avoid downloading
LOCAL_CHECKPOINT_PATHS = [
    'data/checkpoints/face_detection/s3fd-619a316812.pth',  # Host path
    '/app/data/checkpoints/face_detection/s3fd-619a316812.pth',  # Container path
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 's3fd.pth'),  # Original fallback
]


class SFDDetector(FaceDetector):
    def __init__(self, device, path_to_detector=None, verbose=False):
        super(SFDDetector, self).__init__(device, verbose)

        # 🔥 OPTIMIZATION: Try local checkpoints first, auto-download if needed
        model_weights = None
        checkpoint_used = None
        
        # Priority 1: Use provided path
        if path_to_detector and os.path.isfile(path_to_detector):
            if verbose:
                print(f"✅ Loading face detection from provided path: {path_to_detector}")
            model_weights = torch.load(path_to_detector, map_location=device)
            checkpoint_used = path_to_detector
        else:
            # Priority 2: Try local checkpoint paths
            for local_path in LOCAL_CHECKPOINT_PATHS:
                if os.path.isfile(local_path):
                    if verbose:
                        print(f"✅ Loading face detection from local checkpoint: {local_path}")
                    model_weights = torch.load(local_path, map_location=device)
                    checkpoint_used = local_path
                    break
            
            # Priority 3: Auto-download using checkpoint manager
            if model_weights is None:
                if verbose:
                    print("🔄 No local checkpoint found, attempting auto-download...")
                
                try:
                    from src.services.checkpoint_manager import checkpoint_manager
                    
                    # Try to auto-download face detection checkpoint
                    success = checkpoint_manager.download_checkpoint('face_detection', 's3fd')
                    
                    if success:
                        # Try loading the downloaded checkpoint
                        for local_path in LOCAL_CHECKPOINT_PATHS:
                            if os.path.isfile(local_path):
                                if verbose:
                                    print(f"✅ Loading auto-downloaded checkpoint: {local_path}")
                                model_weights = torch.load(local_path, map_location=device)
                                checkpoint_used = f"auto-downloaded: {local_path}"
                                break
                
                except ImportError as e:
                    if verbose:
                        print(f"⚠️ Could not import checkpoint_manager: {e}")
                
                # Priority 4: Download manually if auto-download failed (LAST RESORT)
                if model_weights is None:
                    if verbose:
                        print(f"⚠️ Auto-download failed, manual download from: {models_urls['s3fd']}")
                    model_weights = load_url(models_urls['s3fd'], map_location=device)
                    checkpoint_used = "manual download"

        if verbose:
            print(f"🎯 Face detection checkpoint loaded from: {checkpoint_used}")

        # Initialise the face detector
        self.face_detector = s3fd()
        self.face_detector.load_state_dict(model_weights)
        self.face_detector.to(device)
        self.face_detector.eval()

    def detect_from_image(self, tensor_or_path):
        image = self.tensor_or_path_to_ndarray(tensor_or_path)

        bboxlist = detect(self.face_detector, image, device=self.device)
        keep = nms(bboxlist, 0.3)
        bboxlist = bboxlist[keep, :]
        bboxlist = [x for x in bboxlist if x[-1] > 0.5]

        return bboxlist

    def detect_from_batch(self, images):
        bboxlists = batch_detect(self.face_detector, images, device=self.device)
        keeps = [nms(bboxlists[:, i, :], 0.3) for i in range(bboxlists.shape[1])]
        bboxlists = [bboxlists[keep, i, :] for i, keep in enumerate(keeps)]
        bboxlists = [[x for x in bboxlist if x[-1] > 0.5] for bboxlist in bboxlists]

        return bboxlists

    @property
    def reference_scale(self):
        return 195

    @property
    def reference_x_shift(self):
        return 0

    @property
    def reference_y_shift(self):
        return 0
