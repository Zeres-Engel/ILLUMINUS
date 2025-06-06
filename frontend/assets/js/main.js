/**
 * ILLUMINUS Wav2Lip - Main JavaScript
 * GPU-Accelerated Real-Time Lip Sync Generation
 * 
 * @author Andrew (ngpthanh15@gmail.com)
 * @version 1.0.0
 */

class IlluminusApp {
    constructor() {
        this.form = null;
        this.resultsSection = null;
        this.generatedVideoUrl = '';
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeElements();
            this.bindEvents();
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
            
            // Display GPU info in console
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
        
        const formData = new FormData(this.form);
        
        // Validate inputs
        if (!formData.get('video') || !formData.get('audio')) {
            this.showNotification('Please select both video and audio files', 'error');
            return;
        }
        
        this.setLoadingState(true);
        
        try {
            const response = await fetch('/generate', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail?.error || 'Generation failed');
            }
            
            const data = await response.json();
            await this.updateResults(data, formData);
            
            this.showNotification('🎉 Video generated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Generation error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async updateResults(data, formData) {
        // Update video sources
        this.elements.originalVideo.src = URL.createObjectURL(formData.get('video'));
        this.elements.resultVideo.src = data.video_url;
        
        // Update metrics
        this.elements.processingTime.textContent = `${data.total_processing_time.toFixed(2)}s`;
        this.elements.inferenceSpeed.textContent = data.inference_fps ? `${data.inference_fps.toFixed(1)}` : '-';
        this.elements.modelUsed.textContent = formData.get('model') === 'original' ? 'Original' : 'Compressed';
        
        // Update detailed info
        this.elements.framesProcessed.textContent = data.frames_processed || '-';
        this.elements.videoFps.textContent = data.video_fps || '-';
        this.elements.deviceUsed.textContent = data.device_used || '-';
        
        this.generatedVideoUrl = data.video_url;
        
        // Show results with animation
        this.resultsSection.classList.remove('hidden');
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Add animation class
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
            } else {
                this.elements.spinner.classList.add('hidden');
                this.elements.submitBtn.disabled = false;
                this.elements.submitBtn.textContent = '🚀 Generate Video';
            }
        }
    }

    handleDownload() {
        if (!this.generatedVideoUrl) {
            this.showNotification('No video to download', 'error');
            return;
        }
        
        const a = document.createElement('a');
        a.href = this.generatedVideoUrl;
        a.download = `illuminus_result_${new Date().getTime()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('📥 Download started!', 'info');
    }

    handleReset() {
        this.form.reset();
        this.resultsSection.classList.add('hidden');
        this.elements.originalVideo.src = '';
        this.elements.resultVideo.src = '';
        this.generatedVideoUrl = '';
        
        // Clear file name displays
        document.querySelectorAll('.file-name').forEach(el => el.remove());
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showNotification('🔄 Form reset', 'info');
    }

    initializeDragAndDrop() {
        const dropZones = document.querySelectorAll('.upload-zone');
        
        dropZones.forEach(zone => {
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
        zone.classList.add('dragover');
    }

    unhighlight(zone) {
        zone.classList.remove('dragover');
    }

    handleDrop(e, input, zone) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            input.files = files;
            this.updateFileName(input, files[0].name);
        }
    }

    initializeFileInputs() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const fileName = e.target.files[0]?.name;
                if (fileName) {
                    this.updateFileName(input, fileName);
                }
            });
        });
    }

    updateFileName(input, fileName) {
        const label = input.closest('label') || input.closest('.upload-zone').querySelector('label');
        if (!label) return;
        
        let fileNameEl = label.querySelector('.file-name');
        
        if (!fileNameEl) {
            fileNameEl = document.createElement('span');
            fileNameEl.className = 'file-name ml-2 text-sm text-gray-600 font-medium';
            label.appendChild(fileNameEl);
        }
        
        fileNameEl.textContent = `📁 ${fileName}`;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
    }
}

// Initialize the application
const illuminusApp = new IlluminusApp();

// Export for global access
window.IlluminusApp = IlluminusApp; 