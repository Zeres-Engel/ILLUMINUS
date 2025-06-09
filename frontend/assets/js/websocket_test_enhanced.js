/**
 * ILLUMINUS WebSocket Test - Enhanced Professional Interface
 * Author: Andrew (ngpthanh15@gmail.com)
 * Version: 2.0.0 - Assignment Focused
 */

class WebSocketTestManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isProcessing = false;
        this.currentFiles = {
            video: null,
            audio: null
        };
        this.startTime = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeConnection();
    }

    initializeElements() {
        // Connection elements
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.connectionBanner = document.getElementById('connectionBanner');
        this.connectionDot = document.getElementById('connectionDot');
        this.connectionText = document.getElementById('connectionText');
        this.connectionIndicator = document.getElementById('connectionIndicator');
        
        // File upload elements
        this.videoFile = document.getElementById('videoFile');
        this.audioFile = document.getElementById('audioFile');
        this.videoPreview = document.getElementById('videoPreview');
        this.audioPreview = document.getElementById('audioPreview');
        this.videoFileName = document.getElementById('videoFileName');
        this.audioFileName = document.getElementById('audioFileName');
        this.videoPreviewContainer = document.getElementById('videoPreviewContainer');
        this.audioPlayer = document.getElementById('audioPlayer');
        
        // Options elements
        this.modelType = document.getElementById('modelType');
        this.deviceType = document.getElementById('deviceType');
        this.resizeFactor = document.getElementById('resizeFactor');
        this.faceBatchSize = document.getElementById('faceBatchSize');
        this.padTop = document.getElementById('padTop');
        this.padBottom = document.getElementById('padBottom');
        this.padLeft = document.getElementById('padLeft');
        this.padRight = document.getElementById('padRight');
        this.staticMode = document.getElementById('staticMode');
        this.noSmooth = document.getElementById('noSmooth');
        
        // Advanced options toggle
        this.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.advancedOptions = document.getElementById('advancedOptions');
        this.advancedIcon = document.getElementById('advancedIcon');
        
        // Control buttons
        this.processBtn = document.getElementById('processBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.pingBtn = document.getElementById('pingBtn');
        
        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        this.startTimeText = document.getElementById('startTime');
        this.processingStatus = document.getElementById('processingStatus');
        this.processSpinner = document.getElementById('processSpinner');
        this.processText = document.getElementById('processText');
        
        // Result elements
        this.resultSection = document.getElementById('resultSection');
        this.resultVideo = document.getElementById('resultVideo');
        this.originalPreview = document.getElementById('originalPreview');
        this.processingTime = document.getElementById('processingTime');
        this.inferenceSpeed = document.getElementById('inferenceSpeed');
        this.modelUsed = document.getElementById('modelUsed');
        this.videoSize = document.getElementById('videoSize');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Log elements
        this.log = document.getElementById('log');
        this.clearLogBtn = document.getElementById('clearLogBtn');
    }

    setupEventListeners() {
        // Connection buttons
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.pingBtn.addEventListener('click', () => this.sendPing());
        
        // File upload
        this.videoFile.addEventListener('change', (e) => this.handleVideoUpload(e));
        this.audioFile.addEventListener('change', (e) => this.handleAudioUpload(e));
        
        // Drag and drop
        this.setupDragAndDrop();
        
        // Advanced options toggle
        this.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedOptions());
        
        // Control buttons
        this.processBtn.addEventListener('click', () => this.startProcessing());
        this.cancelBtn.addEventListener('click', () => this.cancelProcessing());
        
        // Result buttons
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.resetBtn.addEventListener('click', () => this.resetInterface());
        
        // Log clear
        this.clearLogBtn.addEventListener('click', () => this.clearLog());
        
        // File validation
        this.videoFile.addEventListener('change', () => this.validateFiles());
        this.audioFile.addEventListener('change', () => this.validateFiles());
    }

    setupDragAndDrop() {
        const uploadZones = document.querySelectorAll('.upload-zone');
        
        uploadZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('dragover');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    const fileInput = zone.querySelector('input[type="file"]');
                    
                    // Create new FileList
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInput.files = dt.files;
                    
                    // Trigger change event
                    fileInput.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    toggleAdvancedOptions() {
        const isHidden = this.advancedOptions.classList.contains('hidden');
        
        if (isHidden) {
            this.advancedOptions.classList.remove('hidden');
            this.advancedIcon.style.transform = 'rotate(180deg)';
        } else {
            this.advancedOptions.classList.add('hidden');
            this.advancedIcon.style.transform = 'rotate(0deg)';
        }
    }

    handleVideoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.currentFiles.video = file;
        this.videoFileName.textContent = file.name;
        
        // Show preview
        this.videoPreview.classList.remove('hidden');
        
        // Create preview element
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        
        if (isVideo || isImage) {
            const element = document.createElement(isVideo ? 'video' : 'img');
            element.className = 'file-preview w-full rounded-lg';
            if (isVideo) {
                element.controls = true;
                element.muted = true;
            }
            
            element.src = URL.createObjectURL(file);
            this.videoPreviewContainer.innerHTML = '';
            this.videoPreviewContainer.appendChild(element);
        }
        
        this.logInfo(`📁 Video/Image uploaded: ${file.name} (${this.formatFileSize(file.size)})`);
        this.validateFiles();
    }

    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.currentFiles.audio = file;
        this.audioFileName.textContent = file.name;
        
        // Show preview
        this.audioPreview.classList.remove('hidden');
        this.audioPlayer.src = URL.createObjectURL(file);
        
        this.logInfo(`🎵 Audio uploaded: ${file.name} (${this.formatFileSize(file.size)})`);
        this.validateFiles();
    }

    validateFiles() {
        const hasVideo = this.currentFiles.video !== null;
        const hasAudio = this.currentFiles.audio !== null;
        const canProcess = hasVideo && hasAudio && this.isConnected && !this.isProcessing;
        
        this.processBtn.disabled = !canProcess;
        
        if (canProcess) {
            this.processText.textContent = '🚀 Start Processing';
        } else if (!this.isConnected) {
            this.processText.textContent = '🔌 Connect First';
        } else if (!hasVideo || !hasAudio) {
            this.processText.textContent = '📁 Upload Files';
        } else if (this.isProcessing) {
            this.processText.textContent = '⏳ Processing...';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    initializeConnection() {
        this.updateConnectionStatus('connecting', 'Initializing...');
        setTimeout(() => {
            this.updateConnectionStatus('disconnected', 'Click Connect to start');
        }, 1000);
    }

    connect() {
        if (this.isConnected) return;
        
        this.updateConnectionStatus('connecting', 'Connecting...');
        this.logInfo('🔗 Attempting to connect to WebSocket...');
        
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/lip-sync`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected');
                this.updateButtons();
                this.logSuccess('✅ WebSocket connected successfully');
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected', 'Disconnected');
                this.updateButtons();
                this.logWarning('⚠️  WebSocket connection closed');
            };
            
            this.ws.onerror = (error) => {
                this.logError(`❌ WebSocket error: ${error.message || 'Connection failed'}`);
                this.updateConnectionStatus('disconnected', 'Connection failed');
            };
            
        } catch (error) {
            this.logError(`❌ Failed to create WebSocket: ${error.message}`);
            this.updateConnectionStatus('disconnected', 'Connection failed');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'Disconnected');
        this.updateButtons();
        this.logInfo('🔌 Disconnected from WebSocket');
    }

    updateConnectionStatus(status, text) {
        this.connectionText.textContent = text;
        
        // Update banner
        this.connectionBanner.className = 'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4';
        this.connectionDot.className = 'w-3 h-3 rounded-full mr-2';
        this.connectionIndicator.className = 'ml-auto w-3 h-3 rounded-full connection-indicator';
        
        switch (status) {
            case 'connected':
                this.connectionBanner.classList.add('bg-green-100', 'text-green-800');
                this.connectionDot.classList.add('bg-green-500');
                this.connectionIndicator.classList.add('bg-green-500');
                break;
            case 'connecting':
                this.connectionBanner.classList.add('bg-yellow-100', 'text-yellow-800');
                this.connectionDot.classList.add('bg-yellow-500');
                this.connectionIndicator.classList.add('bg-yellow-500');
                break;
            default:
                this.connectionBanner.classList.add('bg-gray-100', 'text-gray-700');
                this.connectionDot.classList.add('bg-gray-400');
                this.connectionIndicator.classList.add('bg-gray-400');
        }
    }

    updateButtons() {
        this.connectBtn.disabled = this.isConnected;
        this.disconnectBtn.disabled = !this.isConnected;
        this.pingBtn.disabled = !this.isConnected;
        this.cancelBtn.disabled = !this.isProcessing;
        this.validateFiles();
    }

    sendPing() {
        if (!this.isConnected) return;
        
        const message = {
            type: 'ping',
            timestamp: Date.now()
        };
        
        this.ws.send(JSON.stringify(message));
        this.logInfo('🏓 Ping sent');
    }

    async startProcessing() {
        if (!this.isConnected || this.isProcessing || !this.currentFiles.video || !this.currentFiles.audio) {
            return;
        }
        
        this.isProcessing = true;
        this.startTime = Date.now();
        this.updateButtons();
        this.showProgress();
        
        this.logInfo('🚀 Starting lip-sync processing...');
        this.startTimeText.textContent = new Date().toLocaleTimeString();
        
        try {
            // Convert files to base64
            this.updateProgress(10, 'Converting files to base64...');
            const audioBase64 = await this.fileToBase64(this.currentFiles.audio);
            
            this.updateProgress(20, 'Preparing image/video data...');
            const videoBase64 = await this.fileToBase64(this.currentFiles.video);
            
            this.updateProgress(30, 'Sending to AI model...');
            
            // Prepare processing options
            const options = {
                model_type: this.modelType.value,
                device: this.deviceType.value,
                audio_format: this.getFileExtension(this.currentFiles.audio.name),
                image_format: this.getFileExtension(this.currentFiles.video.name),
                pads: [
                    parseInt(this.padTop.value),
                    parseInt(this.padBottom.value),
                    parseInt(this.padLeft.value),
                    parseInt(this.padRight.value)
                ],
                resize_factor: parseInt(this.resizeFactor.value),
                face_det_batch_size: parseInt(this.faceBatchSize.value),
                static: this.staticMode.checked,
                nosmooth: this.noSmooth.checked
            };
            
            // Send processing request
            const message = {
                type: 'process',
                audio_base64: audioBase64.split(',')[1], // Remove data:type;base64, prefix
                image_base64: videoBase64.split(',')[1],
                options: options
            };
            
            this.ws.send(JSON.stringify(message));
            this.logInfo('📤 Processing request sent to server');
            
        } catch (error) {
            this.logError(`❌ Error starting processing: ${error.message}`);
            this.stopProcessing();
        }
    }

    cancelProcessing() {
        if (!this.isProcessing) return;
        
        const message = { type: 'cancel' };
        this.ws.send(JSON.stringify(message));
        this.logWarning('🛑 Cancellation request sent');
    }

    handleMessage(message) {
        switch (message.type) {
            case 'pong':
                this.logSuccess('🏓 Pong received');
                break;
                
            case 'progress':
                this.updateProgress(message.progress, message.message);
                this.processingStatus.textContent = message.message;
                break;
                
            case 'result':
                this.handleResult(message);
                break;
                
            case 'error':
                this.logError(`❌ Error: ${message.message}`);
                this.stopProcessing();
                break;
                
            case 'cancelled':
                this.logWarning('🛑 Processing cancelled');
                this.stopProcessing();
                break;
                
            default:
                this.logInfo(`📥 Received: ${JSON.stringify(message)}`);
        }
    }

    updateProgress(progress, message) {
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
            this.progressPercent.textContent = `${Math.round(progress)}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = message;
        }
    }

    showProgress() {
        this.progressSection.classList.remove('hidden');
        this.updateProgress(0, 'Initializing...');
        this.processSpinner.classList.remove('hidden');
        this.processText.textContent = '⏳ Processing...';
    }

    handleResult(message) {
        this.logSuccess('✅ Processing completed successfully!');
        this.stopProcessing();
        
        // Update progress to 100%
        this.updateProgress(100, 'Processing completed!');
        
        // Show results
        this.showResults(message);
        
        // Display metrics
        if (message.metrics) {
            this.processingTime.textContent = `${message.metrics.processing_time?.toFixed(1) || 0}s`;
            this.inferenceSpeed.textContent = `${message.metrics.inference_fps?.toFixed(1) || 0} FPS`;
            this.modelUsed.textContent = message.metrics.model_type || 'Unknown';
            this.videoSize.textContent = this.formatFileSize(message.video_base64?.length * 0.75 || 0);
        }
    }

    showResults(message) {
        // Show result section
        this.resultSection.classList.remove('hidden');
        
        // Set result video
        if (message.video_base64) {
            const videoBlob = this.base64ToBlob(message.video_base64, 'video/mp4');
            const videoUrl = URL.createObjectURL(videoBlob);
            this.resultVideo.src = videoUrl;
            
            // Store for download
            this.resultVideoBlob = videoBlob;
        }
        
        // Show original preview
        this.showOriginalPreview();
        
        // Scroll to results
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    showOriginalPreview() {
        if (this.currentFiles.video) {
            const isVideo = this.currentFiles.video.type.startsWith('video/');
            const element = document.createElement(isVideo ? 'video' : 'img');
            element.className = 'w-full rounded-lg';
            if (isVideo) {
                element.controls = true;
                element.muted = true;
            }
            element.src = URL.createObjectURL(this.currentFiles.video);
            
            this.originalPreview.innerHTML = '';
            this.originalPreview.appendChild(element);
        }
    }

    stopProcessing() {
        this.isProcessing = false;
        this.updateButtons();
        this.processSpinner.classList.add('hidden');
        this.processText.textContent = '🚀 Start Processing';
    }

    downloadResult() {
        if (this.resultVideoBlob) {
            const url = URL.createObjectURL(this.resultVideoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `illuminus_result_${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.logSuccess('📥 Result video downloaded');
        }
    }

    resetInterface() {
        // Reset files
        this.currentFiles = { video: null, audio: null };
        this.videoFile.value = '';
        this.audioFile.value = '';
        
        // Hide previews
        this.videoPreview.classList.add('hidden');
        this.audioPreview.classList.add('hidden');
        
        // Hide sections
        this.progressSection.classList.add('hidden');
        this.resultSection.classList.add('hidden');
        
        // Reset processing state
        this.stopProcessing();
        
        // Reset options to defaults
        this.modelType.value = 'nota_wav2lip';
        this.deviceType.value = 'auto';
        this.resizeFactor.value = '2';
        this.faceBatchSize.value = '8';
        this.padTop.value = '0';
        this.padBottom.value = '10';
        this.padLeft.value = '0';
        this.padRight.value = '0';
        this.staticMode.checked = false;
        this.noSmooth.checked = false;
        
        this.logInfo('🔄 Interface reset to default state');
    }

    // Utility functions
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    // Logging functions
    logInfo(message) {
        this.addLogEntry(message, 'info');
    }

    logSuccess(message) {
        this.addLogEntry(message, 'success');
    }

    logWarning(message) {
        this.addLogEntry(message, 'warning');
    }

    logError(message) {
        this.addLogEntry(message, 'error');
    }

    addLogEntry(message, type) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;
        
        this.log.appendChild(entry);
        this.log.scrollTop = this.log.scrollHeight;
        
        // Keep only last 100 entries
        while (this.log.children.length > 100) {
            this.log.removeChild(this.log.firstChild);
        }
    }

    clearLog() {
        this.log.innerHTML = '<div class="log-entry info">🌟 Log cleared - Ready for new session...</div>';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wsTestManager = new WebSocketTestManager();
}); 