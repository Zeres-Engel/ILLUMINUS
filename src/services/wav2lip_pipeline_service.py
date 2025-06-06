"""
Wav2Lip Pipeline Service
Tích hợp face detection và Wav2Lip processing thành pipeline hoàn chỉnh
"""

import cv2
import numpy as np
import torch
import time
import sys
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
from loguru import logger

# Add root path to import config
root_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_path))

from .face_detection_service import FaceDetectionService
from .video_processing_service import VideoProcessingService

# Import from root config and nota_wav2lip
try:
    from src.models.nota_wav2lip.demo import Wav2LipModelComparisonDemo
    from src.models.nota_wav2lip.video import AudioSlicer
    from src.config import hparams as hp
except ImportError as e:
    logger.error(f"Import error: {e}")
    raise e


class Wav2LipPipelineService:
    """Pipeline service tích hợp hoàn chỉnh cho Wav2Lip với face detection"""
    
    def __init__(self, 
                 device: str = 'cuda',
                 face_det_batch_size: int = 16,
                 wav2lip_batch_size: int = 128,
                 result_dir: str = './temp',
                 external_face_service=None):
        """
        Initialize Wav2Lip Pipeline Service
        
        Args:
            device: Device để chạy inference
            face_det_batch_size: Batch size cho face detection
            wav2lip_batch_size: Batch size cho Wav2Lip
            result_dir: Directory để lưu kết quả
            external_face_service: External face detection service (optional)
        """
        self.device = device
        self.face_det_batch_size = face_det_batch_size
        self.wav2lip_batch_size = wav2lip_batch_size
        self.result_dir = Path(result_dir)
        self.result_dir.mkdir(exist_ok=True)
        
        # Initialize services
        if external_face_service is not None:
            self.face_detection_service = external_face_service
            logger.info("Using external face detection service")
        else:
            self.face_detection_service = FaceDetectionService(
                device=device, 
                batch_size=face_det_batch_size
            )
            logger.info("Created internal face detection service")
            
        self.video_processing_service = VideoProcessingService()
        
        # Wave2Lip servicer (lazy load)
        self.wave2lip_servicer = None
        
        logger.info(f"Wav2LipPipelineService initialized with device: {device}")
    
    def _get_wave2lip_servicer(self):
        """Lazy load Wave2Lip servicer"""
        if self.wave2lip_servicer is None:
            logger.info("Initializing Wave2Lip servicer...")
            self.wave2lip_servicer = Wav2LipModelComparisonDemo(
                device=self.device,
                result_dir=str(self.result_dir)
            )
            logger.info("Wave2Lip servicer initialized")
        return self.wave2lip_servicer
    
    def process_video_audio(self,
                           video_path: str,
                           audio_path: str,
                           model_type: str = 'nota_wav2lip',
                           # Video processing options
                           resize_factor: int = 1,
                           crop: Tuple[int, int, int, int] = (0, -1, 0, -1),
                           rotate: bool = False,
                           # Face detection options
                           pads: Tuple[int, int, int, int] = (0, 10, 0, 0),
                           box: Optional[Tuple[int, int, int, int]] = None,
                           nosmooth: bool = False,
                           # Processing options
                           static: bool = False,
                           output_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Process video và audio để tạo lip-sync video
        
        Args:
            video_path: Path đến video file
            audio_path: Path đến audio file
            model_type: 'wav2lip' hoặc 'nota_wav2lip'
            resize_factor: Factor để resize video
            crop: Crop coordinates
            rotate: Có rotate video không
            pads: Padding cho face detection
            box: Fixed bounding box nếu có
            nosmooth: Tắt smoothing
            static: Sử dụng static image
            output_path: Path output tùy chọn
            
        Returns:
            Dictionary chứa thông tin kết quả
        """
        start_time = time.time()
        
        try:
            # Load video frames
            logger.info("Loading video frames...")
            frames, fps = self.video_processing_service.load_video_frames(
                video_path=video_path,
                resize_factor=resize_factor,
                crop=crop,
                rotate=rotate
            )
            
            # Check if static mode
            if static and len(frames) > 1:
                frames = [frames[0]]
                logger.info("Using static mode - only first frame")
            
            # Process audio
            logger.info("Processing audio...")
            audio_slicer = AudioSlicer(audio_path)
            mel_chunks = list(audio_slicer)
            
            logger.info(f"Video frames: {len(frames)}, Audio chunks: {len(mel_chunks)}")
            
            # Adjust frames to match audio length
            if not static:
                min_length = min(len(frames), len(mel_chunks))
                frames = frames[:min_length]
                mel_chunks = mel_chunks[:min_length]
                logger.info(f"Adjusted to {min_length} frames/chunks")
            
            # Face detection and processing
            logger.info("Processing faces...")
            face_results = self.face_detection_service.process_video_frames(
                frames=frames,
                pads=pads,
                smooth=not nosmooth,
                box=box if box != (-1, -1, -1, -1) else None
            )
            
            # Generate lip-sync video
            logger.info(f"Generating lip-sync video with {model_type}...")
            output_frames = self._generate_lip_sync_frames(
                face_results=face_results,
                mel_chunks=mel_chunks,
                original_frames=frames,
                model_type=model_type,
                static=static
            )
            
            # Save video
            temp_video_path = self.result_dir / 'temp_result.mp4'
            self.video_processing_service.save_video_frames(
                frames=output_frames,
                output_path=str(temp_video_path),
                fps=fps
            )
            
            # Merge with audio
            if output_path is None:
                output_path = self.result_dir / 'result_with_audio.mp4'
            
            final_output = self.video_processing_service.merge_video_audio(
                video_path=str(temp_video_path),
                audio_path=audio_path,
                output_path=str(output_path)
            )
            
            # Cleanup temp file
            temp_video_path.unlink(missing_ok=True)
            
            # Calculate metrics
            processing_time = time.time() - start_time
            inference_fps = len(output_frames) / processing_time if processing_time > 0 else 0
            
            result = {
                'output_path': final_output,
                'processing_time': processing_time,
                'inference_fps': inference_fps,
                'frames_processed': len(output_frames),
                'fps': fps,
                'model_type': model_type
            }
            
            logger.info(f"Pipeline completed successfully: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Pipeline processing failed: {e}")
            raise e
        finally:
            # Cleanup
            self.cleanup()
    
    def _generate_lip_sync_frames(self,
                                 face_results: List[Tuple[np.ndarray, Tuple[int, int, int, int]]],
                                 mel_chunks: List[np.ndarray],
                                 original_frames: List[np.ndarray],
                                 model_type: str,
                                 static: bool = False) -> List[np.ndarray]:
        """
        Generate lip-sync frames sử dụng Wave2Lip model
        
        Args:
            face_results: List of (face, coordinates) from face detection
            mel_chunks: List of mel spectrograms
            original_frames: List of original frames
            model_type: Model type để sử dụng
            static: Static mode
            
        Returns:
            List of output frames
        """
        # Get Wave2Lip servicer
        servicer = self._get_wave2lip_servicer()
        
        # Prepare data generator
        output_frames = []
        img_batch, mel_batch, frame_batch, coords_batch = [], [], [], []
        
        for i, mel in enumerate(mel_chunks):
            # Get frame index
            idx = 0 if static else i % len(face_results)
            face, coords = face_results[idx]
            original_frame = original_frames[idx].copy()
            
            # Resize face to model input size
            face_resized = cv2.resize(face, (hp.face.img_size, hp.face.img_size))
            
            img_batch.append(face_resized)
            mel_batch.append(mel)
            frame_batch.append(original_frame)
            coords_batch.append(coords)
            
            # Process batch when full
            if len(img_batch) >= self.wav2lip_batch_size:
                batch_frames = self._process_batch(
                    img_batch, mel_batch, frame_batch, coords_batch, servicer, model_type
                )
                output_frames.extend(batch_frames)
                img_batch, mel_batch, frame_batch, coords_batch = [], [], [], []
        
        # Process remaining batch
        if len(img_batch) > 0:
            batch_frames = self._process_batch(
                img_batch, mel_batch, frame_batch, coords_batch, servicer, model_type
            )
            output_frames.extend(batch_frames)
        
        return output_frames
    
    def _process_batch(self,
                      img_batch: List[np.ndarray],
                      mel_batch: List[np.ndarray],
                      frame_batch: List[np.ndarray],
                      coords_batch: List[Tuple[int, int, int, int]],
                      servicer,
                      model_type: str) -> List[np.ndarray]:
        """
        Process một batch của images và mels
        
        Args:
            img_batch: Batch of face images
            mel_batch: Batch of mel spectrograms
            frame_batch: Batch of original frames
            coords_batch: Batch of coordinates
            servicer: Wave2Lip servicer
            model_type: Model type
            
        Returns:
            List of processed frames
        """
        # Convert to numpy arrays
        img_batch = np.asarray(img_batch)
        mel_batch = np.asarray(mel_batch)
        
        # Prepare input for model
        img_masked = img_batch.copy()
        img_masked[:, hp.face.img_size//2:] = 0
        
        img_batch = np.concatenate((img_masked, img_batch), axis=3) / 255.
        mel_batch = np.reshape(mel_batch, [len(mel_batch), mel_batch.shape[1], mel_batch.shape[2], 1])
        
        # Convert to torch tensors
        img_tensor = torch.FloatTensor(np.transpose(img_batch, (0, 3, 1, 2))).to(self.device)
        mel_tensor = torch.FloatTensor(np.transpose(mel_batch, (0, 3, 1, 2))).to(self.device)
        
        # Get model
        model = servicer.model_zoo[model_type]
        
        # Inference
        with torch.no_grad():
            pred = model(mel_tensor, img_tensor)
        
        # Convert back to numpy
        pred = pred.cpu().numpy().transpose(0, 2, 3, 1) * 255.
        
        # Reconstruct frames
        output_frames = []
        for p, frame, coords in zip(pred, frame_batch, coords_batch):
            x1, y1, x2, y2 = coords
            p_resized = cv2.resize(p.astype(np.uint8), (x2 - x1, y2 - y1))
            
            # Use original frame and paste the generated face
            output_frame = frame.copy()
            if (output_frame.shape[0] > y2 and output_frame.shape[1] > x2 and 
                y1 >= 0 and x1 >= 0):
                output_frame[y1:y2, x1:x2] = p_resized
            
            output_frames.append(output_frame)
        
        return output_frames
    
    def cleanup(self):
        """Cleanup services để giải phóng memory"""
        logger.info("Cleaning up pipeline services...")
        
        # Cleanup face detection
        self.face_detection_service.cleanup()
        
        # Cleanup Wave2Lip servicer
        if self.wave2lip_servicer is not None:
            # Clear model zoo
            for model in self.wave2lip_servicer.model_zoo.values():
                del model
            self.wave2lip_servicer = None
        
        # Clear CUDA cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        logger.info("Pipeline cleanup completed") 