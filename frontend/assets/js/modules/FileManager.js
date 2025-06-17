/**
 * File Manager - Quản lý file upload, validation và conversion
 * ILLUMINUS Wav2Lip File Management
 */
class FileManager {
    constructor() {
        this.currentFiles = {
            video: null,
            audio: null,
            videoType: 'video' // 'video' or 'image'
        };
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.supportedVideoFormats = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
        this.supportedImageFormats = ['jpg', 'jpeg', 'png', 'bmp', 'webp'];
        this.supportedAudioFormats = ['wav', 'mp3', 'aac', 'm4a', 'ogg'];
    }

    /**
     * Setup drag and drop cho element
     */
    setupDropZone(dropZone, fileInput, acceptTypes, onFileSelect) {
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
                
                if (this.validateFile(file, acceptTypes)) {
                    this.setFileInput(fileInput, file);
                    if (onFileSelect) onFileSelect(file);
                } else {
                    throw new Error('Invalid file type or size');
                }
            }
        });
    }

    /**
     * Validate file
     */
    validateFile(file, acceptTypes) {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`File size exceeds ${this.formatFileSize(this.maxFileSize)} limit`);
        }

        // Check file type
        const isValidFile = acceptTypes.some(type => {
            if (type === 'video') {
                return file.type.startsWith('video/') || 
                       this.supportedVideoFormats.includes(this.getFileExtension(file.name));
            }
            if (type === 'image') {
                return file.type.startsWith('image/') || 
                       this.supportedImageFormats.includes(this.getFileExtension(file.name));
            }
            if (type === 'audio') {
                return file.type.startsWith('audio/') || 
                       this.supportedAudioFormats.includes(this.getFileExtension(file.name));
            }
            return false;
        });

        if (!isValidFile) {
            throw new Error(`Unsupported file format. Supported formats: ${acceptTypes.join(', ')}`);
        }

        return true;
    }

    /**
     * Set file input với file
     */
    setFileInput(input, file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change'));
    }

    /**
     * Handle video/image upload
     */
    async handleVideoUpload(file) {
        this.currentFiles.video = file;
        
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        
        if (isVideo) {
            this.currentFiles.videoType = 'video';
            return {
                type: 'video',
                file: file,
                preview: await this.createVideoPreview(file)
            };
        } else if (isImage) {
            this.currentFiles.videoType = 'image';
            return {
                type: 'image',
                file: file,
                preview: await this.createImagePreview(file)
            };
        }
        
        throw new Error('Unsupported video/image format');
    }

    /**
     * Handle audio upload
     */
    async handleAudioUpload(file) {
        this.currentFiles.audio = file;
        
        return {
            type: 'audio',
            file: file,
            preview: await this.createAudioPreview(file)
        };
    }

    /**
     * Tạo preview cho video
     */
    async createVideoPreview(file) {
        const video = document.createElement('video');
        video.controls = true;
        video.muted = true;
        video.className = 'w-full rounded-lg file-preview-cosmic';
        video.src = URL.createObjectURL(file);
        return video;
    }

    /**
     * Tạo preview cho image
     */
    async createImagePreview(file) {
        const img = document.createElement('img');
        img.className = 'w-full rounded-lg file-preview-cosmic';
        img.src = URL.createObjectURL(file);
        return img;
    }

    /**
     * Tạo preview cho audio
     */
    async createAudioPreview(file) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.className = 'w-full';
        audio.src = URL.createObjectURL(file);
        return audio;
    }

    /**
     * Convert file to base64
     */
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert base64 to blob
     */
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Reset files
     */
    reset() {
        this.currentFiles = {
            video: null,
            audio: null,
            videoType: 'video'
        };
    }

    /**
     * Check if files are ready for processing
     */
    areFilesReady() {
        return this.currentFiles.video !== null && this.currentFiles.audio !== null;
    }

    /**
     * Get current files
     */
    getFiles() {
        return { ...this.currentFiles };
    }
}

export default FileManager; 