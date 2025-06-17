/**
 * UI Manager - Quản lý giao diện người dùng và DOM elements
 * ILLUMINUS Wav2Lip UI Management
 */
class UIManager {
    constructor() {
        this.elements = {};
        this.isProcessing = false;
        this.progressInterval = null;
        this.eventListeners = new Map();
    }

    /**
     * Initialize tất cả DOM elements
     */
    initializeElements() {
        // Status elements
        this.elements.statusIndicator = document.getElementById('statusIndicator');
        this.elements.statusText = document.getElementById('statusText');
        this.elements.gpuStatus = document.getElementById('gpuStatus');
        
        // File upload elements
        this.elements.videoFile = document.getElementById('videoFile');
        this.elements.audioFile = document.getElementById('audioFile');
        this.elements.videoDropZone = document.getElementById('videoDropZone');
        this.elements.audioDropZone = document.getElementById('audioDropZone');
        this.elements.videoPreview = document.getElementById('videoPreview');
        this.elements.audioPreview = document.getElementById('audioPreview');
        this.elements.videoFileName = document.getElementById('videoFileName');
        this.elements.audioFileName = document.getElementById('audioFileName');
        this.elements.videoPreviewContainer = document.getElementById('videoPreviewContainer');
        this.elements.audioPlayer = document.getElementById('audioPlayer');
        
        // Configuration elements
        this.elements.modelType = document.getElementById('modelType');
        this.elements.deviceType = document.getElementById('deviceType');
        this.elements.resizeFactor = document.getElementById('resizeFactor');
        this.elements.faceBatchSize = document.getElementById('faceBatchSize');
        this.elements.padTop = document.getElementById('padTop');
        this.elements.padBottom = document.getElementById('padBottom');
        this.elements.padLeft = document.getElementById('padLeft');
        this.elements.padRight = document.getElementById('padRight');
        this.elements.staticMode = document.getElementById('staticMode');
        this.elements.noSmooth = document.getElementById('noSmooth');
        
        // Advanced options
        this.elements.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.elements.advancedOptions = document.getElementById('advancedOptions');
        this.elements.advancedIcon = document.getElementById('advancedIcon');
        
        // Control elements
        this.elements.generateBtn = document.getElementById('generateBtn');
        this.elements.generateText = document.getElementById('generateText');
        this.elements.loadingSpinner = document.getElementById('loadingSpinner');
        
        // Progress elements
        this.elements.progressSection = document.getElementById('progressSection');
        this.elements.progressBar = document.getElementById('progressBar');
        this.elements.progressText = document.getElementById('progressText');
        this.elements.progressPercent = document.getElementById('progressPercent');
        this.elements.processingTime = document.getElementById('processingTime');
        this.elements.framesProcessed = document.getElementById('framesProcessed');
        this.elements.inferenceSpeed = document.getElementById('inferenceSpeed');
        this.elements.deviceUsed = document.getElementById('deviceUsed');
        
        // Result elements
        this.elements.resultSection = document.getElementById('resultSection');
        this.elements.originalVideo = document.getElementById('originalVideo');
        this.elements.originalImage = document.getElementById('originalImage');
        this.elements.originalTitle = document.getElementById('originalTitle');
        this.elements.originalMediaContainer = document.getElementById('originalMediaContainer');
        this.elements.resultVideo = document.getElementById('resultVideo');
        this.elements.downloadBtn = document.getElementById('downloadBtn');
        this.elements.newVideoBtn = document.getElementById('newVideoBtn');

        return this.elements;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners(callbacks = {}) {
        // Advanced options toggle
        if (this.elements.toggleAdvanced) {
            this.addEventListenerWithCallback(
                this.elements.toggleAdvanced, 
                'click', 
                () => this.toggleAdvancedOptions()
            );
        }

        // Generate button
        if (this.elements.generateBtn && callbacks.onGenerate) {
            this.addEventListenerWithCallback(
                this.elements.generateBtn, 
                'click', 
                callbacks.onGenerate
            );
        }

        // Result buttons
        if (this.elements.downloadBtn && callbacks.onDownload) {
            this.addEventListenerWithCallback(
                this.elements.downloadBtn, 
                'click', 
                callbacks.onDownload
            );
        }

        if (this.elements.newVideoBtn && callbacks.onNewVideo) {
            this.addEventListenerWithCallback(
                this.elements.newVideoBtn, 
                'click', 
                callbacks.onNewVideo
            );
        }

        // File input changes
        if (this.elements.videoFile && callbacks.onVideoChange) {
            this.addEventListenerWithCallback(
                this.elements.videoFile, 
                'change', 
                callbacks.onVideoChange
            );
        }

        if (this.elements.audioFile && callbacks.onAudioChange) {
            this.addEventListenerWithCallback(
                this.elements.audioFile, 
                'change', 
                callbacks.onAudioChange
            );
        }
    }

    /**
     * Add event listener và theo dõi để cleanup
     */
    addEventListenerWithCallback(element, event, callback) {
        if (!element) return;
        
        element.addEventListener(event, callback);
        
        // Store để cleanup sau
        const key = `${element.id || 'unknown'}-${event}`;
        this.eventListeners.set(key, { element, event, callback });
    }

    /**
     * Toggle advanced options
     */
    toggleAdvancedOptions() {
        if (!this.elements.advancedOptions || !this.elements.advancedIcon) return;
        
        const isVisible = this.elements.advancedOptions.classList.contains('show');
        
        if (isVisible) {
            this.elements.advancedOptions.classList.remove('show');
            this.elements.advancedIcon.style.transform = 'rotate(0deg)';
        } else {
            this.elements.advancedOptions.classList.add('show');
            this.elements.advancedIcon.style.transform = 'rotate(180deg)';
        }
    }

    /**
     * Update status indicator và text
     */
    updateStatus(type, message) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = message;
        }
        
        // Update indicator
        if (this.elements.statusIndicator) {
            this.elements.statusIndicator.className = 'status-indicator';
            switch (type) {
                case 'ready':
                    this.elements.statusIndicator.classList.add('status-ready');
                    break;
                case 'processing':
                    this.elements.statusIndicator.classList.add('status-processing');
                    break;
                case 'complete':
                    this.elements.statusIndicator.classList.add('status-complete');
                    break;
                case 'error':
                    this.elements.statusIndicator.classList.add('status-error');
                    break;
            }
        }
    }

    /**
     * Update GPU status
     */
    updateGPUStatus(gpuAvailable, gpuCount) {
        if (!this.elements.gpuStatus) return;
        
        if (gpuAvailable && gpuCount > 0) {
            this.elements.gpuStatus.textContent = `${gpuCount} GPU(s) Available`;
            this.elements.gpuStatus.className = 'text-green-400 text-sm md:text-base';
        } else {
            this.elements.gpuStatus.textContent = 'CPU Only';
            this.elements.gpuStatus.className = 'text-yellow-400 text-sm md:text-base';
        }
    }

    /**
     * Validate inputs và update UI
     */
    validateInputs(hasVideo, hasAudio, isProcessing) {
        const canProcess = hasVideo && hasAudio && !isProcessing;
        
        if (this.elements.generateBtn) {
            this.elements.generateBtn.disabled = !canProcess;
        }
        
        if (this.elements.generateText) {
            if (canProcess) {
                this.elements.generateText.textContent = '🚀 Generate Cosmic Video';
                this.updateStatus('ready', '🚀 Ready for Cosmic Processing');
            } else if (!hasVideo || !hasAudio) {
                this.elements.generateText.textContent = '📁 Upload Files First';
                this.updateStatus('ready', '📁 Upload video and audio files');
            } else if (isProcessing) {
                this.elements.generateText.textContent = '⏳ Processing...';
                this.updateStatus('processing', '⚡ Cosmic AI Processing...');
            }
        }
    }

    /**
     * Show file preview
     */
    showFilePreview(type, fileName, previewElement) {
        if (type === 'video') {
            if (this.elements.videoFileName) {
                this.elements.videoFileName.textContent = fileName;
            }
            if (this.elements.videoPreview) {
                this.elements.videoPreview.classList.remove('hidden');
            }
            if (this.elements.videoPreviewContainer && previewElement) {
                this.elements.videoPreviewContainer.innerHTML = '';
                this.elements.videoPreviewContainer.appendChild(previewElement);
            }
        } else if (type === 'audio') {
            if (this.elements.audioFileName) {
                this.elements.audioFileName.textContent = fileName;
            }
            if (this.elements.audioPreview) {
                this.elements.audioPreview.classList.remove('hidden');
            }
            if (this.elements.audioPlayer && previewElement) {
                this.elements.audioPlayer.src = previewElement.src;
            }
        }
    }

    /**
     * Show progress section
     */
    showProgress() {
        if (this.elements.progressSection) {
            this.elements.progressSection.classList.remove('hidden');
            this.elements.progressSection.scrollIntoView({ behavior: 'smooth' });
        }
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.classList.remove('hidden');
        }
        this.updateProgress(0, 'Initializing cosmic algorithms...');
    }

    /**
     * Update progress bar và text
     */
    updateProgress(percent, message) {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percent}%`;
        }
        if (this.elements.progressPercent) {
            this.elements.progressPercent.textContent = `${Math.round(percent)}%`;
        }
        if (this.elements.progressText) {
            this.elements.progressText.textContent = message;
        }
    }

    /**
     * Update processing metrics
     */
    updateMetrics(metrics) {
        if (metrics.processing_time && this.elements.processingTime) {
            this.elements.processingTime.textContent = `${metrics.processing_time.toFixed(1)}s`;
        }
        if (metrics.frames_processed && this.elements.framesProcessed) {
            this.elements.framesProcessed.textContent = metrics.frames_processed;
        }
        if (metrics.inference_fps && this.elements.inferenceSpeed) {
            this.elements.inferenceSpeed.textContent = `${metrics.inference_fps.toFixed(1)}`;
        }
        if (metrics.device && this.elements.deviceUsed) {
            this.elements.deviceUsed.textContent = metrics.device.toUpperCase();
        }
    }

    /**
     * Show result section
     */
    showResult(result, videoType) {
        if (!this.elements.resultSection) return;
        
        this.elements.resultSection.classList.remove('hidden');
        
        // Update title và display dựa trên file type
        if (videoType === 'image') {
            if (this.elements.originalTitle) {
                this.elements.originalTitle.textContent = '🖼️ Original Image';
            }
            if (this.elements.originalVideo) {
                this.elements.originalVideo.classList.add('hidden');
            }
            if (this.elements.originalImage) {
                this.elements.originalImage.classList.remove('hidden');
                this.elements.originalImage.src = result.originalSrc;
            }
        } else {
            if (this.elements.originalTitle) {
                this.elements.originalTitle.textContent = '📥 Original Video';
            }
            if (this.elements.originalImage) {
                this.elements.originalImage.classList.add('hidden');
            }
            if (this.elements.originalVideo) {
                this.elements.originalVideo.classList.remove('hidden');
                this.elements.originalVideo.src = result.originalSrc;
            }
        }
        
        // Set result video
        if (result.video_url && this.elements.resultVideo) {
            this.elements.resultVideo.src = result.video_url;
        }
        
        // Scroll to results
        this.elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Stop processing UI
     */
    stopProcessing() {
        this.isProcessing = false;
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.classList.add('hidden');
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    /**
     * Reset interface
     */
    resetInterface() {
        // Hide previews và sections
        if (this.elements.videoPreview) {
            this.elements.videoPreview.classList.add('hidden');
        }
        if (this.elements.audioPreview) {
            this.elements.audioPreview.classList.add('hidden');
        }
        if (this.elements.progressSection) {
            this.elements.progressSection.classList.add('hidden');
        }
        if (this.elements.resultSection) {
            this.elements.resultSection.classList.add('hidden');
        }
        
        // Reset file inputs
        if (this.elements.videoFile) {
            this.elements.videoFile.value = '';
        }
        if (this.elements.audioFile) {
            this.elements.audioFile.value = '';
        }
        
        // Reset original media display
        if (this.elements.originalTitle) {
            this.elements.originalTitle.textContent = '📥 Original Video';
        }
        if (this.elements.originalVideo) {
            this.elements.originalVideo.classList.remove('hidden');
        }
        if (this.elements.originalImage) {
            this.elements.originalImage.classList.add('hidden');
        }
        
        // Reset processing state
        this.stopProcessing();
        
        // Reset status
        this.updateStatus('ready', '🚀 Ready for new cosmic processing');
    }

    /**
     * Get configuration từ UI
     */
    getConfiguration() {
        return {
            model_type: this.elements.modelType?.value === 'original' ? 'wav2lip' : 'nota_wav2lip',
            device: this.elements.deviceType?.value || 'auto',
            pads: [
                parseInt(this.elements.padTop?.value || '0'),
                parseInt(this.elements.padBottom?.value || '10'),
                parseInt(this.elements.padLeft?.value || '0'),
                parseInt(this.elements.padRight?.value || '0')
            ],
            resize_factor: parseInt(this.elements.resizeFactor?.value || '1'),
            face_det_batch_size: parseInt(this.elements.faceBatchSize?.value || '16'),
            static: this.elements.staticMode?.checked || false,
            nosmooth: this.elements.noSmooth?.checked || false
        };
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        this.eventListeners.forEach(({ element, event, callback }) => {
            element.removeEventListener(event, callback);
        });
        this.eventListeners.clear();
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }
}

export default UIManager; 