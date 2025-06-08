#!/usr/bin/env python3
"""
ILLUMINUS Wav2Lip - WebSocket Test Client
Test client for real-time lip-syncing WebSocket API

Author: Andrew (ngpthanh15@gmail.com)
Version: 1.0.0

Usage:
    python scripts/websocket_test_client.py --audio sample.wav --image person.jpg
    python scripts/websocket_test_client.py --help
"""

import asyncio
import websockets
import json
import base64
import argparse
import time
from pathlib import Path
from typing import Optional
import sys

class WebSocketTestClient:
    """Test client for ILLUMINUS WebSocket API"""
    
    def __init__(self, uri: str = "ws://localhost:8000/ws/lip-sync"):
        self.uri = uri
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            print(f"🔗 Connecting to {self.uri}...")
            self.websocket = await websockets.connect(self.uri)
            print("✅ Connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.websocket:
            await self.websocket.close()
            print("🔌 Disconnected")
    
    async def send_message(self, message: dict):
        """Send message to server"""
        if not self.websocket:
            print("❌ Not connected to server")
            return
            
        try:
            await self.websocket.send(json.dumps(message))
            print(f"📤 Sent: {message.get('type', 'unknown')} message")
        except Exception as e:
            print(f"❌ Send error: {e}")
    
    async def receive_messages(self):
        """Listen for messages from server"""
        if not self.websocket:
            return
            
        try:
            async for message in self.websocket:
                data = json.loads(message)
                await self.handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            print("🔌 Connection closed by server")
        except Exception as e:
            print(f"❌ Receive error: {e}")
    
    async def handle_message(self, data: dict):
        """Handle received message"""
        msg_type = data.get("type", "unknown")
        
        if msg_type == "connection":
            print(f"🌟 {data.get('message', '')}")
            print(f"🆔 Client ID: {data.get('client_id', 'unknown')}")
            
        elif msg_type == "progress":
            progress = data.get("progress", 0)
            message = data.get("message", "")
            print(f"⏳ Progress: {progress:.1f}% - {message}")
            
        elif msg_type == "result":
            print("\n🎉 PROCESSING COMPLETE!")
            print("=" * 50)
            print(f"📋 Job ID: {data.get('job_id', 'unknown')}")
            print(f"⏱️ Processing Time: {data.get('processing_time', 0):.2f}s")
            print(f"🤖 Model Used: {data.get('model_used', 'unknown')}")
            print(f"📊 Inference FPS: {data.get('inference_fps', 0):.1f}")
            print(f"🎬 Frames Processed: {data.get('frames_processed', 0)}")
            print(f"📦 Video Size: {self.format_size(data.get('video_size', 0))}")
            
            # Save result video
            if data.get('video_base64'):
                await self.save_result_video(data['video_base64'], data.get('job_id', 'result'))
                
        elif msg_type == "error":
            error_type = data.get("error_type", "unknown")
            message = data.get("message", "Unknown error")
            print(f"❌ Error ({error_type}): {message}")
            
        elif msg_type == "pong":
            print("🏓 Pong received")
            
        elif msg_type == "cancelled":
            print("🛑 Processing cancelled")
            
        elif msg_type == "info":
            print(f"ℹ️ Info: {data.get('message', '')}")
            
        else:
            print(f"❓ Unknown message type: {msg_type}")
            print(f"📄 Data: {data}")
    
    async def save_result_video(self, video_base64: str, job_id: str):
        """Save result video from base64"""
        try:
            video_data = base64.b64decode(video_base64)
            output_path = f"result_{job_id}.mp4"
            
            with open(output_path, 'wb') as f:
                f.write(video_data)
                
            print(f"💾 Result saved: {output_path}")
            
        except Exception as e:
            print(f"❌ Error saving video: {e}")
    
    def format_size(self, size_bytes: int) -> str:
        """Format bytes to human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f}{unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f}TB"
    
    async def send_process_request(self, audio_path: str, image_path: str, options: dict = None):
        """Send processing request with audio and image"""
        if not Path(audio_path).exists():
            print(f"❌ Audio file not found: {audio_path}")
            return
            
        if not Path(image_path).exists():
            print(f"❌ Image file not found: {image_path}")
            return
        
        try:
            # Read and encode files
            print("📁 Reading files...")
            
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            with open(image_path, 'rb') as f:
                image_data = f.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            print(f"📊 Audio size: {self.format_size(len(audio_data))}")
            print(f"🖼️ Image size: {self.format_size(len(image_data))}")
            
            # Prepare message
            message = {
                "type": "process",
                "audio_base64": audio_base64,
                "image_base64": image_base64,
                "options": options or {}
            }
            
            print("🚀 Sending processing request...")
            await self.send_message(message)
            
        except Exception as e:
            print(f"❌ Error preparing request: {e}")
    
    async def send_ping(self):
        """Send ping message"""
        await self.send_message({"type": "ping"})
    
    async def send_cancel(self):
        """Send cancel message"""
        await self.send_message({"type": "cancel"})
    
    async def run_interactive_test(self, audio_path: str, image_path: str, options: dict = None):
        """Run interactive test session"""
        if not await self.connect():
            return
        
        try:
            # Start listening for messages
            listen_task = asyncio.create_task(self.receive_messages())
            
            # Wait a bit for connection message
            await asyncio.sleep(1)
            
            # Send processing request
            await self.send_process_request(audio_path, image_path, options)
            
            # Wait for completion or user interrupt
            print("\n💡 Press Ctrl+C to cancel processing")
            try:
                await listen_task
            except KeyboardInterrupt:
                print("\n🛑 User cancelled, sending cancel request...")
                await self.send_cancel()
                await asyncio.sleep(1)
                
        finally:
            await self.disconnect()
    
    async def run_simple_test(self):
        """Run simple connectivity test"""
        if not await self.connect():
            return
            
        try:
            # Start listening
            listen_task = asyncio.create_task(self.receive_messages())
            
            # Send ping
            await asyncio.sleep(1)
            await self.send_ping()
            
            # Wait a bit
            await asyncio.sleep(2)
            
            listen_task.cancel()
            
        finally:
            await self.disconnect()

def main():
    parser = argparse.ArgumentParser(
        description="ILLUMINUS WebSocket Test Client",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Simple connectivity test
  python scripts/websocket_test_client.py
  
  # Test with audio and image files
  python scripts/websocket_test_client.py --audio sample.wav --image person.jpg
  
  # Test with custom options
  python scripts/websocket_test_client.py --audio sample.wav --image person.jpg --model compressed --resize-factor 2
  
  # Custom server URL
  python scripts/websocket_test_client.py --url ws://localhost:8000/ws/lip-sync --audio sample.wav --image person.jpg
        """
    )
    
    parser.add_argument(
        "--url", "-u",
        default="ws://localhost:8000/ws/lip-sync",
        help="WebSocket URL (default: ws://localhost:8000/ws/lip-sync)"
    )
    
    parser.add_argument(
        "--audio", "-a",
        help="Path to audio file (WAV, MP3, M4A)"
    )
    
    parser.add_argument(
        "--image", "-i", 
        help="Path to image file (JPG, PNG)"
    )
    
    parser.add_argument(
        "--model", "-m",
        choices=["original", "compressed"],
        default="compressed",
        help="Model type (default: compressed)"
    )
    
    parser.add_argument(
        "--resize-factor", "-r",
        type=int,
        default=1,
        help="Resize factor for faster processing (default: 1)"
    )
    
    parser.add_argument(
        "--pads", "-p",
        nargs=4,
        type=int,
        default=[0, 10, 0, 0],
        metavar=("TOP", "BOTTOM", "LEFT", "RIGHT"),
        help="Face detection padding (default: 0 10 0 0)"
    )
    
    args = parser.parse_args()
    
    # Create client
    client = WebSocketTestClient(args.url)
    
    # Prepare options
    options = {
        "model_type": "wav2lip" if args.model == "original" else "nota_wav2lip",
        "resize_factor": args.resize_factor,
        "pads": args.pads,
        "nosmooth": False
    }
    
    if args.audio and args.image:
        # Detect file formats
        audio_ext = Path(args.audio).suffix.lower().lstrip('.')
        image_ext = Path(args.image).suffix.lower().lstrip('.')
        
        options["audio_format"] = audio_ext if audio_ext in ['wav', 'mp3', 'm4a'] else 'wav'
        options["image_format"] = image_ext if image_ext in ['jpg', 'jpeg', 'png'] else 'jpg'
        
        print("🌟 ILLUMINUS WebSocket Test Client")
        print("=" * 50)
        print(f"🔗 Server: {args.url}")
        print(f"🎵 Audio: {args.audio}")
        print(f"🖼️ Image: {args.image}")
        print(f"🤖 Model: {args.model}")
        print(f"⚙️ Options: {options}")
        print("=" * 50)
        
        # Run interactive test
        asyncio.run(client.run_interactive_test(args.audio, args.image, options))
    else:
        print("🌟 ILLUMINUS WebSocket Simple Test")
        print("=" * 50)
        print(f"🔗 Server: {args.url}")
        print("🏓 Testing connectivity...")
        print("=" * 50)
        
        # Run simple test
        asyncio.run(client.run_simple_test())

if __name__ == "__main__":
    main() 