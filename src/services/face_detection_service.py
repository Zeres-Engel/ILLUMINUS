"""
Face Detection Service với batch processing
Tích hợp face detection vào pipeline Wave2Lip
"""

import os
import cv2
import numpy as np
import torch
import sys
from typing import List, Tuple, Optional, Union
from pathlib import Path
from loguru import logger

# Import face_detection from models
from src.models import face_detection


class FaceDetectionService:
    """Service xử lý face detection với batch processing"""
    
    def __init__(self, 
                 device: str = 'cuda',
                 batch_size: int = 16,
                 checkpoint_path: str = "data/checkpoints/face_detection/s3fd-619a316812.pth"):
        """
        Initialize Face Detection Service
        
        Args:
            device: Device để chạy inference ('cuda' hoặc 'cpu')
            batch_size: Batch size cho face detection
            checkpoint_path: Path đến face detection checkpoint
        """
        self.device = device
        self.batch_size = batch_size
        self.checkpoint_path = checkpoint_path
        self.detector = None
        
        # Validate checkpoint
        if not os.path.exists(checkpoint_path):
            logger.warning(f"Face detection checkpoint not found: {checkpoint_path}")
        
        logger.info(f"FaceDetectionService initialized with device: {device}, batch_size: {batch_size}")
    
    def _initialize_detector(self):
        """Lazy initialization của face detector"""
        if self.detector is None:
            try:
                # Ensure device format is correct for face detection
                device = self.device
                if device not in ['cpu', 'cuda']:
                    logger.warning(f"Invalid device '{device}', defaulting to 'cpu'")
                    device = 'cpu'
                
                # Check if CUDA is available when requesting CUDA
                if device == 'cuda' and not torch.cuda.is_available():
                    logger.warning("CUDA requested but not available, falling back to CPU")
                    device = 'cpu'
                
                logger.info(f"Initializing face detector with device: {device}")
                logger.info(f"🔥 CHECKPOINT: Using local checkpoint: {self.checkpoint_path}")
                
                # 🔥 OPTIMIZATION: Ensure local checkpoint exists and disable torch.hub
                import os
                
                # Temporarily disable torch hub cache to prevent automatic downloads
                original_torch_home = os.environ.get('TORCH_HOME', '')
                os.environ['TORCH_HOME'] = '/tmp/disabled_torch_hub'  # Redirect to temp location
                
                # Force offline mode if possible
                original_hub_cache = os.environ.get('TORCH_HUB_CACHE_DIR', '')
                os.environ['TORCH_HUB_CACHE_DIR'] = '/tmp/disabled_torch_hub'
                
                # Check if local checkpoint exists
                if os.path.exists(self.checkpoint_path):
                    logger.info(f"✅ Local checkpoint found: {self.checkpoint_path}")
                else:
                    logger.warning(f"⚠️ Local checkpoint not found: {self.checkpoint_path}")
                    # Try auto-download via checkpoint manager
                    try:
                        from src.services.checkpoint_manager import checkpoint_manager
                        logger.info("🔄 Attempting auto-download via checkpoint manager...")
                        success = checkpoint_manager.download_checkpoint('face_detection', 's3fd')
                        if success:
                            logger.info(f"✅ Auto-download successful")
                        else:
                            logger.warning(f"⚠️ Auto-download failed, face detection may download automatically")
                    except ImportError:
                        logger.warning("Could not import checkpoint manager")
                
                try:
                    self.detector = face_detection.FaceAlignment(
                        face_detection.LandmarksType._2D, 
                        flip_input=False, 
                        device=device,
                        verbose=True  # 🔥 Enable verbose to see checkpoint loading
                    )
                    logger.info("✅ Face detector initialized successfully")
                    
                finally:
                    # Restore original environment variables
                    if original_torch_home:
                        os.environ['TORCH_HOME'] = original_torch_home
                    else:
                        os.environ.pop('TORCH_HOME', None)
                        
                    if original_hub_cache:
                        os.environ['TORCH_HUB_CACHE_DIR'] = original_hub_cache
                    else:
                        os.environ.pop('TORCH_HUB_CACHE_DIR', None)
                        
            except Exception as e:
                logger.error(f"❌ Failed to initialize face detector: {e}")
                logger.error(f"Device: {self.device}, Checkpoint: {self.checkpoint_path}")
                raise e
    
    def detect_faces_batch(self, images: List[np.ndarray]) -> List[Optional[Tuple[int, int, int, int]]]:
        """
        Detect faces trong batch images với retry mechanism
        
        Args:
            images: List các frames (BGR format)
            
        Returns:
            List các bounding boxes (x1, y1, x2, y2) hoặc None nếu không detect được
        """
        self._initialize_detector()
        
        batch_size = self.batch_size
        
        while True:
            predictions = []
            try:
                # Process in batches
                for i in range(0, len(images), batch_size):
                    batch = np.array(images[i:i + batch_size])
                    batch_predictions = self.detector.get_detections_for_batch(batch)
                    predictions.extend(batch_predictions)
                break
                
            except RuntimeError as e:
                if batch_size == 1:
                    logger.error(f"Image too big for face detection: {e}")
                    raise RuntimeError('Image too big to run face detection on GPU. Please use --resize_factor argument')
                
                batch_size //= 2
                logger.warning(f'Recovering from OOM error; New batch size: {batch_size}')
                continue
        
        return predictions
    
    def get_smoothened_boxes(self, boxes: List[Tuple[int, int, int, int]], T: int = 5) -> List[Tuple[int, int, int, int]]:
        """
        Smooth face detection boxes qua temporal window
        
        Args:
            boxes: List các bounding boxes
            T: Window size cho smoothing
            
        Returns:
            Smoothed bounding boxes
        """
        if len(boxes) <= T:
            return boxes
            
        smoothed = []
        for i in range(len(boxes)):
            if i + T > len(boxes):
                window = boxes[len(boxes) - T:]
            else:
                window = boxes[i:i + T]
            
            # Convert None boxes to previous valid box for smoothing
            valid_boxes = [box for box in window if box is not None]
            if valid_boxes:
                mean_box = np.mean(valid_boxes, axis=0).astype(int)
                smoothed.append(tuple(mean_box))
            else:
                smoothed.append(boxes[i])  # Keep original if no valid boxes
                
        return smoothed
    
    def process_video_frames(self, 
                           frames: List[np.ndarray],
                           pads: Tuple[int, int, int, int] = (0, 10, 0, 0),
                           smooth: bool = True,
                           box: Optional[Tuple[int, int, int, int]] = None) -> List[Tuple[np.ndarray, Tuple[int, int, int, int]]]:
        """
        Process video frames để extract faces với bounding boxes
        
        Args:
            frames: List các video frames
            pads: Padding (top, bottom, left, right)
            smooth: Có smooth detection boxes không
            box: Fixed bounding box nếu có
            
        Returns:
            List của (cropped_face, coordinates) cho mỗi frame
        """
        if box and box != (-1, -1, -1, -1):
            # Use fixed bounding box
            logger.info('Using specified bounding box instead of face detection...')
            y1, y2, x1, x2 = box
            results = []
            for frame in frames:
                face = frame[y1:y2, x1:x2]
                results.append((face, (x1, y1, x2, y2)))
            return results
        
        # Face detection
        logger.info(f"Detecting faces in {len(frames)} frames...")
        predictions = self.detect_faces_batch(frames)
        
        # Validate detections
        for i, rect in enumerate(predictions):
            if rect is None:
                # Save faulty frame for debugging
                faulty_path = Path('temp/faulty_frame.jpg')
                faulty_path.parent.mkdir(exist_ok=True)
                cv2.imwrite(str(faulty_path), frames[i])
                raise ValueError(f'Face not detected in frame {i}! Ensure the video contains a face in all frames.')
        
        # Apply padding and extract coordinates
        pady1, pady2, padx1, padx2 = pads
        coordinates = []
        
        for rect, frame in zip(predictions, frames):
            x1, y1, x2, y2 = rect
            
            # Apply padding
            y1 = max(0, y1 - pady1)
            y2 = min(frame.shape[0], y2 + pady2)
            x1 = max(0, x1 - padx1)
            x2 = min(frame.shape[1], x2 + padx2)
            
            coordinates.append((x1, y1, x2, y2))
        
        # Smooth detection boxes
        if smooth:
            coordinates = self.get_smoothened_boxes(coordinates, T=5)
        
        # Extract faces
        results = []
        for frame, (x1, y1, x2, y2) in zip(frames, coordinates):
            face = frame[y1:y2, x1:x2]
            results.append((face, (x1, y1, x2, y2)))
        
        logger.info(f"Successfully processed {len(results)} frames")
        return results
    
    def cleanup(self):
        """Cleanup detector để giải phóng memory"""
        if self.detector is not None:
            del self.detector
            self.detector = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("Face detector cleaned up") 