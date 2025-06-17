/**
 * ILLUMINUS Wav2Lip - Main Interface (Refactored & Modularized)
 * Enhanced WebSocket API Integration with Cosmic Effects
 * Author: Andrew (ngpthanh15@gmail.com)
 * Version: 2.0.0 - Modular Edition
 */

// Import modules
import WebSocketManager from './core/WebSocketManager.js';
import FileManager from './modules/FileManager.js';
import UIManager from './modules/UIManager.js';
import ProcessingPipeline from './modules/ProcessingPipeline.js';
import CosmicEffects from './utils/CosmicEffects.js';

class CosmicWav2LipInterface {
    constructor() {
        // Initialize all managers
        this.wsManager = new WebSocketManager();
        this.fileManager = new FileManager();
        this.uiManager = new UIManager();
        this.cosmicEffects = new CosmicEffects();
        
        // Initialize processing pipeline với tất cả dependencies
        this.pipeline = new ProcessingPipeline(
            this.wsManager,
            this.fileManager,
            this.uiManager
        );
        
        // Setup WebSocket connection change callback
        this.wsManager.onConnectionChange = (connected) => {
            this.handleConnectionChange(connected);
        };
        
        this.initialize();
    }

    /**
     * Initialize toàn bộ application
     */
    async initialize() {
        try {
            // Initialize UI elements
            this.uiManager.initializeElements();
            
            // Setup event listeners với callbacks
            this.setupEventListeners();
            
            // Initialize cosmic effects
            this.cosmicEffects.initialize();
            
            // Setup file drag & drop
            this.setupFileHandling();
            
            // Check system status
            await this.pipeline.checkSystemStatus();
            
            // Initialize WebSocket connection
            await this.wsManager.connect();
            
            // Update UI state
            this.updateUIState();
            
            console.log('🚀 ILLUMINUS Wav2Lip Interface initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.uiManager.updateStatus('error', '❌ Initialization failed');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.uiManager.setupEventListeners({
            onGenerate: () => this.startGeneration(),
            onDownload: () => this.pipeline.downloadResult(),
            onNewVideo: () => this.resetInterface(),
            onVideoChange: (e) => this.handleVideoUpload(e),
            onAudioChange: (e) => this.handleAudioUpload(e)
        });
    }

    /**
     * Setup file handling với drag & drop
     */
    setupFileHandling() {
        const elements = this.uiManager.elements;
        
        // Setup video/image drop zone
        this.fileManager.setupDropZone(
            elements.videoDropZone,
            elements.videoFile,
            ['video', 'image'],
            (file) => this.handleVideoFile(file)
        );
        
        // Setup audio drop zone
        this.fileManager.setupDropZone(
            elements.audioDropZone,
            elements.audioFile,
            ['audio'],
            (file) => this.handleAudioFile(file)
        );
    }

    /**
     * Handle video file upload
     */
    async handleVideoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.handleVideoFile(file);
        }
    }

    /**
     * Handle video file
     */
    async handleVideoFile(file) {
        try {
            const result = await this.fileManager.handleVideoUpload(file);
            
            // Show preview trong UI
            this.uiManager.showFilePreview('video', file.name, result.preview);
            
            // Show toast notification
            const typeEmoji = result.type === 'video' ? '🎬' : '🖼️';
            this.pipeline.showSuccessToast(
                `${typeEmoji} ${result.type} uploaded: ${file.name} (${this.fileManager.formatFileSize(file.size)})`
            );
            
            this.updateUIState();
            
        } catch (error) {
            this.pipeline.showErrorToast(`❌ Video upload failed: ${error.message}`);
        }
    }

    /**
     * Handle audio file upload
     */
    async handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.handleAudioFile(file);
        }
    }

    /**
     * Handle audio file
     */
    async handleAudioFile(file) {
        try {
            const result = await this.fileManager.handleAudioUpload(file);
            
            // Show preview trong UI
            this.uiManager.showFilePreview('audio', file.name, result.preview);
            
            // Show toast notification
            this.pipeline.showSuccessToast(
                `🎵 Audio uploaded: ${file.name} (${this.fileManager.formatFileSize(file.size)})`
            );
            
            this.updateUIState();
            
        } catch (error) {
            this.pipeline.showErrorToast(`❌ Audio upload failed: ${error.message}`);
        }
    }

    /**
     * Start generation process
     */
    async startGeneration() {
        if (!this.fileManager.areFilesReady()) {
            this.pipeline.showWarningToast('📁 Please upload both video and audio files first');
            return;
        }

        try {
            // Show progress UI
            this.uiManager.showProgress();
            
            // Start processing
            await this.pipeline.startProcessing();
            
        } catch (error) {
            console.error('Generation error:', error);
            this.pipeline.showErrorToast(`❌ Generation failed: ${error.message}`);
        }
    }

    /**
     * Reset interface
     */
    resetInterface() {
        // Reset file manager
        this.fileManager.reset();
        
        // Reset UI
        this.uiManager.resetInterface();
        
        // Reset processing pipeline
        this.pipeline.reset();
        
        // Update UI state
        this.updateUIState();
        
        this.pipeline.showInfoToast('🔄 Interface reset - Ready for new cosmic video!');
    }

    /**
     * Handle WebSocket connection change
     */
    handleConnectionChange(connected) {
        if (connected) {
            this.uiManager.updateStatus('ready', '🚀 WebSocket Connected - Ready for cosmic processing');
        } else {
            this.uiManager.updateStatus('error', '⚠️ WebSocket disconnected - Trying to reconnect...');
        }
    }

    /**
     * Update UI state dựa trên current conditions
     */
    updateUIState() {
        const files = this.fileManager.getFiles();
        const processingStatus = this.pipeline.getStatus();
        
        this.uiManager.validateInputs(
            !!files.video,
            !!files.audio,
            processingStatus.isProcessing
        );
    }

    /**
     * Cleanup khi đóng ứng dụng
     */
    cleanup() {
        // Cleanup all managers
        this.wsManager.disconnect();
        this.uiManager.cleanup();
        this.cosmicEffects.cleanup();
        this.pipeline.reset();
        
        console.log('🧹 Application cleanup completed');
    }
}

// Initialize khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.cosmicInterface = new CosmicWav2LipInterface();
        
        // Cleanup khi page unload
        window.addEventListener('beforeunload', () => {
            if (window.cosmicInterface) {
                window.cosmicInterface.cleanup();
            }
        });
        
    } catch (error) {
        console.error('Failed to initialize ILLUMINUS interface:', error);
    }
}); 