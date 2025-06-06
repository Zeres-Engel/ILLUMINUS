/**
 * ILLUMINUS Wav2Lip - Main Interface with Cosmic Effects
 * Enhanced WebSocket API Integration
 * Author: Andrew (ngpthanh15@gmail.com)
 * Version: 2.0.0 - Cosmic Edition
 */

class CosmicWav2LipInterface {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.wsMode = true; // Enable WebSocket mode by default
        this.currentFiles = {
            video: null,
            audio: null,
            videoType: 'video' // 'video' or 'image'
        };
        this.isProcessing = false;
        this.startTime = null;
        this.progressInterval = null;
        
            this.initializeElements();
        this.setupEventListeners();
        this.initializeInterface();
        this.checkSystemStatus();
        this.initializeWebSocket();
    }

    initializeElements() {
        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.gpuStatus = document.getElementById('gpuStatus');
        
        // File upload elements
        this.videoFile = document.getElementById('videoFile');
        this.audioFile = document.getElementById('audioFile');
        this.videoDropZone = document.getElementById('videoDropZone');
        this.audioDropZone = document.getElementById('audioDropZone');
        this.videoPreview = document.getElementById('videoPreview');
        this.audioPreview = document.getElementById('audioPreview');
        this.videoFileName = document.getElementById('videoFileName');
        this.audioFileName = document.getElementById('audioFileName');
        this.videoPreviewContainer = document.getElementById('videoPreviewContainer');
        this.audioPlayer = document.getElementById('audioPlayer');
        
        // Debug: Check if audio elements exist
        console.log('Audio elements check:', {
            audioFile: this.audioFile,
            audioDropZone: this.audioDropZone,
            audioPreview: this.audioPreview,
            audioFileName: this.audioFileName,
            audioPlayer: this.audioPlayer
        });
        
        // Configuration elements
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
        
        // Advanced options
        this.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.advancedOptions = document.getElementById('advancedOptions');
        this.advancedIcon = document.getElementById('advancedIcon');
        
        // Control elements
        this.generateBtn = document.getElementById('generateBtn');
        this.generateText = document.getElementById('generateText');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        this.processingTime = document.getElementById('processingTime');
        this.framesProcessed = document.getElementById('framesProcessed');
        this.inferenceSpeed = document.getElementById('inferenceSpeed');
        this.deviceUsed = document.getElementById('deviceUsed');
        
        // Result elements
        this.resultSection = document.getElementById('resultSection');
        this.originalVideo = document.getElementById('originalVideo');
        this.originalImage = document.getElementById('originalImage');
        this.originalTitle = document.getElementById('originalTitle');
        this.originalMediaContainer = document.getElementById('originalMediaContainer');
        this.resultVideo = document.getElementById('resultVideo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newVideoBtn = document.getElementById('newVideoBtn');
    }

    setupEventListeners() {
        // File upload listeners
        this.videoFile.addEventListener('change', (e) => this.handleVideoUpload(e));
        this.audioFile.addEventListener('change', (e) => this.handleAudioUpload(e));
        
        // Drag and drop
        this.setupDragAndDrop();
        
        // Advanced options toggle
        this.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedOptions());
        
        // Generate button
        this.generateBtn.addEventListener('click', () => this.startGeneration());
        
        // Result buttons
        this.downloadBtn?.addEventListener('click', () => this.downloadResult());
        this.newVideoBtn?.addEventListener('click', () => this.resetInterface());
        
        // File validation on input change
        this.videoFile.addEventListener('change', () => this.validateInputs());
        this.audioFile.addEventListener('change', () => this.validateInputs());
    }

    setupDragAndDrop() {
        // Video/Image drop zone
        this.setupDropZone(this.videoDropZone, this.videoFile, ['video', 'image']);
        
        // Audio drop zone  
        this.setupDropZone(this.audioDropZone, this.audioFile, ['audio']);
    }

    setupDropZone(dropZone, fileInput, acceptTypes) {
        if (!dropZone || !fileInput) return;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                
                // Check file type
                const isValidFile = acceptTypes.some(type => {
                    if (type === 'video') return file.type.startsWith('video/');
                    if (type === 'image') return file.type.startsWith('image/');
                    if (type === 'audio') return file.type.startsWith('audio/');
                    return false;
                });
                
                if (isValidFile) {
                    this.setFileInput(fileInput, file);
                } else {
                    this.showToast('❌ Invalid file type. Please select the correct file format.', 'error');
                }
            }
        });
    }

    setFileInput(input, file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change'));
    }

    toggleAdvancedOptions() {
        const isVisible = this.advancedOptions.classList.contains('show');
        
        if (isVisible) {
            this.advancedOptions.classList.remove('show');
            this.advancedIcon.style.transform = 'rotate(0deg)';
        } else {
            this.advancedOptions.classList.add('show');
            this.advancedIcon.style.transform = 'rotate(180deg)';
        }
    }

    handleVideoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.currentFiles.video = file;
        this.videoFileName.textContent = file.name;
        this.videoPreview.classList.remove('hidden');
        
        // Create preview based on file type
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        
        if (isVideo) {
            this.currentFiles.videoType = 'video';
            const video = document.createElement('video');
            video.controls = true;
            video.muted = true;
            video.className = 'w-full rounded-lg file-preview-cosmic';
            video.src = URL.createObjectURL(file);
            
            this.videoPreviewContainer.innerHTML = '';
            this.videoPreviewContainer.appendChild(video);
            
            this.showToast(`🎬 Video uploaded: ${file.name} (${this.formatFileSize(file.size)})`, 'success');
        } else if (isImage) {
            this.currentFiles.videoType = 'image';
            const img = document.createElement('img');
            img.className = 'w-full rounded-lg file-preview-cosmic';
            img.src = URL.createObjectURL(file);
            
            this.videoPreviewContainer.innerHTML = '';
            this.videoPreviewContainer.appendChild(img);
            
            this.showToast(`🖼️ Image uploaded: ${file.name} (${this.formatFileSize(file.size)})`, 'success');
        }
        
        this.validateInputs();
    }

    handleAudioUpload(event) {
        console.log('Audio upload event triggered:', event);
        const file = event.target.files[0];
        console.log('Audio file selected:', file);
        
        if (!file) return;
        
        this.currentFiles.audio = file;
        this.audioFileName.textContent = file.name;
        this.audioPreview.classList.remove('hidden');
        this.audioPlayer.src = URL.createObjectURL(file);
        
        console.log('Audio file uploaded successfully:', file.name, file.size);
        this.showToast(`🎵 Audio uploaded: ${file.name} (${this.formatFileSize(file.size)})`, 'success');
        this.validateInputs();
    }

    validateInputs() {
        const hasVideo = this.currentFiles.video !== null;
        const hasAudio = this.currentFiles.audio !== null;
        const canProcess = hasVideo && hasAudio && !this.isProcessing;
        
        this.generateBtn.disabled = !canProcess;
        
        if (canProcess) {
            this.generateText.textContent = '🚀 Generate Cosmic Video';
            this.updateStatus('ready', '🚀 Ready for Cosmic Processing');
        } else if (!hasVideo || !hasAudio) {
            this.generateText.textContent = '📁 Upload Files First';
            this.updateStatus('ready', '📁 Upload video and audio files');
        } else if (this.isProcessing) {
            this.generateText.textContent = '⏳ Processing...';
            this.updateStatus('processing', '⚡ Cosmic AI Processing...');
        }
    }

    async startGeneration() {
        if (!this.currentFiles.video || !this.currentFiles.audio || this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        this.startTime = Date.now();
        this.validateInputs();
        this.showProgress();
        
        try {
            // Always use WebSocket for assignment compliance
            await this.processWithWebSocket();
        } catch (error) {
            console.error('Processing error:', error);
            this.showToast(`❌ Processing failed: ${error.message}`, 'error');
            this.stopProcessing();
        }
    }

    async processWithREST() {
        // This method is deprecated - assignment requires WebSocket only
        this.showToast('⚠️ REST API is deprecated. Using WebSocket instead...', 'warning');
        await this.processWithWebSocket();
    }

    async processWithWebSocket() {
        if (!this.isConnected) {
            // Auto-connect if not connected
            await this.connectWebSocket();
        }
        
        if (!this.isConnected) {
            throw new Error('WebSocket connection failed');
        }
        
        // Convert files to base64
        this.updateProgress(10, 'Converting files to base64...');
        const audioBase64 = await this.fileToBase64(this.currentFiles.audio);
        const videoBase64 = await this.fileToBase64(this.currentFiles.video);
        
        this.updateProgress(30, 'Sending to cosmic AI via WebSocket...');
        
        // Prepare processing options (assignment compliant)
        const options = {
            model_type: this.modelType.value === 'original' ? 'wav2lip' : 'nota_wav2lip',
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
        
        // Send processing request (assignment format)
        const message = {
            type: 'process',
            audio_base64: audioBase64.split(',')[1], // Remove data:type;base64, prefix
            image_base64: videoBase64.split(',')[1],  // Remove data:type;base64, prefix
            options: options
        };
        
        this.ws.send(JSON.stringify(message));
        this.updateProgress(40, 'Processing request sent to cosmic AI...');
    }

    initializeWebSocket() {
        this.connectWebSocket();
    }

    async connectWebSocket() {
        if (this.isConnected) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws/lip-sync`;
                
                this.ws = new WebSocket(wsUrl);
                
                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.updateStatus('ready', '🚀 WebSocket Connected - Ready for cosmic processing');
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleWebSocketMessage(JSON.parse(event.data));
                };
                
                this.ws.onclose = () => {
                    this.isConnected = false;
                    this.updateStatus('error', '⚠️ WebSocket disconnected');
                };
                
                this.ws.onerror = (error) => {
                    this.isConnected = false;
                    this.updateStatus('error', '❌ WebSocket connection failed');
                    reject(new Error('WebSocket connection failed'));
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'progress':
                this.updateProgress(message.progress || 50, message.message || 'Processing...');
                if (message.metrics) {
                    // Update real-time metrics
                    if (message.metrics.processing_time) {
                        this.processingTime.textContent = `${message.metrics.processing_time.toFixed(1)}s`;
                    }
                    if (message.metrics.frames_processed) {
                        this.framesProcessed.textContent = message.metrics.frames_processed;
                    }
                    if (message.metrics.inference_fps) {
                        this.inferenceSpeed.textContent = `${message.metrics.inference_fps.toFixed(1)}`;
                    }
                    if (message.metrics.device) {
                        this.deviceUsed.textContent = message.metrics.device.toUpperCase();
                    }
                }
                break;
                
            case 'result':
                this.handleWebSocketResult(message);
                break;
                
            case 'error':
                this.showToast(`❌ Processing error: ${message.message}`, 'error');
                this.stopProcessing();
                break;
                
            case 'cancelled':
                this.showToast('🛑 Processing cancelled', 'warning');
                this.stopProcessing();
                break;
                
            default:
                console.log('WebSocket message:', message);
        }
    }

    handleWebSocketResult(message) {
        this.stopProcessing();
        this.updateProgress(100, 'Cosmic processing complete! ✨');
        
        // Create video from base64 (assignment requirement)
        if (message.video_base64) {
            const videoBlob = this.base64ToBlob(message.video_base64, 'video/mp4');
            const videoUrl = URL.createObjectURL(videoBlob);
            
            // Store for download
            this.downloadUrl = videoUrl;
            this.resultVideoBlob = videoBlob;
            
            // Show result using WebSocket data
            const result = {
                video_url: videoUrl,
                total_processing_time: message.metrics?.processing_time || 0,
                inference_fps: message.metrics?.inference_fps || 0,
                frames_processed: message.metrics?.frames_processed || 0,
                model_type: message.metrics?.model_type || 'Unknown'
            };
            
            this.showResult(result);
            this.showToast('✨ Cosmic video generated successfully via WebSocket!', 'success');
        }
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

    startProgressSimulation() {
        let progress = 50;
        this.progressInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 95) {
                progress = 95;
                clearInterval(this.progressInterval);
            }
            this.updateProgress(progress, 'Cosmic AI processing frames...');
            
            // Update metrics
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.processingTime.textContent = `${elapsed.toFixed(1)}s`;
            this.framesProcessed.textContent = Math.floor(elapsed * 24); // Simulate 24 FPS
            this.inferenceSpeed.textContent = `${(Math.random() * 30 + 10).toFixed(1)}`;
            this.deviceUsed.textContent = this.deviceType.value.toUpperCase();
        }, 500);
    }

    updateProgress(percent, message) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.progressPercent) {
            this.progressPercent.textContent = `${Math.round(percent)}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = message;
        }
    }

    showProgress() {
        this.progressSection.classList.remove('hidden');
        this.updateProgress(0, 'Initializing cosmic algorithms...');
        this.loadingSpinner.classList.remove('hidden');
        
        // Scroll to progress section
        this.progressSection.scrollIntoView({ behavior: 'smooth' });
    }

    handleResult(result) {
        this.stopProcessing();
        this.updateProgress(100, 'Cosmic processing complete! ✨');
        
        // Update final metrics
        if (result.total_processing_time) {
            this.processingTime.textContent = `${result.total_processing_time.toFixed(1)}s`;
        }
        if (result.inference_fps) {
            this.inferenceSpeed.textContent = `${result.inference_fps.toFixed(1)}`;
        }
        if (result.frames_processed) {
            this.framesProcessed.textContent = result.frames_processed;
        }
        
        // Show results
        this.showResult(result);
        this.showToast('✨ Cosmic video generated successfully!', 'success');
    }

    showResult(result) {
        this.resultSection.classList.remove('hidden');
        
        // Update title and display based on file type
        if (this.currentFiles.videoType === 'image') {
            this.originalTitle.textContent = '🖼️ Original Image';
            this.originalVideo.classList.add('hidden');
            this.originalImage.classList.remove('hidden');
            this.originalImage.src = URL.createObjectURL(this.currentFiles.video);
        } else {
            this.originalTitle.textContent = '📥 Original Video';
            this.originalImage.classList.add('hidden');
            this.originalVideo.classList.remove('hidden');
            this.originalVideo.src = URL.createObjectURL(this.currentFiles.video);
        }
        
        // Set result video
        if (result.video_url) {
            this.resultVideo.src = result.video_url;
        }
        
        // Store download URL
        this.downloadUrl = result.video_url;
        
        // Scroll to results
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    stopProcessing() {
        this.isProcessing = false;
        this.loadingSpinner.classList.add('hidden');
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        this.validateInputs();
    }

    downloadResult() {
        if (this.downloadUrl || this.resultVideoBlob) {
            const url = this.downloadUrl || URL.createObjectURL(this.resultVideoBlob);
        const a = document.createElement('a');
            a.href = url;
            a.download = `illuminus_cosmic_result_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
            // Clean up if we created a temporary URL
            if (this.resultVideoBlob && !this.downloadUrl) {
                URL.revokeObjectURL(url);
            }
            
            this.showToast('📥 Cosmic video downloaded!', 'success');
        }
    }

    resetInterface() {
        // Reset files
        this.currentFiles = { video: null, audio: null, videoType: 'video' };
        this.videoFile.value = '';
        this.audioFile.value = '';
        
        // Hide previews and sections
        this.videoPreview.classList.add('hidden');
        this.audioPreview.classList.add('hidden');
        this.progressSection.classList.add('hidden');
        this.resultSection.classList.add('hidden');
        
        // Reset original media display
        this.originalTitle.textContent = '📥 Original Video';
        this.originalVideo.classList.remove('hidden');
        this.originalImage.classList.add('hidden');
        
        // Reset processing state
        this.stopProcessing();
        
        // Reset status
        this.updateStatus('ready', '🚀 Ready for new cosmic processing');
        
        this.showToast('🔄 Interface reset - Ready for new cosmic video!', 'info');
    }

    updateStatus(type, message) {
        this.statusText.textContent = message;
        
        // Update indicator
        this.statusIndicator.className = 'status-indicator';
        switch (type) {
            case 'ready':
                this.statusIndicator.classList.add('status-ready');
                break;
            case 'processing':
                this.statusIndicator.classList.add('status-processing');
                break;
            case 'complete':
                this.statusIndicator.classList.add('status-complete');
                break;
            case 'error':
                this.statusIndicator.classList.add('status-error');
                break;
        }
    }

    async checkSystemStatus() {
        try {
            const response = await fetch('/health');
            const status = await response.json();
            
            // Update GPU status
            if (status.gpu_available) {
                this.gpuStatus.textContent = `${status.gpu_count} GPU(s) Available`;
                this.gpuStatus.className = 'text-green-400 text-sm md:text-base';
            } else {
                this.gpuStatus.textContent = 'CPU Only';
                this.gpuStatus.className = 'text-yellow-400 text-sm md:text-base';
            }
            
            // WebSocket is always enabled for assignment compliance
            console.log('System status:', status);
            
        } catch (error) {
            console.error('System status check failed:', error);
            this.gpuStatus.textContent = 'Unknown';
            this.gpuStatus.className = 'text-red-400 text-sm md:text-base';
        }
    }

    initializeInterface() {
        this.updateStatus('ready', '🚀 Cosmic AI System Initialized');
        this.validateInputs();
        
        // Add some cosmic sparkle effects
        this.addCosmicEffects();
        
        // Setup back to top button
        this.setupBackToTop();
    }

    addCosmicEffects() {
        // Add hover effects to cards
        document.querySelectorAll('.cosmic-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    setupBackToTop() {
        const backToTop = document.getElementById('backToTop');
        if (!backToTop) return;

        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.remove('hidden');
            } else {
                backToTop.classList.add('hidden');
            }
        });

        // Smooth scroll to top
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full`;
        
        // Set color based on type
        switch (type) {
            case 'success':
                toast.classList.add('bg-green-500');
                break;
            case 'error':
                toast.classList.add('bg-red-500');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500');
                break;
            default:
                toast.classList.add('bg-blue-500');
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 4000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cosmicInterface = new CosmicWav2LipInterface();
}); 