/**
 * WebSocket Manager - Quản lý kết nối và xử lý message WebSocket
 * ILLUMINUS Wav2Lip WebSocket Integration
 */
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
    }

    /**
     * Kết nối WebSocket
     */
    async connect() {
        if (this.isConnected) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws/lip-sync`;
                
                this.ws = new WebSocket(wsUrl);
                
                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.onConnectionChange(true);
                    console.log('🚀 WebSocket connected successfully');
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };
                
                this.ws.onclose = (event) => {
                    this.isConnected = false;
                    this.onConnectionChange(false);
                    console.warn('⚠️ WebSocket disconnected:', event.code, event.reason);
                    
                    // Auto-reconnect logic
                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };
                
                this.ws.onerror = (error) => {
                    this.isConnected = false;
                    this.onConnectionChange(false);
                    console.error('❌ WebSocket error:', error);
                    reject(new Error('WebSocket connection failed'));
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Đóng kết nối WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }
        this.isConnected = false;
    }

    /**
     * Gửi message qua WebSocket
     */
    send(message) {
        if (!this.isConnected || !this.ws) {
            throw new Error('WebSocket not connected');
        }
        
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        this.ws.send(messageStr);
    }

    /**
     * Đăng ký handler cho loại message
     */
    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    /**
     * Xử lý message nhận được
     */
    handleMessage(message) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        } else {
            console.log('Unhandled WebSocket message:', message);
        }
    }

    /**
     * Lên lịch reconnect
     */
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    /**
     * Callback khi trạng thái kết nối thay đổi
     */
    onConnectionChange(connected) {
        // Override this method in implementation
        console.log('Connection status changed:', connected);
    }

    /**
     * Kiểm tra trạng thái kết nối
     */
    isReady() {
        return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

export default WebSocketManager; 