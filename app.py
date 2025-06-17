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
from src.routes import websocket_router, utility_router, auto_ensure_checkpoints, get_checkpoint_status_summary

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
templates = Jinja2Templates(directory="frontend/templates")

# Create necessary directories
TEMP_FOLDER = Path("temp")
TEMP_FOLDER.mkdir(parents=True, exist_ok=True)

# Initialize services (lazy load)
pipeline_service = None
face_detection_service = None

def get_services(device='auto'):
    """Get or initialize services with specific device"""
    global pipeline_service, face_detection_service
    
    if pipeline_service is None or face_detection_service is None:
        # Auto-ensure checkpoints are available before initializing services
        logger.info("🔍 Auto-ensuring checkpoints availability...")
        checkpoint_ready = auto_ensure_checkpoints()
        
        if not checkpoint_ready:
            logger.warning("⚠️ Some checkpoints may be missing, continuing with available models...")
        
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
        
        logger.info("✅ Services initialized successfully")
    
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

# Main health check endpoint
@app.get("/health")
async def health_check():
    """WebSocket-focused health check with auto-checkpoint status"""
    import torch
    
    # Get checkpoint status
    checkpoints_ready, checkpoint_summary = get_checkpoint_status_summary()
    
    return {
        "status": "healthy",
        "service": "illuminus_websocket_api",
        "websocket_endpoint": "/ws/lip-sync",
        "system": {
            "gpu_available": torch.cuda.is_available(),
            "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "services_ready": pipeline_service is not None
        },
        "checkpoints": {
            "auto_management": "✅ Enabled",
            "status": checkpoint_summary
        },
        "timestamp": time.time()
    }


@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("🚀 Starting ILLUMINUS Wav2Lip - WebSocket-First Architecture")
    logger.info("✅ Application startup completed")

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
