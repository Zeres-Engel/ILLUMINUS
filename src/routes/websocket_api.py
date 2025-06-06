"""
ILLUMINUS Wav2Lip - Real-time WebSocket API
Real-time lip-syncing with WebSocket for streaming audio and image input

Author: Andrew (ngpthanh15@gmail.com)
Version: 1.0.0
"""

import asyncio
import base64
import json
import uuid
import time
import tempfile
import traceback
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.websockets import WebSocketState
from loguru import logger
import cv2
import numpy as np

from ..services.wav2lip_pipeline_service import Wav2LipPipelineService
from ..services.face_detection_service import FaceDetectionService

router = APIRouter()

class WebSocketManager:
    """Manage WebSocket connections and real-time processing"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.processing_tasks: Dict[str, asyncio.Task] = {}
        self.pipeline_service: Optional[Wav2LipPipelineService] = None
        self.face_detection_service: Optional[FaceDetectionService] = None
        
    async def initialize_services(self, device: str = 'auto'):
        """Initialize AI services if not already done"""
        if self.pipeline_service is None:
            # Determine actual device
            if device == 'auto':
                import torch
                actual_device = 'cuda' if torch.cuda.is_available() else 'cpu'
            else:
                actual_device = device
                
            # Ensure device format is correct
            if actual_device not in ['cpu', 'cuda']:
                logger.warning(f"Invalid device '{actual_device}', defaulting to 'cpu'")
                actual_device = 'cpu'
                
            logger.info(f"Initializing WebSocket services with device: {actual_device}")
            
            # Initialize face detection service
            self.face_detection_service = FaceDetectionService(
                device=actual_device,
                batch_size=8  # Smaller batch for real-time
            )
            
            # Initialize pipeline service
            self.pipeline_service = Wav2LipPipelineService(
                device=actual_device,
                face_det_batch_size=8,
                wav2lip_batch_size=64,  # Optimized for real-time
                result_dir="temp/websocket",
                external_face_service=self.face_detection_service
            )
            
            # Create temp directory
            Path("temp/websocket").mkdir(parents=True, exist_ok=True)
            
            logger.info("WebSocket services initialized successfully")
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket client connected: {client_id}")
        
        # Send welcome message
        await self.send_message(client_id, {
            "type": "connection",
            "status": "connected",
            "client_id": client_id,
            "message": "🌟 Connected to ILLUMINUS Wav2Lip WebSocket API"
        })
    
    async def disconnect(self, client_id: str):
        """Handle client disconnection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            
        # Cancel processing task if running
        if client_id in self.processing_tasks:
            self.processing_tasks[client_id].cancel()
            del self.processing_tasks[client_id]
            
        logger.info(f"WebSocket client disconnected: {client_id}")
    
    async def send_message(self, client_id: str, message: Dict[str, Any]):
        """Send message to specific client"""
        websocket = self.active_connections.get(client_id)
        if websocket and websocket.client_state == WebSocketState.CONNECTED:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                error_msg = str(e)
                if "disconnect" in error_msg.lower() or "closed" in error_msg.lower():
                    logger.info(f"Client {client_id} disconnected while sending message")
                else:
                    logger.error(f"Error sending message to {client_id}: {e}")
                await self.disconnect(client_id)
    
    async def send_error(self, client_id: str, error: str, error_type: str = "processing_error"):
        """Send error message to client"""
        await self.send_message(client_id, {
            "type": "error",
            "error_type": error_type,
            "message": error,
            "timestamp": time.time()
        })
    
    async def send_progress(self, client_id: str, progress: float, message: str = ""):
        """Send progress update to client"""
        await self.send_message(client_id, {
            "type": "progress",
            "progress": progress,
            "message": message,
            "timestamp": time.time()
        })
    
    async def process_lip_sync(self, client_id: str, audio_data: bytes, image_data: bytes, 
                             options: Dict[str, Any]):
        """Process lip-sync in background task"""
        start_time = time.time()
        temp_files = []
        
        try:
            await self.send_progress(client_id, 10, "🎯 Processing input data...")
            
            # Save temporary files
            job_id = str(uuid.uuid4())[:8]
            
            # Save audio file
            audio_suffix = options.get('audio_format', 'wav')
            audio_path = f"temp/websocket/{job_id}_audio.{audio_suffix}"
            with open(audio_path, 'wb') as f:
                f.write(audio_data)
            temp_files.append(audio_path)
            
            # Save image file  
            image_suffix = options.get('image_format', 'jpg')
            image_path = f"temp/websocket/{job_id}_image.{image_suffix}"
            with open(image_path, 'wb') as f:
                f.write(image_data)
            temp_files.append(image_path)
            
            output_path = f"temp/websocket/{job_id}_result.mp4"
            temp_files.append(output_path)
            
            await self.send_progress(client_id, 30, "🤖 Starting AI processing...")
            
            # Process with pipeline
            model_type = options.get('model_type', 'nota_wav2lip')  # Default to faster model
            
            result = self.pipeline_service.process_video_audio(
                video_path=image_path,  # Use image as single frame
                audio_path=audio_path,
                model_type=model_type,
                pads=options.get('pads', (0, 10, 0, 0)),
                nosmooth=options.get('nosmooth', False),
                resize_factor=options.get('resize_factor', 1),
                static=True,  # Always static for image input
                output_path=output_path
            )
            
            await self.send_progress(client_id, 80, "📹 Encoding video...")
            
            # Read result video and encode to base64
            with open(output_path, 'rb') as f:
                video_bytes = f.read()
            
            video_base64 = base64.b64encode(video_bytes).decode('utf-8')
            
            # Calculate metrics
            processing_time = time.time() - start_time
            
            await self.send_progress(client_id, 100, "✅ Processing complete!")
            
            # Send result (check if client still connected)
            if client_id in self.active_connections:
                await self.send_message(client_id, {
                    "type": "result",
                    "job_id": job_id,
                    "video_base64": video_base64,
                    "video_size": len(video_bytes),
                    "processing_time": processing_time,
                    "model_used": model_type,
                    "inference_fps": result.get('inference_fps', 0),
                    "frames_processed": result.get('frames_processed', 0),
                    "timestamp": time.time()
                })
                logger.info(f"WebSocket job {job_id} completed in {processing_time:.2f}s")
            else:
                logger.info(f"WebSocket job {job_id} completed in {processing_time:.2f}s but client {client_id} already disconnected")
            
        except Exception as e:
            error_msg = f"Processing failed: {str(e)}"
            logger.error(f"WebSocket processing error for {client_id}: {error_msg}")
            logger.error(traceback.format_exc())
            await self.send_error(client_id, error_msg)
            
        finally:
            # Cleanup temporary files
            for temp_file in temp_files:
                try:
                    Path(temp_file).unlink(missing_ok=True)
                except Exception as e:
                    logger.warning(f"Could not clean up {temp_file}: {e}")
            
            # Remove from processing tasks
            if client_id in self.processing_tasks:
                del self.processing_tasks[client_id]

# Global WebSocket manager
manager = WebSocketManager()

@router.websocket("/ws/lip-sync")
async def websocket_lip_sync(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for lip-syncing
    
    Expected message format:
    {
        "type": "process",
        "audio_base64": "base64-encoded-audio-data",
        "image_base64": "base64-encoded-image-data", 
        "options": {
            "model_type": "nota_wav2lip" | "wav2lip",
            "audio_format": "wav" | "mp3" | "m4a",
            "image_format": "jpg" | "png",
            "pads": [top, bottom, left, right],
            "resize_factor": 1,
            "nosmooth": false
        }
    }
    """
    client_id = str(uuid.uuid4())
    
    try:
        # Initialize services
        await manager.initialize_services()
        
        # Accept connection
        await manager.connect(websocket, client_id)
        
        while True:
            try:
                # Check if WebSocket is still connected
                if websocket.client_state != WebSocketState.CONNECTED:
                    break
                    
                # Receive message
                data = await websocket.receive_text()
                message = json.loads(data)
                
                message_type = message.get("type")
                
                if message_type == "process":
                    # Check if already processing
                    if client_id in manager.processing_tasks:
                        await manager.send_error(client_id, 
                            "Another processing task is already running. Please wait.", 
                            "task_running")
                        continue
                    
                    # Validate input
                    audio_base64 = message.get("audio_base64")
                    image_base64 = message.get("image_base64")
                    
                    if not audio_base64 or not image_base64:
                        await manager.send_error(client_id, 
                            "Missing required fields: audio_base64, image_base64",
                            "validation_error")
                        continue
                    
                    try:
                        # Decode base64 data
                        audio_data = base64.b64decode(audio_base64)
                        image_data = base64.b64decode(image_base64)
                        
                        # Validate sizes
                        if len(audio_data) == 0 or len(image_data) == 0:
                            await manager.send_error(client_id, 
                                "Empty audio or image data", 
                                "validation_error")
                            continue
                            
                        if len(audio_data) > 50 * 1024 * 1024:  # 50MB limit
                            await manager.send_error(client_id, 
                                "Audio file too large (max 50MB)", 
                                "validation_error")
                            continue
                            
                        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
                            await manager.send_error(client_id, 
                                "Image file too large (max 10MB)", 
                                "validation_error")
                            continue
                        
                    except Exception as e:
                        await manager.send_error(client_id, 
                            f"Invalid base64 encoding: {str(e)}", 
                            "validation_error")
                        continue
                    
                    # Get options
                    options = message.get("options", {})
                    
                    # Start processing task
                    task = asyncio.create_task(
                        manager.process_lip_sync(client_id, audio_data, image_data, options)
                    )
                    manager.processing_tasks[client_id] = task
                    
                elif message_type == "ping":
                    # Handle ping-pong for connection health
                    await manager.send_message(client_id, {
                        "type": "pong", 
                        "timestamp": time.time()
                    })
                    
                elif message_type == "cancel":
                    # Cancel current processing
                    if client_id in manager.processing_tasks:
                        manager.processing_tasks[client_id].cancel()
                        del manager.processing_tasks[client_id]
                        await manager.send_message(client_id, {
                            "type": "cancelled",
                            "message": "Processing cancelled"
                        })
                    else:
                        await manager.send_message(client_id, {
                            "type": "info",
                            "message": "No active processing to cancel"
                        })
                        
                else:
                    await manager.send_error(client_id, 
                        f"Unknown message type: {message_type}", 
                        "validation_error")
                    
            except json.JSONDecodeError as e:
                await manager.send_error(client_id, 
                    f"Invalid JSON format: {str(e)}", 
                    "json_error")
                
            except WebSocketDisconnect:
                logger.info(f"Client {client_id} disconnected during message handling")
                break
                
            except Exception as e:
                error_msg = str(e)
                if "disconnect message has been received" in error_msg.lower():
                    logger.info(f"Client {client_id} disconnected")
                    break
                else:
                    logger.error(f"WebSocket message handling error: {e}")
                    try:
                        await manager.send_error(client_id, 
                            f"Message processing error: {str(e)}", 
                            "internal_error")
                    except:
                        # If we can't send error, connection is probably closed
                        break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket client {client_id} disconnected normally")
        
    except Exception as e:
        logger.error(f"WebSocket connection error for {client_id}: {e}")
        
    finally:
        await manager.disconnect(client_id)

@router.get("/ws/health")
async def websocket_health():
    """Health check for WebSocket service"""
    return {
        "status": "healthy",
        "active_connections": len(manager.active_connections),
        "processing_tasks": len(manager.processing_tasks),
        "services_initialized": manager.pipeline_service is not None
    } 