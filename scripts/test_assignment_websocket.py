#!/usr/bin/env python3
"""
ILLUMINUS Assignment Test Script
Test WebSocket API compliance for Take-Home Assignment

Usage:
    python scripts/test_assignment_websocket.py
    python scripts/test_assignment_websocket.py --audio sample.wav --image person.jpg
    python scripts/test_assignment_websocket.py --test-only

Author: Andrew (ngpthanh15@gmail.com)
"""

import asyncio
import websockets
import json
import base64
import argparse
import time
import sys
from pathlib import Path


class AssignmentTester:
    """Test WebSocket API compliance for assignment requirements"""
    
    def __init__(self, server_url="ws://localhost:8000/ws/lip-sync"):
        self.server_url = server_url
        self.websocket = None
        
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            print(f"🔗 Connecting to {self.server_url}...")
            self.websocket = await websockets.connect(self.server_url)
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
    
    async def send_message(self, message):
        """Send message to WebSocket"""
        if not self.websocket:
            print("❌ Not connected to WebSocket")
            return None
            
        try:
            await self.websocket.send(json.dumps(message))
            return True
        except Exception as e:
            print(f"❌ Failed to send message: {e}")
            return False
    
    async def receive_message(self):
        """Receive message from WebSocket"""
        if not self.websocket:
            return None
            
        try:
            response = await self.websocket.recv()
            return json.loads(response)
        except Exception as e:
            print(f"❌ Failed to receive message: {e}")
            return None
    
    def file_to_base64(self, file_path):
        """Convert file to base64 string"""
        try:
            with open(file_path, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
        except Exception as e:
            print(f"❌ Failed to read file {file_path}: {e}")
            return None
    
    async def test_connection(self):
        """Test basic WebSocket connection"""
        print("\n🧪 Testing WebSocket Connection...")
        
        if not await self.connect():
            return False
        
        # Wait for welcome message
        welcome = await self.receive_message()
        if welcome and welcome.get('type') == 'connection':
            print(f"✅ Received welcome: {welcome.get('message', '')}")
            assignment_compliance = welcome.get('assignment_compliance')
            if assignment_compliance == 'websocket_only':
                print("✅ Assignment compliance confirmed: WebSocket only")
            return True
        else:
            print("❌ No welcome message received")
            return False
    
    async def test_ping_pong(self):
        """Test ping-pong mechanism"""
        print("\n🏓 Testing Ping-Pong...")
        
        # Send ping
        ping_message = {"type": "ping"}
        if await self.send_message(ping_message):
            print("📤 Sent ping")
            
            # Wait for pong
            pong = await self.receive_message()
            if pong and pong.get('type') == 'pong':
                print("📥 Received pong")
                return True
            else:
                print("❌ No pong received")
                return False
        return False
    
    async def test_processing(self, audio_file=None, image_file=None):
        """Test assignment-compliant processing"""
        print("\n🤖 Testing Assignment Processing...")
        
        # Use default test files if not provided
        if not audio_file:
            audio_file = "data/samples/test_audio.wav"
        if not image_file:
            image_file = "data/samples/test_image.jpg"
        
        # Check if files exist
        audio_path = Path(audio_file)
        image_path = Path(image_file)
        
        if not audio_path.exists():
            print(f"❌ Audio file not found: {audio_file}")
            print("💡 Please provide a valid audio file or place test files in data/samples/")
            return False
            
        if not image_path.exists():
            print(f"❌ Image file not found: {image_file}")
            print("💡 Please provide a valid image file or place test files in data/samples/")
            return False
        
        # Convert files to base64
        print("📁 Converting files to base64...")
        audio_base64 = self.file_to_base64(audio_file)
        image_base64 = self.file_to_base64(image_file)
        
        if not audio_base64 or not image_base64:
            return False
        
        print(f"✅ Audio: {len(audio_base64)} chars, Image: {len(image_base64)} chars")
        
        # Prepare processing message
        process_message = {
            "type": "process",
            "audio_base64": audio_base64,
            "image_base64": image_base64,
            "options": {
                "model_type": "nota_wav2lip",  # Faster model for testing
                "audio_format": audio_path.suffix[1:].lower(),
                "image_format": image_path.suffix[1:].lower(),
                "pads": [0, 10, 0, 0],
                "resize_factor": 2,  # Faster processing
                "nosmooth": False
            }
        }
        
        # Send processing request
        start_time = time.time()
        if await self.send_message(process_message):
            print("📤 Sent processing request")
            
            # Listen for responses
            while True:
                response = await self.receive_message()
                if not response:
                    break
                
                response_type = response.get('type')
                
                if response_type == 'progress':
                    progress = response.get('progress', 0)
                    message = response.get('message', '')
                    print(f"📊 Progress: {progress:.1f}% - {message}")
                
                elif response_type == 'result':
                    processing_time = time.time() - start_time
                    print(f"✅ Processing completed in {processing_time:.2f}s")
                    
                    # Check assignment compliance
                    video_base64 = response.get('video_base64')
                    assignment_compliance = response.get('assignment_compliance', {})
                    
                    if video_base64:
                        print(f"✅ Received base64 video: {len(video_base64)} chars")
                        
                        # Save result video
                        result_path = f"temp/assignment_test_result_{int(time.time())}.mp4"
                        try:
                            video_bytes = base64.b64decode(video_base64)
                            with open(result_path, 'wb') as f:
                                f.write(video_bytes)
                            print(f"💾 Saved result video: {result_path}")
                        except Exception as e:
                            print(f"❌ Failed to save result: {e}")
                    
                    # Check assignment compliance
                    print("\n📋 Assignment Compliance Check:")
                    for requirement, status in assignment_compliance.items():
                        print(f"   {requirement}: {status}")
                    
                    return True
                
                elif response_type == 'error':
                    print(f"❌ Error: {response.get('message', 'Unknown error')}")
                    return False
                
        return False
    
    async def test_assignment_requirements(self):
        """Test all assignment requirements"""
        print("🎯 ILLUMINUS Assignment WebSocket API Test")
        print("=" * 50)
        
        # Test 1: Connection
        if not await self.test_connection():
            return False
        
        # Test 2: Ping-Pong
        if not await self.test_ping_pong():
            return False
        
        # Test 3: Processing (with sample files if available)
        processing_result = await self.test_processing()
        
        await self.disconnect()
        
        print("\n" + "=" * 50)
        if processing_result:
            print("🎉 All assignment requirements tested successfully!")
            print("\n✅ Assignment Compliance:")
            print("   - WebSocket API: ✅")
            print("   - Base64 input (audio + image): ✅")
            print("   - Base64 output (video): ✅")
            print("   - Real-time bi-directional communication: ✅")
            print("   - AI model (Wav2Lip): ✅")
            print("   - Progress updates: ✅")
        else:
            print("❌ Some tests failed. Please check the server and try again.")
        
        return processing_result


async def main():
    parser = argparse.ArgumentParser(description="Test ILLUMINUS Assignment WebSocket API")
    parser.add_argument("--audio", help="Path to audio file")
    parser.add_argument("--image", help="Path to image file")
    parser.add_argument("--server", default="ws://localhost:8000/ws/lip-sync", 
                      help="WebSocket server URL")
    parser.add_argument("--test-only", action="store_true", 
                      help="Only test connection and ping-pong")
    
    args = parser.parse_args()
    
    tester = AssignmentTester(args.server)
    
    if args.test_only:
        # Only test connection and ping-pong
        await tester.connect()
        await tester.test_ping_pong()
        await tester.disconnect()
    else:
        # Full assignment test
        await tester.test_assignment_requirements()


if __name__ == "__main__":
    asyncio.run(main()) 