/**
 * ILLUMINUS Wav2Lip - Main JavaScript with WebSocket
 * Real-time lip-syncing with WebSocket API only
 * 
 * @author Andrew (ngpthanh15@gmail.com)
 * @version 2.0.0 - WebSocket Only
 */

class IlluminusApp {
    constructor() {
        this.form = null;
        this.resultsSection = null;
        this.generatedVideoUrl = '';
        this.isProcessing = false;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectTimeout = null;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeElements();
            this.bindEvents();
            this.initializeWebSocket();
            this.checkGPUAvailability();
        });
    }

    initializeElements() {
        this.form = document.getElementById('uploadForm');
        this.resultsSection = document.getElementById('results');
        this.elements = {
            originalVideo: document.getElementById('originalVideo'),
            resultVideo: document.getElementById('resultVideo'),
            processingTime: document.getElementById('processingTime'),
            inferenceSpeed: document.getElementById('inferenceSpeed'),
            modelUsed: document.getElementById('modelUsed'),
            framesProcessed: document.getElementById('framesProcessed'),
            videoFps: document.getElementById('videoFps'),
            deviceUsed: document.getElementById('deviceUsed'),
            downloadBtn: document.getElementById('downloadBtn'),
            resetBtn: document.getElementById('resetBtn'),
            spinner: document.querySelector('#spinner'),
            submitBtn: this.form?.querySelector('button[type="submit"]'),
            toggleAdvanced: document.getElementById('toggleAdvanced'),
            advancedOptions: document.getElementById('advancedOptions'),
            advancedIcon: document.getElementById('advancedIcon')
        };
        
        // Add progress elements to the page
        this.createProgressSection();
    }

    createProgressSection() {
        // Check if progress section already exists
        if (document.getElementById('progressSection')) return;
        
        // Create progress section HTML
        const progressHTML = `
            <div id="progressSection" class="hidden bg-white shadow rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">📊 Processing Progress</h2>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-sm text-gray-600 mb-1">
                            <span id="progressText">Preparing...</span>
                            <span id="progressPercent">0%</span>
                        </div>
                        <div class="bg-gray-200 rounded-full h-3">
                            <div id="progressBar" class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>
                    <div id="connectionStatus" class="flex items-center space-x-2 text-sm">
                        <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span class="text-gray-600">WebSocket: Connecting...</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insert before results section
        this.resultsSection.insertAdjacentHTML('beforebegin', progressHTML);
        
        // Update elements
        this.elements.progressSection = document.getElementById('progressSection');
        this.elements.progressBar = document.getElementById('progressBar');
        this.elements.progressText = document.getElementById('progressText');
        this.elements.progressPercent = document.getElementById('progressPercent');
        this.elements.connectionStatus = document.getElementById('connectionStatus');
    }

    initializeWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/lip-sync`;
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('🔗 WebSocket connected');
                this.updateConnectionStatus('connected', 'WebSocket: Connected');
                this.reconnectAttempts = 0;
                
                // Clear any reconnect timeout
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            };
            
            this.socket.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };
            
            this.socket.onclose = (event) => {
                console.log('🔌 WebSocket disconnected', event.code, event.reason);
                this.updateConnectionStatus('disconnected', 'WebSocket: Disconnected');
                
                // Attempt to reconnect if not processing
                if (!this.isProcessing && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect();
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus('error', 'WebSocket: Error');
                this.showNotification('WebSocket connection error', 'error');
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize WebSocket:', error);
            this.showNotification('Failed to connect to WebSocket', 'error');
        }
    }

    attemptReconnect() {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000); // Exponential backoff
        
        this.updateConnectionStatus('reconnecting', `WebSocket: Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        this.reconnectTimeout = setTimeout(() => {
            console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.initializeWebSocket();
        }, delay);
    }

    updateConnectionStatus(status, message) {
        if (!this.elements.connectionStatus) return;
        
        const statusIndicator = this.elements.connectionStatus.querySelector('.w-2');
        const statusText = this.elements.connectionStatus.querySelector('span:last-child');
        
        if (statusIndicator && statusText) {
            // Update indicator color
            statusIndicator.className = 'w-2 h-2 rounded-full';
            switch (status) {
                case 'connected':
                    statusIndicator.classList.add('bg-green-500');
                    break;
                case 'disconnected':
                    statusIndicator.classList.add('bg-gray-400');
                    break;
                case 'reconnecting':
                    statusIndicator.classList.add('bg-yellow-500', 'animate-pulse');
                    break;
                case 'error':
                    statusIndicator.classList.add('bg-red-500');
                    break;
                default:
                    statusIndicator.classList.add('bg-gray-400');
            }
            
            statusText.textContent = message;
        }
    }

    handleWebSocketMessage(message) {
        console.log('📨 WebSocket message:', message);
        
        switch (message.type) {
            case 'connection':
                this.showNotification(message.message, 'success');
                break;
                
            case 'progress':
                this.updateProgress(message.progress, message.message);
                break;
                
            case 'result':
                this.handleProcessingResult(message);
                break;
                
            case 'error':
                this.handleProcessingError(message);
                break;
                
            case 'cancelled':
                this.handleProcessingCancelled();
                break;
                
            case 'pong':
                console.log('🏓 Pong received');
                break;
                
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    updateProgress(progress, message) {
        if (this.elements.progressBar && this.elements.progressText && this.elements.progressPercent) {
            this.elements.progressBar.style.width = `${progress}%`;
            this.elements.progressText.textContent = message || 'Processing...';
            this.elements.progressPercent.textContent = `${Math.round(progress)}%`;
        }
    }

    async handleProcessingResult(data) {
        try {
            // Convert base64 to blob and create URL
            const videoBlob = this.base64ToBlob(data.video_base64, 'video/mp4');
            const videoUrl = URL.createObjectURL(videoBlob);
            
            // Store for download
            this.generatedVideoUrl = videoUrl;
            this.generatedVideoBlob = videoBlob;
            
            // Update results
            await this.updateResults({
                video_url: videoUrl,
                total_processing_time: data.processing_time,
                inference_fps: data.inference_fps,
                frames_processed: data.frames_processed,
                video_fps: null, // Not available in WebSocket response
                device_used: 'WebSocket Processing',
                model_type: data.model_used
            });
            
            this.showNotification('🎉 Video generated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error handling result:', error);
            this.showNotification('Error processing result', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    handleProcessingError(data) {
        console.error('❌ Processing error:', data);
        this.showNotification(`Error: ${data.message}`, 'error');
        this.setLoadingState(false);
    }

    handleProcessingCancelled() {
        console.log('🛑 Processing cancelled');
        this.showNotification('Processing cancelled', 'info');
        this.setLoadingState(false);
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

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    bindEvents() {
        if (!this.form) return;

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Advanced options toggle
        this.elements.toggleAdvanced?.addEventListener('click', () => this.toggleAdvancedOptions());
        
        // Download and reset buttons
        this.elements.downloadBtn?.addEventListener('click', () => this.handleDownload());
        this.elements.resetBtn?.addEventListener('click', () => this.handleReset());
        
        // Drag and drop
        this.initializeDragAndDrop();
        
        // File input changes
        this.initializeFileInputs();
    }

    async checkGPUAvailability() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            const deviceSelect = document.getElementById('device');
            if (deviceSelect && !data.gpu_available) {
                const cudaOption = deviceSelect.querySelector('option[value="cuda"]');
                if (cudaOption) {
                    cudaOption.disabled = true;
                    cudaOption.textContent += ' (Not Available)';
                }
            }
            
            console.log('🖥️ System Info:', {
                gpu_available: data.gpu_available,
                gpu_count: data.gpu_count,
                gpu_name: data.gpu_name
            });
            
        } catch (error) {
            console.warn('⚠️ Could not check GPU availability:', error);
        }
    }

    toggleAdvancedOptions() {
        const options = this.elements.advancedOptions;
        const icon = this.elements.advancedIcon;
        
        if (options && icon) {
            options.classList.toggle('hidden');
            icon.classList.toggle('rotate-180');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isProcessing) return;
        
        // Check WebSocket connection
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.showNotification('WebSocket not connected. Please wait for connection...', 'error');
            return;
        }
        
        const formData = new FormData(this.form);
        
        // Validate inputs
        const videoFile = formData.get('video');
        const audioFile = formData.get('audio');
        
        if (!videoFile || !audioFile) {
            this.showNotification('Please select both video and audio files', 'error');
            return;
        }
        
        this.setLoadingState(true);
        
        try {
            // Convert files to base64
            this.updateProgress(5, '📁 Reading files...');
            
            const audioBase64 = await this.fileToBase64(audioFile);
            const videoBase64 = await this.fileToBase64(videoFile);
            
            this.updateProgress(15, '📤 Sending data to server...');
            
            // Prepare options
            const options = {
                model_type: formData.get('model') === 'original' ? 'wav2lip' : 'nota_wav2lip',
                audio_format: audioFile.name.split('.').pop().toLowerCase(),
                image_format: videoFile.name.split('.').pop().toLowerCase(),
                pads: [
                    parseInt(formData.get('pads_top') || 0),
                    parseInt(formData.get('pads_bottom') || 10),
                    parseInt(formData.get('pads_left') || 0),
                    parseInt(formData.get('pads_right') || 0)
                ],
                resize_factor: parseInt(formData.get('resize_factor') || 1),
                nosmooth: formData.get('nosmooth') === 'on'
            };
            
            // Store original video for display
            this.elements.originalVideo.src = URL.createObjectURL(videoFile);
            
            // Send WebSocket message
            const message = {
                type: 'process',
                audio_base64: audioBase64,
                image_base64: videoBase64,
                options: options
            };
            
            this.socket.send(JSON.stringify(message));
            
        } catch (error) {
            console.error('❌ Error preparing data:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
            this.setLoadingState(false);
        }
    }

    async updateResults(data) {
        // Update video sources
        this.elements.resultVideo.src = data.video_url;
        
        // Update metrics
        this.elements.processingTime.textContent = `${data.total_processing_time.toFixed(2)}s`;
        this.elements.inferenceSpeed.textContent = data.inference_fps ? `${data.inference_fps.toFixed(1)}` : '-';
        this.elements.modelUsed.textContent = data.model_type === 'wav2lip' ? 'Original' : 'Compressed';
        
        // Update detailed info
        this.elements.framesProcessed.textContent = data.frames_processed || '-';
        this.elements.videoFps.textContent = data.video_fps || '-';
        this.elements.deviceUsed.textContent = data.device_used || 'WebSocket';
        
        // Show results with animation
        this.resultsSection.classList.remove('hidden');
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Add animation
        this.resultsSection.style.opacity = '0';
        this.resultsSection.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            this.resultsSection.style.transition = 'all 0.5s ease';
            this.resultsSection.style.opacity = '1';
            this.resultsSection.style.transform = 'translateY(0)';
        });
    }

    setLoadingState(loading) {
        this.isProcessing = loading;
        
        if (this.elements.spinner && this.elements.submitBtn) {
            if (loading) {
                this.elements.spinner.classList.remove('hidden');
                this.elements.submitBtn.disabled = true;
                this.elements.submitBtn.textContent = '🔄 Processing...';
                this.elements.progressSection?.classList.remove('hidden');
                
                // Hide results while processing
                this.resultsSection.classList.add('hidden');
            } else {
                this.elements.spinner.classList.add('hidden');
                this.elements.submitBtn.disabled = false;
                this.elements.submitBtn.textContent = '🚀 Generate Video';
                this.elements.progressSection?.classList.add('hidden');
                
                // Reset progress
                this.updateProgress(0, 'Ready');
            }
        }
    }

    handleDownload() {
        if (!this.generatedVideoBlob) {
            this.showNotification('No video to download', 'error');
            return;
        }
        
        const a = document.createElement('a');
        a.href = this.generatedVideoUrl;
        a.download = `illuminus_result_${new Date().getTime()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('📥 Download started', 'success');
    }

    handleReset() {
        if (this.isProcessing) {
            // Cancel current processing
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: 'cancel' }));
            }
        }
        
        // Reset form
        this.form.reset();
        
        // Hide results
        this.resultsSection.classList.add('hidden');
        this.elements.progressSection?.classList.add('hidden');
        
        // Reset state
        this.setLoadingState(false);
        
        // Clean up URLs
        if (this.generatedVideoUrl) {
            URL.revokeObjectURL(this.generatedVideoUrl);
            this.generatedVideoUrl = '';
        }
        if (this.generatedVideoBlob) {
            this.generatedVideoBlob = null;
        }
        
        this.showNotification('🔄 Form reset', 'info');
    }

    initializeDragAndDrop() {
        const zones = document.querySelectorAll('.upload-zone');
        
        zones.forEach(zone => {
            const input = zone.querySelector('input[type="file"]');
            if (!input) return;
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, this.preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, () => this.highlight(zone), false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, () => this.unhighlight(zone), false);
            });
            
            zone.addEventListener('drop', (e) => this.handleDrop(e, input, zone), false);
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(zone) {
        zone.classList.add('border-indigo-500', 'bg-indigo-50');
    }

    unhighlight(zone) {
        zone.classList.remove('border-indigo-500', 'bg-indigo-50');
    }

    handleDrop(e, input, zone) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            input.files = files;
            this.updateFileName(input, files[0].name);
        }
    }

    initializeFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.updateFileName(input, e.target.files[0].name);
                }
            });
        });
    }

    updateFileName(input, fileName) {
        const zone = input.closest('.upload-zone');
        if (!zone) return;
        
        let fileNameDisplay = zone.querySelector('.file-name-display');
        if (!fileNameDisplay) {
            fileNameDisplay = document.createElement('div');
            fileNameDisplay.className = 'file-name-display mt-2 text-sm text-green-600 font-medium';
            zone.appendChild(fileNameDisplay);
        }
        
        fileNameDisplay.textContent = `📎 ${fileName}`;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium max-w-sm`;
        
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-500');
                break;
            case 'error':
                notification.classList.add('bg-red-500');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500');
                break;
            default:
                notification.classList.add('bg-blue-500');
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Add click to dismiss
        notification.addEventListener('click', () => notification.remove());
    }
}

// Initialize the application
const app = new IlluminusApp();

// Export for global access
window.IlluminusApp = IlluminusApp; 