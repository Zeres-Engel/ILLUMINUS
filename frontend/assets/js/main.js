/**
 * ILLUMINUS Wav2Lip - Main Interface with Cosmic Effects
 * Enhanced WebSocket API Integration
 * Author: Andrew (ngpthanh15@gmail.com)
 * Version: 2.0.0 - Cosmic Edition
 */

class CosmicWav2LipInterface {
    constructor() {
        this.wsMode = false; // WebSocket mode for real-time processing
        this.currentFiles = {
            video: null,
            audio: null
        };
        this.isProcessing = false;
        this.startTime = null;
        this.progressInterval = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeInterface();
        this.checkSystemStatus();
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
        this.setupDropZone(this.videoDropZone, this.videoFile, 'video/*,image/*');
        
        // Audio drop zone  
        this.setupDropZone(this.audioDropZone, this.audioFile, 'audio/*');
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
        if (acceptTypes.includes('video') && (file.type.startsWith('video/') || file.type.startsWith('image/'))) {
            this.setFileInput(fileInput, file);
        } else if (acceptTypes.includes('audio') && file.type.startsWith('audio/')) {
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
            const video = document.createElement('video');
            video.controls = true;
            video.muted = true;
            video.className = 'w-full rounded-lg file-preview-cosmic';
            video.src = URL.createObjectURL(file);
            
            this.videoPreviewContainer.innerHTML = '';
            this.videoPreviewContainer.appendChild(video);
            
            this.showToast(`🎬 Video uploaded: ${file.name} (${this.formatFileSize(file.size)})`, 'success');
        } else if (isImage) {
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
        const file = event.target.files[0];
        if (!file) return;
        
        this.currentFiles.audio = file;
        this.audioFileName.textContent = file.name;
        this.audioPreview.classList.remove('hidden');
        this.audioPlayer.src = URL.createObjectURL(file);
        
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
            // Use WebSocket for real-time processing if available
            if (this.wsMode) {
                await this.processWithWebSocket();
            } else {
                await this.processWithREST();
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.showToast(`❌ Processing failed: ${error.message}`, 'error');
            this.stopProcessing();
        }
    }

    async processWithREST() {
        const formData = new FormData();
        formData.append('video', this.currentFiles.video);
        formData.append('audio', this.currentFiles.audio);
        formData.append('model', this.modelType.value);
        formData.append('device', this.deviceType.value);
        
        // Advanced options
        formData.append('face_det_batch_size', this.faceBatchSize.value);
        formData.append('pads_top', this.padTop.value);
        formData.append('pads_bottom', this.padBottom.value);
        formData.append('pads_left', this.padLeft.value);
        formData.append('pads_right', this.padRight.value);
        formData.append('resize_factor', this.resizeFactor.value);
        formData.append('static', this.staticMode.checked);
        formData.append('nosmooth', this.noSmooth.checked);
        
        this.updateProgress(20, 'Uploading files to cosmic server...');
        
        const response = await fetch('/generate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail?.error || 'Server error');
        }
        
        this.updateProgress(50, 'Processing with cosmic AI...');
        
        // Simulate progress for REST API
        this.startProgressSimulation();
        
        const result = await response.json();
        this.handleResult(result);
    }

    async processWithWebSocket() {
        // Convert files to base64
        this.updateProgress(10, 'Converting files to base64...');
        const audioBase64 = await this.fileToBase64(this.currentFiles.audio);
        const videoBase64 = await this.fileToBase64(this.currentFiles.video);
        
        this.updateProgress(30, 'Connecting to cosmic WebSocket...');
        
        // WebSocket processing would go here
        // For now, fallback to REST
        await this.processWithREST();
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
        
        // Set original video
        if (this.currentFiles.video) {
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
        if (this.downloadUrl) {
            const a = document.createElement('a');
            a.href = this.downloadUrl;
            a.download = `illuminus_cosmic_result_${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            this.showToast('📥 Cosmic video downloaded!', 'success');
        }
    }

    resetInterface() {
        // Reset files
        this.currentFiles = { video: null, audio: null };
        this.videoFile.value = '';
        this.audioFile.value = '';
        
        // Hide previews and sections
        this.videoPreview.classList.add('hidden');
        this.audioPreview.classList.add('hidden');
        this.progressSection.classList.add('hidden');
        this.resultSection.classList.add('hidden');
        
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
            
            // Check WebSocket support
            this.wsMode = false; // Set to true when WebSocket is fully implemented
            
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