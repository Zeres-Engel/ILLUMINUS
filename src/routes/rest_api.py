"""
ILLUMINUS Wav2Lip - REST API Routes
Traditional REST endpoints for file upload and processing

Author: Andrew (ngpthanh15@gmail.com)
Version: 1.0.0
"""

import os
import sys
import time
import uuid
from pathlib import Path
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from typing import Optional, Dict, Any
import shutil
import hashlib
from loguru import logger

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ..services.wav2lip_pipeline_service import Wav2LipPipelineService
from ..services.face_detection_service import FaceDetectionService

router = APIRouter()

# Global services (will be initialized lazily)
pipeline_service = None
face_detection_service = None

def get_services(device='auto'):
    """Get or initialize services with specific device"""
    global pipeline_service, face_detection_service
    
    if pipeline_service is None or face_detection_service is None:
        # Determine device
        if device == 'auto':
            import torch
            actual_device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            actual_device = device
            
        logger.info(f'Initializing REST API services with device: {actual_device}')
        
        # Initialize face detection service first
        face_detection_service = FaceDetectionService(
            device=actual_device,
            batch_size=16
        )
        
        # Initialize pipeline service with external face detection
        pipeline_service = Wav2LipPipelineService(
            device=actual_device,
            face_det_batch_size=16,
            wav2lip_batch_size=128,
            result_dir="temp/rest_api",
            external_face_service=face_detection_service
        )
        
        # Create temp directory
        Path("temp/rest_api").mkdir(parents=True, exist_ok=True)
        
        logger.info("REST API services initialized successfully")
    
    return pipeline_service, face_detection_service

@router.post("/api/generate")
async def generate_video(
    video: UploadFile = File(...),
    audio: UploadFile = File(...),
    model: str = Form('compressed'),
    device: str = Form('auto'),
    # Face detection options
    face_det_batch_size: int = Form(16),
    pads_top: int = Form(0),
    pads_bottom: int = Form(10),
    pads_left: int = Form(0),
    pads_right: int = Form(0),
    # Video processing options
    resize_factor: int = Form(1),
    static: bool = Form(False),
    nosmooth: bool = Form(False)
):
    """
    REST API endpoint for video generation
    Same functionality as the main /generate endpoint but organized in routes
    """
    start_time = time.time()
    
    # Generate unique IDs for files
    timestamp = str(int(time.time()))
    job_id = hashlib.md5(f"{timestamp}_{video.filename}_{audio.filename}".encode()).hexdigest()[:8]
    
    # Use original file extensions
    video_ext = video.filename.split('.')[-1] if '.' in video.filename else 'mp4'
    audio_ext = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
    
    upload_folder = Path("temp/rest_api/uploads")
    results_folder = Path("temp/rest_api/results")
    
    upload_folder.mkdir(parents=True, exist_ok=True)
    results_folder.mkdir(parents=True, exist_ok=True)
    
    video_path = upload_folder / f"{job_id}.{video_ext}"
    audio_path = upload_folder / f"{job_id}.{audio_ext}"
    output_path = results_folder / f"{job_id}_result.mp4"
    
    try:
        # Validate uploads
        if not video.filename or not audio.filename:
            raise HTTPException(status_code=400, detail="Both video and audio files are required")
        
        # Save uploaded files
        logger.info(f"Processing REST API job {job_id}: video={video.filename}, audio={audio.filename}")
        
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        # Validate file sizes
        video_size = video_path.stat().st_size
        audio_size = audio_path.stat().st_size
        
        if video_size == 0 or audio_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded files are empty")
        
        logger.info(f"Files saved: video={video_size} bytes, audio={audio_size} bytes")
        
        # Get services with specified device
        service, _ = get_services(device)
        
        # Set model type
        model_type = 'wav2lip' if model == 'original' else 'nota_wav2lip'
        
        # Process with pipeline
        logger.info(f"Starting REST API pipeline processing with model: {model_type}")
        
        result = service.process_video_audio(
            video_path=str(video_path),
            audio_path=str(audio_path),
            model_type=model_type,
            # Face detection options
            pads=(pads_top, pads_bottom, pads_left, pads_right),
            nosmooth=nosmooth,
            # Video processing options
            resize_factor=resize_factor,
            static=static,
            output_path=str(output_path)
        )
        
        # Calculate total processing time
        total_processing_time = time.time() - start_time
        
        # Prepare response
        response_data = {
            "status": "success",
            "video_url": f"/api/results/{output_path.name}",
            "total_processing_time": total_processing_time,
            "pipeline_processing_time": result['processing_time'],
            "inference_fps": result['inference_fps'],
            "frames_processed": result['frames_processed'],
            "video_fps": result['fps'],
            "model_type": model_type,
            "device_used": device,
            "job_id": job_id
        }
        
        logger.info(f"REST API job {job_id} completed successfully: {response_data}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error processing REST API job {job_id}: {str(e)}")
        
        # Cleanup in case of error
        for path in [video_path, audio_path, output_path]:
            path.unlink(missing_ok=True)
        
        # Return detailed error for debugging
        error_detail = {
            "error": str(e),
            "job_id": job_id,
            "processing_time": time.time() - start_time
        }
        
        raise HTTPException(status_code=500, detail=error_detail)
    
    finally:
        # Cleanup uploaded files (keep result)
        video_path.unlink(missing_ok=True)
        audio_path.unlink(missing_ok=True)

@router.get("/api/results/{filename}")
async def get_result_file(filename: str):
    """Serve result files"""
    file_path = Path("temp/rest_api/results") / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        media_type='video/mp4',
        filename=filename
    )

@router.get("/api/health")
async def api_health():
    """Health check for REST API"""
    import torch
    
    return {
        "status": "healthy",
        "api_type": "REST",
        "pipeline_initialized": pipeline_service is not None,
        "face_detection_initialized": face_detection_service is not None,
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "timestamp": time.time()
    }

@router.get("/api/status/{job_id}")
async def get_job_status(job_id: str):
    """Get job status for REST API"""
    result_path = Path("temp/rest_api/results") / f"{job_id}_result.mp4"
    
    if result_path.exists():
        return {
            "job_id": job_id,
            "status": "completed",
            "video_url": f"/api/results/{result_path.name}"
        }
    else:
        return {
            "job_id": job_id,
            "status": "not_found"
        }

@router.delete("/api/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """Cleanup job files for REST API"""
    result_path = Path("temp/rest_api/results") / f"{job_id}_result.mp4"
    
    if result_path.exists():
        result_path.unlink()
        return {"status": "cleaned", "job_id": job_id}
    else:
        return {"status": "not_found", "job_id": job_id} 