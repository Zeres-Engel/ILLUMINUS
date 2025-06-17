"""
ILLUMINUS Wav2Lip - WebSocket API Routes
Assignment-compliant WebSocket endpoints for real-time lip-syncing

Author: Andrew (ngpthanh15@gmail.com)
Version: 2.0.0 - Assignment Focused
"""

import asyncio
import base64
import json
import uuid
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from .websocket_core import websocket_manager

router = APIRouter()


@router.websocket("/ws/lip-sync")
async def websocket_lip_sync(websocket: WebSocket):
    """
    Assignment-compliant WebSocket endpoint for real-time lip-syncing
    
    Required input format:
    {
        "type": "process",
        "audio_base64": "base64-encoded-audio-data",
        "image_base64": "base64-encoded-person-image",
        "options": {
            "model_type": "nota_wav2lip" | "wav2lip",
            "audio_format": "wav" | "mp3" | "m4a",
            "image_format": "jpg" | "png",
            "pads": [top, bottom, left, right],
            "resize_factor": 1,
            "nosmooth": false
        }
    }
    
    Output: base64-encoded video of face talking, lip-synced with input audio
    """
    client_id = str(uuid.uuid4())
    
    try:
        # Initialize services if needed
        await websocket_manager.initialize_services()
        
        # Accept and register connection
        await websocket_manager.connect(websocket, client_id)
        
        # Main message handling loop
        while True:
            try:
                # Receive and parse message
                data = await websocket.receive_text()
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "process":
                    # Assignment requirement: process lip-sync request
                    await handle_process_request(client_id, message)
                    
                elif message_type == "ping":
                    # Health check ping-pong
                    await websocket_manager.send_message(client_id, {
                        "type": "pong",
                        "timestamp": time.time()
                    })
                    
                elif message_type == "cancel":
                    # Cancel current processing
                    await handle_cancel_request(client_id)
                    
                else:
                    await websocket_manager.send_error(client_id, 
                        f"Unknown message type: {message_type}",
                        "validation_error")
                    
            except json.JSONDecodeError as e:
                await websocket_manager.send_error(client_id,
                    f"Invalid JSON format: {str(e)}",
                    "json_error")
                    
            except WebSocketDisconnect:
                logger.info(f"Client {client_id} disconnected normally")
                break
                
            except Exception as e:
                error_msg = str(e).lower()
                if "disconnect" in error_msg or "closed" in error_msg:
                    logger.info(f"Client {client_id} disconnected")
                    break
                else:
                    logger.error(f"WebSocket message handling error: {e}")
                    await websocket_manager.send_error(client_id,
                        f"Message processing error: {str(e)}",
                        "internal_error")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket client {client_id} disconnected during setup")
        
    except Exception as e:
        logger.error(f"WebSocket connection error for {client_id}: {e}")
        
    finally:
        await websocket_manager.disconnect(client_id)


async def handle_process_request(client_id: str, message: dict):
    """
    Handle assignment-compliant processing request
    Input: base64 audio and image
    Output: base64 video
    """
    # Check if already processing
    if client_id in websocket_manager.processing_tasks:
        await websocket_manager.send_error(client_id,
            "Another processing task is already running. Please wait.",
            "task_running")
        return
    
    # Validate required fields (assignment requirements)
    audio_base64 = message.get("audio_base64")
    image_base64 = message.get("image_base64")
    
    if not audio_base64 or not image_base64:
        await websocket_manager.send_error(client_id,
            "Missing required fields: audio_base64, image_base64",
            "validation_error")
        return
    
    try:
        # Decode base64 data (assignment requirement)
        audio_data = base64.b64decode(audio_base64)
        image_data = base64.b64decode(image_base64)
        
        # Validate data sizes
        if len(audio_data) == 0 or len(image_data) == 0:
            await websocket_manager.send_error(client_id,
                "Empty audio or image data",
                "validation_error")
            return
            
        # File size limits for assignment
        if len(audio_data) > 50 * 1024 * 1024:  # 50MB
            await websocket_manager.send_error(client_id,
                "Audio file too large (max 50MB)",
                "validation_error")
            return
            
        if len(image_data) > 10 * 1024 * 1024:  # 10MB
            await websocket_manager.send_error(client_id,
                "Image file too large (max 10MB)",
                "validation_error")
            return
        
    except Exception as e:
        await websocket_manager.send_error(client_id,
            f"Invalid base64 encoding: {str(e)}",
            "validation_error")
        return
    
    # Get processing options
    options = message.get("options", {})
    
    # Start assignment-compliant processing task
    task = asyncio.create_task(
        websocket_manager.process_lip_sync_assignment(
            client_id, audio_data, image_data, options
        )
    )
    websocket_manager.processing_tasks[client_id] = task


async def handle_cancel_request(client_id: str):
    """Handle processing cancellation request"""
    if client_id in websocket_manager.processing_tasks:
        task = websocket_manager.processing_tasks[client_id]
        task.cancel()
        del websocket_manager.processing_tasks[client_id]
        
        await websocket_manager.send_message(client_id, {
            "type": "cancelled",
            "message": "Processing cancelled successfully"
        })
    else:
        await websocket_manager.send_message(client_id, {
            "type": "info",
            "message": "No active processing to cancel"
        })


@router.get("/ws/health")
async def websocket_health():
    """WebSocket service health check"""
    stats = websocket_manager.get_connection_stats()
    
    return {
        "status": "healthy",
        "service": "websocket_api",
        "websocket_endpoint": "/ws/lip-sync",
        "connections": stats["active_connections"],
        "processing": stats["processing_tasks"],
        "timestamp": time.time()
    }


 