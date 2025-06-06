/**
 * ILLUMINUS WebSocket Test Client
 * Browser-based test client for real-time lip-syncing WebSocket API
 * 
 * @author Andrew (ngpthanh15@gmail.com)
 * @version 1.0.0
 */

class WebSocketTestClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isProcessing = false;
        this.resultVideoBlob = null;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.elements = {
            connectBtn: document.getElementById('connectBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            pingBtn: document.getElementById('pingBtn'),
            processBtn: document.getElementById('processBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            connectionStatus: document.getElementById('connectionStatus'),
            audioFile: document.getElementById('audioFile'),
            videoFile: document.getElementById('videoFile'),
            modelType: document.getElementById('modelType'),
            resizeFactor: document.getElementById('resizeFactor'),
            progressSection: document.getElementById('progressSection'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),
            progressDetails: document.getElementById('progressDetails'),
            resultSection: document.getElementById('resultSection'),
            resultVideo: document.getElementById('resultVideo'),
            downloadBtn: document.getElementById('downloadBtn'),
            log: document.getElementById('log'),
            clearLogBtn: document.getElementById('clearLogBtn')
        };
    }
    
    bindEvents() {
        this.elements.connectBtn.addEventListener('click', () => this.connect());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.elements.pingBtn.addEventListener('click', () => this.sendPing());
        this.elements.processBtn.addEventListener('click', () => this.startProcessing());
        this.elements.cancelBtn.addEventListener('click', () => this.cancelProcessing());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.elements.clearLogBtn.addEventListener('click', () => this.clearLog());
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        
        this.elements.log.appendChild(logEntry);
        this.elements.log.scrollTop = this.elements.log.scrollHeight;
    }
    
    clearLog() {
        this.elements.log.innerHTML = '<div class="log-entry info">Log cleared...</div>';
    }
    
    updateConnectionStatus(connected) {
        this.isConnected = connected;
        
        if (connected) {
            this.elements.connectionStatus.textContent = 'Connected';
            this.elements.connectionStatus.className = 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800';
            this.elements.connectBtn.disabled = true;
            this.elements.disconnectBtn.disabled = false;
            this.elements.pingBtn.disabled = false;
            this.updateProcessBtn();
        } else {
            this.elements.connectionStatus.textContent = 'Disconnected';
            this.elements.connectionStatus.className = 'px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800';
            this.elements.connectBtn.disabled = false;
            this.elements.disconnectBtn.disabled = true;
            this.elements.pingBtn.disabled = true;
            this.elements.processBtn.disabled = true;
            this.elements.cancelBtn.disabled = true;
        }
    }
    
    updateProcessBtn() {
        const hasFiles = this.elements.audioFile.files[0] && this.elements.videoFile.files[0];
        this.elements.processBtn.disabled = !this.isConnected || !hasFiles || this.isProcessing;
    }
    
    async connect() {
        try {
            this.log('🔗 Connecting to WebSocket server...', 'info');
            
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/lip-sync`;
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.log('✅ Connected successfully!', 'success');
                this.updateConnectionStatus(true);
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.ws.onclose = () => {
                this.log('🔌 Connection closed', 'warning');
                this.updateConnectionStatus(false);
            };
            
            this.ws.onerror = (error) => {
                this.log(`❌ Connection error: ${error}`, 'error');
                this.updateConnectionStatus(false);
            };
            
        } catch (error) {
            this.log(`❌ Failed to connect: ${error}`, 'error');
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.updateConnectionStatus(false);
    }
    
    sendMessage(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.log('❌ Not connected to server', 'error');
            return;
        }
        
        this.ws.send(JSON.stringify(message));
        this.log(`📤 Sent: ${message.type} message`, 'info');
    }
    
    sendPing() {
        this.sendMessage({ type: 'ping' });
    }
    
    async startProcessing() {
        if (!this.elements.audioFile.files[0] || !this.elements.videoFile.files[0]) {
            this.log('❌ Please select both audio and video/image files', 'error');
            return;
        }
        
        try {
            this.isProcessing = true;
            this.updateProcessBtn();
            this.elements.cancelBtn.disabled = false;
            this.elements.progressSection.classList.remove('hidden');
            this.elements.resultSection.classList.add('hidden');
            
            this.log('📁 Reading files...', 'info');
            
            // Read files
            const audioFile = this.elements.audioFile.files[0];
            const videoFile = this.elements.videoFile.files[0];
            
            const audioBase64 = await this.fileToBase64(audioFile);
            const videoBase64 = await this.fileToBase64(videoFile);
            
            this.log(`📊 Audio: ${this.formatSize(audioFile.size)}`, 'info');
            
            // Detect file type
            const isVideo = videoFile.type.startsWith('video/');
            const fileIcon = isVideo ? '🎬' : '🖼️';
            const fileType = isVideo ? 'Video' : 'Image';
            this.log(`${fileIcon} ${fileType}: ${this.formatSize(videoFile.size)}`, 'info');
            
            if (!isVideo) {
                this.log('📝 Image will be auto-looped to match audio length', 'info');
            }
            
            // Prepare options
            const options = {
                model_type: this.elements.modelType.value === 'original' ? 'wav2lip' : 'nota_wav2lip',
                resize_factor: parseInt(this.elements.resizeFactor.value),
                audio_format: audioFile.name.split('.').pop().toLowerCase(),
                video_format: videoFile.name.split('.').pop().toLowerCase(),
                pads: [0, 10, 0, 0],
                nosmooth: false
            };
            
            // Send processing request
            this.sendMessage({
                type: 'process',
                audio_base64: audioBase64,
                video_base64: videoBase64,
                options: options
            });
            
            this.log('🚀 Processing request sent!', 'success');
            
        } catch (error) {
            this.log(`❌ Error starting processing: ${error}`, 'error');
            this.isProcessing = false;
            this.updateProcessBtn();
            this.elements.cancelBtn.disabled = true;
        }
    }
    
    cancelProcessing() {
        this.sendMessage({ type: 'cancel' });
        this.log('🛑 Cancel request sent', 'warning');
    }
    
    handleMessage(data) {
        const { type } = data;
        
        switch (type) {
            case 'connection':
                this.log(`🌟 ${data.message}`, 'success');
                this.log(`🆔 Client ID: ${data.client_id}`, 'info');
                break;
                
            case 'progress':
                const progress = data.progress || 0;
                const message = data.message || '';
                this.updateProgress(progress, message);
                this.log(`⏳ ${progress.toFixed(1)}% - ${message}`, 'info');
                break;
                
            case 'result':
                this.handleResult(data);
                break;
                
            case 'error':
                this.log(`❌ ${data.error_type}: ${data.message}`, 'error');
                this.isProcessing = false;
                this.updateProcessBtn();
                this.elements.cancelBtn.disabled = true;
                break;
                
            case 'pong':
                this.log('🏓 Pong received', 'success');
                break;
                
            case 'cancelled':
                this.log('🛑 Processing cancelled', 'warning');
                this.isProcessing = false;
                this.updateProcessBtn();
                this.elements.cancelBtn.disabled = true;
                break;
                
            default:
                this.log(`❓ Unknown message: ${type}`, 'warning');
        }
    }
    
    updateProgress(progress, message) {
        this.elements.progressBar.style.width = `${progress}%`;
        this.elements.progressText.textContent = message;
        this.elements.progressPercent.textContent = `${Math.round(progress)}%`;
        
        // Add real-time visual effects
        if (progress < 25) {
            this.elements.progressBar.className = 'progress-bar bg-gradient-to-r from-red-500 to-orange-500 h-6 rounded-full transition-all duration-300 ease-out shadow-lg';
        } else if (progress < 50) {
            this.elements.progressBar.className = 'progress-bar bg-gradient-to-r from-orange-500 to-yellow-500 h-6 rounded-full transition-all duration-300 ease-out shadow-lg';
        } else if (progress < 75) {
            this.elements.progressBar.className = 'progress-bar bg-gradient-to-r from-yellow-500 to-blue-500 h-6 rounded-full transition-all duration-300 ease-out shadow-lg';
        } else {
            this.elements.progressBar.className = 'progress-bar bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-6 rounded-full transition-all duration-300 ease-out shadow-lg';
        }
        
        // Update details
        const now = new Date();
        this.elements.progressDetails.textContent = `Last update: ${now.toLocaleTimeString()}`;
    }
    
    handleResult(data) {
        this.log('🎉 Processing completed!', 'success');
        this.log(`⏱️ Time: ${data.processing_time?.toFixed(2)}s`, 'info');
        this.log(`🤖 Model: ${data.model_used}`, 'info');
        this.log(`📊 FPS: ${data.inference_fps?.toFixed(1)}`, 'info');
        
        this.isProcessing = false;
        this.updateProcessBtn();
        this.elements.cancelBtn.disabled = true;
        
        // Show result video
        if (data.video_base64) {
            this.showResultVideo(data.video_base64);
        }
        
        // Auto-disconnect after successful processing to prevent connection errors
        setTimeout(() => {
            if (this.isConnected) {
                this.log('🔌 Auto-disconnecting after successful processing', 'info');
                this.disconnect();
            }
        }, 2000);
    }
    
    showResultVideo(videoBase64) {
        try {
            // Convert base64 to blob
            const byteCharacters = atob(videoBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            this.resultVideoBlob = new Blob([byteArray], { type: 'video/mp4' });
            
            // Create object URL and set video source
            const videoUrl = URL.createObjectURL(this.resultVideoBlob);
            this.elements.resultVideo.src = videoUrl;
            
            // Show result section
            this.elements.resultSection.classList.remove('hidden');
            
            this.log('📹 Result video ready for viewing', 'success');
            
        } catch (error) {
            this.log(`❌ Error displaying video: ${error}`, 'error');
        }
    }
    
    downloadResult() {
        if (!this.resultVideoBlob) {
            this.log('❌ No video to download', 'error');
            return;
        }
        
        const url = URL.createObjectURL(this.resultVideoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `illuminus_result_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('📥 Download started', 'success');
    }
    
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)}${units[unitIndex]}`;
    }
}

// Initialize client when page loads
document.addEventListener('DOMContentLoaded', () => {
    const client = new WebSocketTestClient();
    
    // Update process button when files change
    client.elements.audioFile.addEventListener('change', () => client.updateProcessBtn());
    client.elements.imageFile.addEventListener('change', () => client.updateProcessBtn());
}); 