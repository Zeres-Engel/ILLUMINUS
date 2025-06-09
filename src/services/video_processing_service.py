"""
Video Processing Service
Xử lý video input/output và preprocessing
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional
from pathlib import Path
import subprocess
import platform
from loguru import logger


class VideoProcessingService:
    """Service xử lý video processing"""
    
    def __init__(self):
        """Initialize Video Processing Service"""
        logger.info("VideoProcessingService initialized")
    
    def load_video_frames(self, 
                         video_path: str,
                         resize_factor: int = 1,
                         crop: Tuple[int, int, int, int] = (0, -1, 0, -1),
                         rotate: bool = False) -> Tuple[List[np.ndarray], float]:
        """
        Load video frames từ video file
        
        Args:
            video_path: Path đến video file
            resize_factor: Factor để resize video
            crop: Crop coordinates (top, bottom, left, right)
            rotate: Có rotate video 90 độ không
            
        Returns:
            Tuple of (frames_list, fps)
        """
        if not Path(video_path).exists():
            raise ValueError(f'Video file not found: {video_path}')
        
        # Check if it's an image
        if Path(video_path).suffix.lower() in ['.jpg', '.png', '.jpeg']:
            frame = cv2.imread(video_path)
            if frame is None:
                raise ValueError(f'Cannot load image: {video_path}')
            return [frame], 25.0  # Default FPS for static image
        
        # Load video
        video_stream = cv2.VideoCapture(video_path)
        fps = video_stream.get(cv2.CAP_PROP_FPS)
        
        if fps <= 0:
            fps = 25.0  # Default FPS
            logger.warning(f"Invalid FPS detected, using default: {fps}")
        
        logger.info(f'Reading video frames from: {video_path} (FPS: {fps})')
        
        frames = []
        while True:
            still_reading, frame = video_stream.read()
            if not still_reading:
                break
            
            # Apply resize
            if resize_factor > 1:
                new_width = frame.shape[1] // resize_factor
                new_height = frame.shape[0] // resize_factor
                frame = cv2.resize(frame, (new_width, new_height))
            
            # Apply rotation
            if rotate:
                frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
            
            # Apply crop
            y1, y2, x1, x2 = crop
            if x2 == -1:
                x2 = frame.shape[1]
            if y2 == -1:
                y2 = frame.shape[0]
            
            frame = frame[y1:y2, x1:x2]
            frames.append(frame)
        
        video_stream.release()
        logger.info(f"Loaded {len(frames)} frames from video")
        
        if len(frames) == 0:
            raise ValueError(f'No frames could be loaded from video: {video_path}')
        
        return frames, fps
    
    def save_video_frames(self, 
                         frames: List[np.ndarray],
                         output_path: str,
                         fps: float = 25.0,
                         fourcc: str = 'mp4v') -> str:
        """
        Save frames thành video file
        
        Args:
            frames: List các frames để save
            output_path: Path để save video
            fps: Frame rate
            fourcc: Video codec
            
        Returns:
            Path của video đã save
        """
        if not frames:
            raise ValueError("No frames to save")
        
        # Ensure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Get frame dimensions
        frame_h, frame_w = frames[0].shape[:2]
        
        # Create video writer
        fourcc_code = cv2.VideoWriter_fourcc(*fourcc)
        out = cv2.VideoWriter(output_path, fourcc_code, fps, (frame_w, frame_h))
        
        if not out.isOpened():
            raise RuntimeError(f"Could not open video writer for: {output_path}")
        
        # Write frames
        for frame in frames:
            out.write(frame)
        
        out.release()
        logger.info(f"Video saved to: {output_path} ({len(frames)} frames, {fps} FPS)")
        
        return output_path
    
    def merge_video_audio(self, 
                         video_path: str,
                         audio_path: str,
                         output_path: str,
                         video_quality: int = 1) -> str:
        """
        Merge video với audio using FFmpeg
        
        Args:
            video_path: Path đến video file (no audio)
            audio_path: Path đến audio file
            output_path: Path để save final video
            video_quality: Video quality (1 = highest)
            
        Returns:
            Path của final video
        """
        # Ensure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Build FFmpeg command
        command = [
            'ffmpeg', '-y',  # Overwrite output
            '-i', audio_path,  # Audio input
            '-i', video_path,  # Video input
            '-strict', '-2',   # Allow experimental codecs
            '-q:v', str(video_quality),  # Video quality
            output_path
        ]
        
        try:
            # Run FFmpeg command
            if platform.system() == 'Windows':
                subprocess.run(command, check=True, capture_output=True)
            else:
                subprocess.run(' '.join(command), shell=True, check=True, capture_output=True)
            
            logger.info(f"Successfully merged video and audio: {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg merge failed: {e}")
            raise RuntimeError(f"Failed to merge video and audio: {e}")
        except FileNotFoundError:
            logger.error("FFmpeg not found. Please install FFmpeg.")
            raise RuntimeError("FFmpeg not found. Please install FFmpeg and add it to PATH.")
    
    def extract_audio(self, video_path: str, output_audio_path: str) -> str:
        """
        Extract audio từ video file
        
        Args:
            video_path: Path đến video file
            output_audio_path: Path để save audio
            
        Returns:
            Path của audio file
        """
        # Ensure output directory exists
        Path(output_audio_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Build FFmpeg command
        command = [
            'ffmpeg', '-y',  # Overwrite output
            '-i', video_path,  # Input video
            '-vn',  # No video
            '-acodec', 'pcm_s16le',  # Audio codec
            '-ar', '16000',  # Sample rate
            '-ac', '1',  # Mono channel
            output_audio_path
        ]
        
        try:
            # Run FFmpeg command
            if platform.system() == 'Windows':
                subprocess.run(command, check=True, capture_output=True)
            else:
                subprocess.run(' '.join(command), shell=True, check=True, capture_output=True)
            
            logger.info(f"Audio extracted to: {output_audio_path}")
            return output_audio_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Audio extraction failed: {e}")
            raise RuntimeError(f"Failed to extract audio: {e}")
        except FileNotFoundError:
            logger.error("FFmpeg not found. Please install FFmpeg.")
            raise RuntimeError("FFmpeg not found. Please install FFmpeg and add it to PATH.")
    
    def resize_frame(self, frame: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """
        Resize frame đến target size
        
        Args:
            frame: Input frame
            target_size: (width, height)
            
        Returns:
            Resized frame
        """
        return cv2.resize(frame, target_size)
    
    def get_video_info(self, video_path: str) -> dict:
        """
        Get thông tin video file
        
        Args:
            video_path: Path đến video file
            
        Returns:
            Dictionary chứa video info
        """
        if not Path(video_path).exists():
            raise ValueError(f'Video file not found: {video_path}')
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f'Cannot open video file: {video_path}')
        
        info = {
            'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'fps': cap.get(cv2.CAP_PROP_FPS),
            'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'duration': cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS) if cap.get(cv2.CAP_PROP_FPS) > 0 else 0
        }
        
        cap.release()
        
        logger.info(f"Video info: {info}")
        return info 