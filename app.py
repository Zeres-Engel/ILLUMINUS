import os
import sys
import time
import uuid
from pathlib import Path
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import shutil
import subprocess
from loguru import logger

from config import hparams as hp
from config import hparams_gradio as hp_gradio

# Add src to path để có thể import modules
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.services.wave2lip_pipeline_service import Wave2LipPipelineService

# Initialize FastAPI app
app = FastAPI(title="ILLUMINUS Wave2Lip with Face Detection")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Create necessary directories
UPLOAD_FOLDER = Path("static/uploads")
RESULTS_FOLDER = Path("static/results")
TEMP_FOLDER = Path("temp")

for folder in [UPLOAD_FOLDER, RESULTS_FOLDER, TEMP_FOLDER]:
    folder.mkdir(parents=True, exist_ok=True)

# Initialize pipeline service (lazy load)
pipeline_service = None

def get_pipeline_service():
    """Get or initialize pipeline service"""
    global pipeline_service
    if pipeline_service is None:
        device = hp_gradio.device
        logger.info(f'Initializing pipeline service with device: {device}')
        
        pipeline_service = Wave2LipPipelineService(
            device=device,
            face_det_batch_size=16,  # Có thể config từ file
            wav2lip_batch_size=128,
            result_dir=str(TEMP_FOLDER)
        )
        
        logger.info("Pipeline service initialized successfully")
    
    return pipeline_service

# Configure logging
logger.add("logs/app.log", rotation="1 day", retention="7 days")

# Routes
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/generate")
async def generate_video(
    video: UploadFile = File(...),
    audio: UploadFile = File(...),
    model: str = Form(...),
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
    Generate lip-sync video with face detection pipeline
    """
    start_time = time.time()
    
    # Generate unique IDs for files
    job_id = str(uuid.uuid4())
    video_path = UPLOAD_FOLDER / f"{job_id}_video.mp4"
    audio_path = UPLOAD_FOLDER / f"{job_id}_audio.wav"
    output_path = RESULTS_FOLDER / f"{job_id}_result.mp4"
    
    try:
        # Validate uploads
        if not video.filename or not audio.filename:
            raise HTTPException(status_code=400, detail="Both video and audio files are required")
        
        # Save uploaded files
        logger.info(f"Processing job {job_id}: video={video.filename}, audio={audio.filename}")
        
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
        
        # Get pipeline service
        service = get_pipeline_service()
        
        # Set model type
        model_type = 'wav2lip' if model == 'original' else 'nota_wav2lip'
        
        # Process with pipeline
        logger.info(f"Starting pipeline processing with model: {model_type}")
        
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
            "video_url": f"/static/results/{output_path.name}",
            "total_processing_time": total_processing_time,
            "pipeline_processing_time": result['processing_time'],
            "inference_fps": result['inference_fps'],
            "frames_processed": result['frames_processed'],
            "video_fps": result['fps'],
            "model_type": model_type,
            "job_id": job_id
        }
        
        logger.info(f"Job {job_id} completed successfully: {response_data}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "pipeline_initialized": pipeline_service is not None,
        "timestamp": time.time()
    }

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get job status (placeholder for future implementation)"""
    # This could be extended to track job progress
    result_path = RESULTS_FOLDER / f"{job_id}_result.mp4"
    
    if result_path.exists():
        return {
            "job_id": job_id,
            "status": "completed",
            "video_url": f"/static/results/{result_path.name}"
        }
    else:
        return {
            "job_id": job_id,
            "status": "not_found"
        }

@app.delete("/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """Cleanup job files"""
    result_path = RESULTS_FOLDER / f"{job_id}_result.mp4"
    
    if result_path.exists():
        result_path.unlink()
        return {"status": "cleaned", "job_id": job_id}
    else:
        return {"status": "not_found", "job_id": job_id}

@app.on_event("startup")
async def startup_event():
    """Startup event - cleanup old files"""
    logger.info("Starting ILLUMINUS Wave2Lip application...")
    
    # Clean up old files
    current_time = time.time()
    cleanup_age = 24 * 60 * 60  # 24 hours
    
    for folder in [UPLOAD_FOLDER, RESULTS_FOLDER, TEMP_FOLDER]:
        if folder.exists():
            for file_path in folder.glob("*"):
                try:
                    if file_path.is_file():
                        # Delete files older than cleanup_age
                        if current_time - file_path.stat().st_mtime > cleanup_age:
                            file_path.unlink()
                            logger.info(f"Cleaned up old file: {file_path}")
                except Exception as e:
                    logger.warning(f"Error cleaning up {file_path}: {e}")
    
    logger.info("Application startup completed")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event - cleanup resources"""
    logger.info("Shutting down ILLUMINUS Wave2Lip application...")
    
    # Cleanup pipeline service
    global pipeline_service
    if pipeline_service:
        pipeline_service.cleanup()
        pipeline_service = None
    
    logger.info("Application shutdown completed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
