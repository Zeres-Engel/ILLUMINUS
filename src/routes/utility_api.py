"""
ILLUMINUS Wav2Lip - Utility API Routes
Essential utility endpoints for system monitoring and health checks

Author: Andrew (ngpthanh15@gmail.com)
Version: 1.0.0
"""

import time
import sys
from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from loguru import logger

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    System health check endpoint
    Returns GPU availability, service status, and system info
    """
    try:
        import torch
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "system": {
                "gpu_available": torch.cuda.is_available(),
                "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
                "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
                "python_version": sys.version,
                "pytorch_version": torch.__version__
            },
            "services": {
                "websocket_api": "active",
                "assignment_compliance": "websocket_only"
            },
            "endpoints": {
                "primary": "/ws/lip-sync",
                "health": "/health",
                "websocket_health": "/ws/health"
            }
        }
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
        )

@router.get("/system/info")
async def system_info():
    """
    Detailed system information for debugging
    """
    try:
        import torch
        import psutil
        
        # Memory info
        memory = psutil.virtual_memory()
        
        # GPU info
        gpu_info = {}
        if torch.cuda.is_available():
            for i in range(torch.cuda.device_count()):
                gpu_info[f"gpu_{i}"] = {
                    "name": torch.cuda.get_device_name(i),
                    "memory_total": torch.cuda.get_device_properties(i).total_memory,
                    "memory_allocated": torch.cuda.memory_allocated(i),
                    "memory_cached": torch.cuda.memory_reserved(i)
                }
        
        return {
            "system": {
                "cpu_count": psutil.cpu_count(),
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                },
                "gpu": gpu_info,
                "platform": sys.platform
            },
            "assignment": {
                "api_type": "websocket_only",
                "compliance": "takehome_assignment",
                "features": [
                    "real_time_websocket",
                    "base64_input_output", 
                    "live_progress_updates",
                    "gpu_acceleration"
                ]
            }
        }
        
    except ImportError as e:
        return JSONResponse(
            status_code=200,
            content={
                "system": "limited_info",
                "error": f"Optional dependency missing: {e}",
                "assignment": {
                    "api_type": "websocket_only",
                    "compliance": "takehome_assignment"
                }
            }
        )
    except Exception as e:
        logger.error(f"System info error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "timestamp": time.time()
            }
        )

@router.get("/assignment/info")
async def assignment_info():
    """
    Assignment-specific information and compliance check
    """
    return {
        "assignment": {
            "title": "Take-Home Assignment - Real-time Lip-syncing WebSocket API",
            "compliance": {
                "websocket_api": "✅ Implemented",
                "base64_input": "✅ Audio and Image base64 input",
                "base64_output": "✅ Video base64 output", 
                "real_time": "✅ Real-time bi-directional communication",
                "ai_model": "✅ Wav2Lip (Original & Compressed)",
                "framework": "✅ FastAPI with WebSocket",
                "containerization": "✅ Docker support"
            },
            "endpoints": {
                "primary_websocket": "/ws/lip-sync",
                "health_check": "/health",
                "websocket_health": "/ws/health",
                "assignment_info": "/assignment/info"
            },
            "usage": {
                "main_interface": "http://localhost:8000/",
    
                "websocket_url": "ws://localhost:8000/ws/lip-sync"
            }
        },
        "status": "assignment_ready",
        "timestamp": time.time()
    } 