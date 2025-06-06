# 🚀 ILLUMINUS WebSocket API Guide

## Real-time Lip-Syncing WebSocket API

Tài liệu này hướng dẫn sử dụng **WebSocket API** của ILLUMINUS để tạo video lip-sync real-time từ audio và hình ảnh.

---

## 📡 WebSocket Endpoint

```
ws://localhost:8000/ws/lip-sync
```

**Production (HTTPS):**
```
wss://your-domain.com/ws/lip-sync
```

---

## 🔗 Connection Protocol

### 1. Kết nối WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/lip-sync');

ws.onopen = () => {
    console.log('Connected to ILLUMINUS WebSocket API');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
};
```

### 2. Message Format

Tất cả messages đều sử dụng JSON format:

```json
{
    "type": "message_type",
    "data": { ... },
    "timestamp": 1234567890
}
```

---

## 📨 Message Types

### 🎯 Process Request

Gửi request để xử lý lip-sync:

```json
{
    "type": "process",
    "audio_base64": "base64-encoded-audio-data",
    "image_base64": "base64-encoded-image-data",
    "options": {
        "model_type": "nota_wav2lip",
        "audio_format": "wav",
        "image_format": "jpg",
        "pads": [0, 10, 0, 0],
        "resize_factor": 1,
        "nosmooth": false
    }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio_base64` | string | ✅ | Base64-encoded audio file |
| `image_base64` | string | ✅ | Base64-encoded image file |
| `options.model_type` | string | ❌ | `"wav2lip"` hoặc `"nota_wav2lip"` (default) |
| `options.audio_format` | string | ❌ | `"wav"`, `"mp3"`, `"m4a"` |
| `options.image_format` | string | ❌ | `"jpg"`, `"png"` |
| `options.pads` | array | ❌ | Face padding [top, bottom, left, right] |
| `options.resize_factor` | integer | ❌ | Resize factor (1, 2, 4) |
| `options.nosmooth` | boolean | ❌ | Disable temporal smoothing |

### 🏓 Ping/Pong

Kiểm tra connection health:

```json
// Send ping
{
    "type": "ping"
}

// Receive pong
{
    "type": "pong",
    "timestamp": 1234567890
}
```

### 🛑 Cancel Processing

Hủy bỏ processing hiện tại:

```json
{
    "type": "cancel"
}
```

---

## 📥 Server Responses

### 🌟 Connection Confirmed

```json
{
    "type": "connection",
    "status": "connected",
    "client_id": "uuid-string",
    "message": "🌟 Connected to ILLUMINUS Wav2Lip WebSocket API"
}
```

### ⏳ Progress Updates

```json
{
    "type": "progress",
    "progress": 75.5,
    "message": "🤖 Starting AI processing...",
    "timestamp": 1234567890
}
```

### 🎉 Processing Result

```json
{
    "type": "result",
    "job_id": "abc123",
    "video_base64": "base64-encoded-video-data",
    "video_size": 1048576,
    "processing_time": 12.5,
    "model_used": "nota_wav2lip",
    "inference_fps": 45.2,
    "frames_processed": 150,
    "timestamp": 1234567890
}
```

### ❌ Error Messages

```json
{
    "type": "error",
    "error_type": "validation_error",
    "message": "Missing required fields: audio_base64, image_base64",
    "timestamp": 1234567890
}
```

**Error Types:**
- `validation_error`: Input validation failed
- `processing_error`: AI processing error
- `internal_error`: Server internal error
- `task_running`: Another task already running
- `json_error`: Invalid JSON format

### ✅ Operation Responses

```json
// Processing cancelled
{
    "type": "cancelled",
    "message": "Processing cancelled"
}

// Info messages
{
    "type": "info",
    "message": "No active processing to cancel"
}
```

---

## 💻 Code Examples

### Python Client

```python
import asyncio
import websockets
import json
import base64

async def websocket_client():
    uri = "ws://localhost:8000/ws/lip-sync"
    
    async with websockets.connect(uri) as websocket:
        # Wait for connection message
        response = await websocket.recv()
        print(f"Connected: {response}")
        
        # Read files
        with open("audio.wav", "rb") as f:
            audio_data = base64.b64encode(f.read()).decode()
        
        with open("person.jpg", "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
        
        # Send processing request
        request = {
            "type": "process",
            "audio_base64": audio_data,
            "image_base64": image_data,
            "options": {
                "model_type": "nota_wav2lip",
                "resize_factor": 1
            }
        }
        
        await websocket.send(json.dumps(request))
        
        # Listen for responses
        async for message in websocket:
            data = json.loads(message)
            
            if data["type"] == "progress":
                print(f"Progress: {data['progress']:.1f}%")
            
            elif data["type"] == "result":
                print("Processing completed!")
                
                # Save result video
                video_data = base64.b64decode(data["video_base64"])
                with open("result.mp4", "wb") as f:
                    f.write(video_data)
                break
            
            elif data["type"] == "error":
                print(f"Error: {data['message']}")
                break

# Run client
asyncio.run(websocket_client())
```

### JavaScript Client

```javascript
class IlluminusWebSocketClient {
    constructor(url = 'ws://localhost:8000/ws/lip-sync') {
        this.url = url;
        this.ws = null;
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('Connected to ILLUMINUS API');
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };
        });
    }
    
    async processFiles(audioFile, imageFile, options = {}) {
        const audioBase64 = await this.fileToBase64(audioFile);
        const imageBase64 = await this.fileToBase64(imageFile);
        
        const message = {
            type: 'process',
            audio_base64: audioBase64,
            image_base64: imageBase64,
            options: {
                model_type: 'nota_wav2lip',
                resize_factor: 1,
                ...options
            }
        };
        
        this.ws.send(JSON.stringify(message));
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'connection':
                console.log(`Connected: ${data.message}`);
                break;
                
            case 'progress':
                console.log(`Progress: ${data.progress}% - ${data.message}`);
                this.onProgress?.(data.progress, data.message);
                break;
                
            case 'result':
                console.log('Processing completed!');
                this.onResult?.(data);
                break;
                
            case 'error':
                console.error(`Error: ${data.message}`);
                this.onError?.(data);
                break;
        }
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Usage
const client = new IlluminusWebSocketClient();

client.onProgress = (progress, message) => {
    console.log(`${progress}%: ${message}`);
};

client.onResult = (data) => {
    // Create video blob and download
    const videoData = atob(data.video_base64);
    const videoBlob = new Blob([new Uint8Array([...videoData].map(c => c.charCodeAt(0)))], {
        type: 'video/mp4'
    });
    
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'result.mp4';
    a.click();
};

// Connect and process
await client.connect();
await client.processFiles(audioFile, imageFile);
```

### Node.js Client

```javascript
const WebSocket = require('ws');
const fs = require('fs');

class IlluminusClient {
    constructor(url = 'ws://localhost:8000/ws/lip-sync') {
        this.url = url;
    }
    
    async process(audioPath, imagePath, options = {}) {
        const ws = new WebSocket(this.url);
        
        return new Promise((resolve, reject) => {
            ws.on('open', () => {
                console.log('Connected to ILLUMINUS API');
                
                // Read and encode files
                const audioData = fs.readFileSync(audioPath);
                const imageData = fs.readFileSync(imagePath);
                
                const audioBase64 = audioData.toString('base64');
                const imageBase64 = imageData.toString('base64');
                
                // Send request
                const message = {
                    type: 'process',
                    audio_base64: audioBase64,
                    image_base64: imageBase64,
                    options: {
                        model_type: 'nota_wav2lip',
                        ...options
                    }
                };
                
                ws.send(JSON.stringify(message));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                
                if (message.type === 'progress') {
                    console.log(`Progress: ${message.progress}%`);
                } else if (message.type === 'result') {
                    console.log('Processing completed!');
                    
                    // Save result
                    const videoData = Buffer.from(message.video_base64, 'base64');
                    fs.writeFileSync('result.mp4', videoData);
                    
                    ws.close();
                    resolve(message);
                } else if (message.type === 'error') {
                    console.error(`Error: ${message.message}`);
                    ws.close();
                    reject(new Error(message.message));
                }
            });
            
            ws.on('error', reject);
        });
    }
}

// Usage
const client = new IlluminusClient();
client.process('audio.wav', 'person.jpg', { resize_factor: 2 })
    .then(result => console.log('Success:', result))
    .catch(error => console.error('Error:', error));
```

---

## 🧪 Testing

### 1. Browser Test Client

Truy cập: `http://localhost:8000/websocket-test`

Web interface cho phép:
- Upload audio/image files
- Kết nối WebSocket
- Theo dõi real-time progress  
- Download kết quả
- View logs

### 2. Command Line Test

```bash
# Simple connectivity test
python scripts/websocket_test_client.py

# Test with files
python scripts/websocket_test_client.py --audio sample.wav --image person.jpg

# Custom options
python scripts/websocket_test_client.py \
    --audio sample.wav \
    --image person.jpg \
    --model compressed \
    --resize-factor 2

# Custom server
python scripts/websocket_test_client.py \
    --url ws://your-server.com/ws/lip-sync \
    --audio sample.wav \
    --image person.jpg
```

### 3. Health Check

```bash
curl http://localhost:8000/ws/health
```

Response:
```json
{
    "status": "healthy",
    "active_connections": 2,
    "processing_tasks": 1,
    "services_initialized": true
}
```

---

## ⚡ Performance & Limits

### File Size Limits

| File Type | Max Size | Recommended |
|-----------|----------|-------------|
| Audio | 50MB | < 10MB |
| Image | 10MB | < 5MB |

### Processing Limits

- **Concurrent connections**: Unlimited
- **Concurrent processing per client**: 1
- **Global concurrent processing**: Limited by GPU memory
- **Timeout**: 300 seconds per request

### Performance Tips

1. **Sử dụng compressed model** (`nota_wav2lip`) cho tốc độ 28× nhanh hơn
2. **Resize factor = 2 hoặc 4** cho processing nhanh hơn
3. **Optimize audio**: Sử dụng WAV format, 16kHz sampling rate
4. **Optimize image**: JPG format, resolution < 1024x1024

---

## 🚨 Error Handling

### Common Errors

```javascript
// Handle connection errors
ws.onerror = (error) => {
    console.error('Connection failed:', error);
    // Implement retry logic
};

// Handle processing errors
if (data.type === 'error') {
    switch (data.error_type) {
        case 'validation_error':
            console.error('Invalid input:', data.message);
            break;
        case 'processing_error':
            console.error('AI processing failed:', data.message);
            break;
        case 'task_running':
            console.warn('Another task is running, please wait');
            break;
    }
}
```

### Retry Logic

```javascript
class RobustWebSocketClient {
    constructor(url, maxRetries = 3) {
        this.url = url;
        this.maxRetries = maxRetries;
        this.retryCount = 0;
    }
    
    async connect() {
        try {
            this.ws = new WebSocket(this.url);
            await this.waitForOpen();
            this.retryCount = 0; // Reset on success
        } catch (error) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retry ${this.retryCount}/${this.maxRetries}...`);
                await this.delay(1000 * this.retryCount);
                return this.connect();
            }
            throw error;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    waitForOpen() {
        return new Promise((resolve, reject) => {
            this.ws.onopen = resolve;
            this.ws.onerror = reject;
        });
    }
}
```

---

## 🔒 Security Considerations

1. **Rate Limiting**: Implement client-side rate limiting
2. **File Validation**: Validate file types and sizes before upload
3. **Error Handling**: Don't expose sensitive error details
4. **Authentication**: Consider adding authentication for production
5. **HTTPS**: Use WSS in production environments

---

## 📈 Monitoring & Logging

### Client-side Logging

```javascript
class LoggingWebSocketClient {
    constructor(url) {
        this.url = url;
        this.logs = [];
    }
    
    log(level, message, data = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        
        this.logs.push(entry);
        console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    }
    
    getLogs() {
        return this.logs;
    }
    
    exportLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `illuminus_logs_${Date.now()}.json`;
        a.click();
    }
}
```

---

## 🛠️ Troubleshooting

### Connection Issues

```bash
# Check server status
curl http://localhost:8000/health

# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
    http://localhost:8000/ws/lip-sync
```

### Common Problems

| Problem | Solution |
|---------|----------|
| Connection refused | Check if server is running on port 8000 |
| Large files fail | Reduce file sizes or use resize_factor |
| Processing timeout | Use faster model or reduce quality |
| GPU out of memory | Reduce batch sizes or use CPU mode |

---

## 📚 Additional Resources

- [REST API Documentation](rest_api_guide.md)
- [Model Performance Comparison](model_comparison.md)
- [Deployment Guide](deployment_guide.md)
- [FAQ](faq.md)

---

**Made with ❤️ by Andrew**  
📧 Contact: ngpthanh15@gmail.com  
🔗 GitHub: [@Zeres-Engel](https://github.com/Zeres-Engel) 