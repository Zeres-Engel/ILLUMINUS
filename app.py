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

# Add src to path để có thể import modules
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.config import hparams as hp

from src.services.wav2lip_pipeline_service import Wav2LipPipelineService
from src.routes import websocket_router, utility_router

# Initialize FastAPI app - Assignment Focused
app = FastAPI(
    title="ILLUMINUS Wav2Lip - WebSocket Assignment", 
    description="Real-time Lip-syncing WebSocket API for Take-Home Assignment",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - Assignment compliant (WebSocket focused)
app.include_router(websocket_router, tags=["WebSocket API"])
app.include_router(utility_router, tags=["Utilities"])

# Configure static files and templates  
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")
# 🔥 NEW: Mount session directories for optimized file access
app.mount("/session", StaticFiles(directory="static/session"), name="session")
templates = Jinja2Templates(directory="frontend/templates")

# Create necessary directories
UPLOAD_FOLDER = Path("static/uploads")
RESULTS_FOLDER = Path("static/results")
TEMP_FOLDER = Path("temp")

# Add session-based directories for better file management
SESSION_UPLOAD_FOLDER = Path("static/session/uploads")
SESSION_RESULTS_FOLDER = Path("static/session/results")

for folder in [UPLOAD_FOLDER, RESULTS_FOLDER, TEMP_FOLDER, SESSION_UPLOAD_FOLDER, SESSION_RESULTS_FOLDER]:
    folder.mkdir(parents=True, exist_ok=True)

# Initialize services (lazy load)
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
            
        logger.info(f'Initializing services with device: {actual_device}')
        
        # Initialize face detection service first
        from src.services.face_detection_service import FaceDetectionService
        face_detection_service = FaceDetectionService(
            device=actual_device,
            batch_size=16
        )
        
        # Initialize pipeline service with external face detection
        pipeline_service = Wav2LipPipelineService(
            device=actual_device,
            face_det_batch_size=16,
            wav2lip_batch_size=128,
            result_dir=str(TEMP_FOLDER),
            external_face_service=face_detection_service
        )
        
        logger.info("Services initialized successfully")
    
    return pipeline_service, face_detection_service

# Configure logging
logger.add("logs/app.log", rotation="1 day", retention="7 days")

# Routes
@app.get("/favicon.ico")
async def favicon():
    """Serve favicon.ico"""
    return FileResponse("static/favicon.svg", media_type="image/svg+xml")

@app.get("/favicon.svg")
async def favicon_svg():
    """Serve favicon.svg"""
    return FileResponse("static/favicon.svg", media_type="image/svg+xml")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/websocket-test", response_class=HTMLResponse)
async def websocket_test(request: Request):
    """WebSocket test client page"""
    return templates.TemplateResponse("websocket_test.html", {"request": request})

@app.post("/generate")
async def generate_video(
    video: UploadFile = File(...),
    audio: UploadFile = File(...),
    model: str = Form(...),
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
    [OPTIMIZED API] Generate lip-sync video with fixed file naming
    
    ⚠️  WARNING: This REST API is deprecated for assignment requirements.
    ⚡ Please use WebSocket API at /ws/lip-sync for real-time processing.
    
    🔥 OPTIMIZED: Uses fixed file names (input.mp4, input.wav) to prevent memory bloat
    """
    logger.warning("⚠️  REST API /generate called - Assignment requires WebSocket API only!")
    
    start_time = time.time()
    
    # 🔥 OPTIMIZATION: Use fixed file names instead of random job IDs
    # This prevents memory bloat from accumulating files
    video_ext = video.filename.split('.')[-1] if '.' in video.filename else 'mp4'
    audio_ext = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
    
    # Fixed file names to prevent accumulation
    video_path = SESSION_UPLOAD_FOLDER / f"input.{video_ext}"
    audio_path = SESSION_UPLOAD_FOLDER / f"input.{audio_ext}"
    output_path = SESSION_RESULTS_FOLDER / "result.mp4"
    
    # Generate session ID for tracking (not for file naming)
    import hashlib
    timestamp = str(int(time.time()))
    session_id = hashlib.md5(f"{timestamp}_{video.filename}_{audio.filename}".encode()).hexdigest()[:8]
    
    try:
        # Validate uploads
        if not video.filename or not audio.filename:
            raise HTTPException(status_code=400, detail="Both video and audio files are required")
        
        # 🔥 CLEANUP: Remove existing files before saving new ones
        for cleanup_file in [video_path, audio_path, output_path]:
            cleanup_file.unlink(missing_ok=True)
        
        # Save uploaded files with fixed names
        logger.info(f"Processing session {session_id}: video={video.filename}, audio={audio.filename}")
        logger.info(f"Using fixed paths: video={video_path}, audio={audio_path}")
        
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
        
        # Prepare response with session tracking
        response_data = {
            "status": "success",
            "video_url": f"/static/session/results/{output_path.name}",
            "download_url": f"/download/result",  # Fixed download endpoint
            "total_processing_time": total_processing_time,
            "pipeline_processing_time": result['processing_time'],
            "inference_fps": result['inference_fps'],
            "frames_processed": result['frames_processed'],
            "video_fps": result['fps'],
            "model_type": model_type,
            "device_used": device,
            "session_id": session_id,
            "optimization": {
                "fixed_naming": "✅ input.mp4, input.wav, result.mp4",
                "memory_safe": "✅ Auto cleanup prevents bloat",
                "file_size": f"Input: {video_size + audio_size} bytes, Output: {output_path.stat().st_size if output_path.exists() else 0} bytes"
            }
        }
        
        logger.info(f"Session {session_id} completed successfully: {response_data}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error processing session {session_id}: {str(e)}")
        
        # Cleanup in case of error
        for path in [video_path, audio_path, output_path]:
            path.unlink(missing_ok=True)
        
        # Return detailed error for debugging
        error_detail = {
            "error": str(e),
            "session_id": session_id,
            "processing_time": time.time() - start_time
        }
        
        raise HTTPException(status_code=500, detail=error_detail)
    
    finally:
        # Note: Keep input files for potential re-processing
        # Only cleanup on next request or explicit cleanup call
        logger.info(f"Session {session_id} processing completed, files retained for potential re-use")

# Health check endpoint
@app.get("/health")
async def health_check():
    import torch
    
    return {
        "status": "healthy",
        "pipeline_initialized": pipeline_service is not None,
        "face_detection_initialized": face_detection_service is not None,
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "timestamp": time.time()
    }

@app.get("/status")
async def get_current_status():
    """Get current processing status and available files"""
    
    # Check for input files
    input_files = {}
    for file_type in ["video", "audio"]:
        extensions = {
            "video": ["mp4", "avi", "mov", "mkv"],
            "audio": ["wav", "mp3", "m4a", "aac"]
        }
        
        for ext in extensions[file_type]:
            potential_path = SESSION_UPLOAD_FOLDER / f"input.{ext}"
            if potential_path.exists():
                input_files[file_type] = {
                    "filename": f"input.{ext}",
                    "size": potential_path.stat().st_size,
                    "modified": potential_path.stat().st_mtime,
                    "download_url": f"/download/input/{file_type}"
                }
                break
    
    # Check for result file
    result_path = SESSION_RESULTS_FOLDER / "result.mp4"
    result_info = None
    if result_path.exists():
        result_info = {
            "filename": "result.mp4",
            "size": result_path.stat().st_size,
            "modified": result_path.stat().st_mtime,
            "download_url": "/download/result",
            "view_url": "/static/session/results/result.mp4"
        }
    
    return {
        "status": "ready",
        "optimization": {
            "fixed_naming": "✅ Using input.* and result.mp4",
            "memory_safe": "✅ Files overwritten, no accumulation"
        },
        "input_files": input_files,
        "result_file": result_info,
        "total_input_files": len(input_files),
        "has_result": result_info is not None,
        "timestamp": time.time()
    }

@app.delete("/cleanup")
async def cleanup_all_files():
    """Cleanup all session files"""
    cleaned_files = []
    
    # Cleanup session folders
    for folder in [SESSION_UPLOAD_FOLDER, SESSION_RESULTS_FOLDER]:
        if folder.exists():
            for file_path in folder.glob("*"):
                if file_path.is_file():
                    try:
                        file_path.unlink()
                        cleaned_files.append(str(file_path))
                    except Exception as e:
                        logger.warning(f"Could not clean up {file_path}: {e}")
    
    return {
        "status": "cleaned", 
        "cleaned_files": cleaned_files,
        "count": len(cleaned_files),
        "optimization": "✅ Memory freed, ready for new files"
    }

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get job status (legacy endpoint - now redirects to current status)"""
    logger.warning("⚠️ Legacy /status/{job_id} called - redirecting to /status")
    return await get_current_status()

@app.delete("/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """Cleanup job files (legacy endpoint - now cleans all files)"""
    logger.warning("⚠️ Legacy /cleanup/{job_id} called - cleaning all session files")
    return await cleanup_all_files()

# 🔥 NEW: Fixed download endpoint
@app.get("/download/result")
async def download_result():
    """Download the latest generated result video"""
    result_path = SESSION_RESULTS_FOLDER / "result.mp4"
    
    if result_path.exists():
        return FileResponse(
            str(result_path),
            media_type="video/mp4",
            filename="illuminus_result.mp4",
            headers={"Content-Disposition": "attachment; filename=illuminus_result.mp4"}
        )
    else:
        raise HTTPException(status_code=404, detail="No result video found. Please process a video first.")

@app.get("/download/input/{file_type}")
async def download_input(file_type: str):
    """Download input files (video or audio)"""
    if file_type not in ["video", "audio"]:
        raise HTTPException(status_code=400, detail="file_type must be 'video' or 'audio'")
    
    # Find the input file (check common extensions)
    extensions = {
        "video": ["mp4", "avi", "mov", "mkv"],
        "audio": ["wav", "mp3", "m4a", "aac"]
    }
    
    input_file = None
    for ext in extensions[file_type]:
        potential_path = SESSION_UPLOAD_FOLDER / f"input.{ext}"
        if potential_path.exists():
            input_file = potential_path
            break
    
    if input_file:
        return FileResponse(
            str(input_file),
            filename=f"illuminus_input_{file_type}.{input_file.suffix[1:]}",
            headers={"Content-Disposition": f"attachment; filename=illuminus_input_{file_type}.{input_file.suffix[1:]}"}
        )
    else:
        raise HTTPException(status_code=404, detail=f"No input {file_type} found")

@app.on_event("startup")
async def startup_event():
    """Startup event - cleanup old files"""
    logger.info("Starting ILLUMINUS Wav2Lip application...")
    
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
    logger.info("Shutting down ILLUMINUS Wav2Lip application...")
    
    # Cleanup services
    global pipeline_service, face_detection_service
    if pipeline_service:
        pipeline_service.cleanup()
        pipeline_service = None
    if face_detection_service:
        face_detection_service.cleanup()
        face_detection_service = None
    
    logger.info("Application shutdown completed")

if __name__ == "__main__":
    import uvicorn
    
    # Check if WebSocket dependencies are available
    try:
        import websockets
        import uvloop
        logger.info("WebSocket dependencies detected - using optimized server")
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000,
            loop="uvloop",
            ws="websockets"
        )
    except ImportError:
        logger.warning("WebSocket dependencies not found - using basic server")
        logger.warning("Install with: pip install 'uvicorn[standard]' websockets")
        uvicorn.run(app, host="0.0.0.0", port=8000)
