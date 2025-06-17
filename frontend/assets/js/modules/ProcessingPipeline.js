/**
 * Processing Pipeline - Quản lý processing logic và result handling
 * ILLUMINUS Wav2Lip Processing Management
 */
class ProcessingPipeline {
    constructor(wsManager, fileManager, uiManager) {
        this.wsManager = wsManager;
        this.fileManager = fileManager;
        this.uiManager = uiManager;
        this.isProcessing = false;
        this.startTime = null;
        this.downloadUrl = null;
        this.resultVideoBlob = null;
        
        this.setupWebSocketHandlers();
    }

    /**
     * Setup WebSocket message handlers
     */
    setupWebSocketHandlers() {
        this.wsManager.onMessage('progress', (message) => {
            this.handleProgressMessage(message);
        });

        this.wsManager.onMessage('result', (message) => {
            this.handleResultMessage(message);
        });

        this.wsManager.onMessage('error', (message) => {
            this.handleErrorMessage(message);
        });

        this.wsManager.onMessage('cancelled', (message) => {
            this.handleCancelledMessage(message);
        });
    }

    /**
     * Start processing
     */
    async startProcessing() {
        if (this.isProcessing) {
            throw new Error('Processing already in progress');
        }

        const files = this.fileManager.getFiles();
        if (!files.video || !files.audio) {
            throw new Error('Missing required files');
        }

        this.isProcessing = true;
        this.startTime = Date.now();
        
        try {
            // Ensure WebSocket connection
            if (!this.wsManager.isReady()) {
                this.uiManager.updateProgress(5, 'Connecting to server...');
                await this.wsManager.connect();
            }

            // Process via WebSocket
            await this.processWithWebSocket();
            
        } catch (error) {
            this.isProcessing = false;
            throw error;
        }
    }

    /**
     * Process với WebSocket
     */
    async processWithWebSocket() {
        const files = this.fileManager.getFiles();
        
        // Convert files to base64
        this.uiManager.updateProgress(10, 'Converting files to base64...');
        const audioBase64 = await this.fileManager.fileToBase64(files.audio);
        const videoBase64 = await this.fileManager.fileToBase64(files.video);
        
        this.uiManager.updateProgress(30, 'Sending to cosmic AI via WebSocket...');
        
        // Get configuration từ UI
        const options = this.uiManager.getConfiguration();
        
        // Add file format info
        options.audio_format = this.fileManager.getFileExtension(files.audio.name);
        options.image_format = this.fileManager.getFileExtension(files.video.name);
        
        // Prepare processing message
        const message = {
            type: 'process',
            audio_base64: audioBase64.split(',')[1], // Remove data:type;base64, prefix
            image_base64: videoBase64.split(',')[1],  // Remove data:type;base64, prefix
            options: options
        };
        
        // Send processing request
        this.wsManager.send(message);
        this.uiManager.updateProgress(40, 'Processing request sent to cosmic AI...');
    }

    /**
     * Handle progress message từ WebSocket
     */
    handleProgressMessage(message) {
        this.uiManager.updateProgress(
            message.progress || 50, 
            message.message || 'Processing...'
        );
        
        if (message.metrics) {
            this.uiManager.updateMetrics(message.metrics);
        }
    }

    /**
     * Handle result message từ WebSocket
     */
    handleResultMessage(message) {
        this.stopProcessing();
        this.uiManager.updateProgress(100, 'Cosmic processing complete! ✨');
        
        // Create video từ base64
        if (message.video_base64) {
            const videoBlob = this.fileManager.base64ToBlob(message.video_base64, 'video/mp4');
            const videoUrl = URL.createObjectURL(videoBlob);
            
            // Store for download
            this.downloadUrl = videoUrl;
            this.resultVideoBlob = videoBlob;
            
            // Show result
            const files = this.fileManager.getFiles();
            const result = {
                video_url: videoUrl,
                originalSrc: URL.createObjectURL(files.video),
                total_processing_time: message.metrics?.processing_time || 0,
                inference_fps: message.metrics?.inference_fps || 0,
                frames_processed: message.metrics?.frames_processed || 0,
                model_type: message.metrics?.model_type || 'Unknown'
            };
            
            this.uiManager.showResult(result, files.videoType);
            this.showSuccessToast('✨ Cosmic video generated successfully via WebSocket!');
        }
    }

    /**
     * Handle error message từ WebSocket
     */
    handleErrorMessage(message) {
        this.showErrorToast(`❌ Processing error: ${message.message}`);
        this.stopProcessing();
    }

    /**
     * Handle cancelled message từ WebSocket
     */
    handleCancelledMessage(message) {
        this.showWarningToast('🛑 Processing cancelled');
        this.stopProcessing();
    }

    /**
     * Stop processing
     */
    stopProcessing() {
        this.isProcessing = false;
        this.uiManager.stopProcessing();
        
        // Update final metrics nếu có
        if (this.startTime) {
            const totalTime = (Date.now() - this.startTime) / 1000;
            this.uiManager.updateMetrics({
                processing_time: totalTime
            });
        }
    }

    /**
     * Download result
     */
    downloadResult() {
        if (!this.downloadUrl && !this.resultVideoBlob) {
            this.showErrorToast('❌ No result available for download');
            return;
        }

        const url = this.downloadUrl || URL.createObjectURL(this.resultVideoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `illuminus_cosmic_result_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up temporary URL
        if (this.resultVideoBlob && !this.downloadUrl) {
            URL.revokeObjectURL(url);
        }
        
        this.showSuccessToast('📥 Cosmic video downloaded!');
    }

    /**
     * Reset processing state
     */
    reset() {
        this.isProcessing = false;
        this.startTime = null;
        
        // Clean up URLs
        if (this.downloadUrl) {
            URL.revokeObjectURL(this.downloadUrl);
            this.downloadUrl = null;
        }
        this.resultVideoBlob = null;
    }

    /**
     * Cancel current processing
     */
    cancelProcessing() {
        if (!this.isProcessing) return;
        
        if (this.wsManager.isReady()) {
            this.wsManager.send({ type: 'cancel' });
        }
        
        this.stopProcessing();
        this.showWarningToast('🛑 Processing cancelled');
    }

    /**
     * Check system status
     */
    async checkSystemStatus() {
        try {
            const response = await fetch('/health');
            const status = await response.json();
            
            // Update GPU status trong UI
            this.uiManager.updateGPUStatus(status.system?.gpu_available, status.system?.gpu_count);
            
            console.log('System status:', status);
            return status;
            
        } catch (error) {
            console.error('System status check failed:', error);
            this.uiManager.updateGPUStatus(false, 0);
            throw error;
        }
    }

    /**
     * Utility methods for notifications
     */
    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'error');
    }

    showWarningToast(message) {
        this.showToast(message, 'warning');
    }

    showInfoToast(message) {
        this.showToast(message, 'info');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full`;
        
        // Set color dựa trên type
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
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Get processing status
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            startTime: this.startTime,
            hasResult: !!this.downloadUrl || !!this.resultVideoBlob
        };
    }
}

export default ProcessingPipeline; 