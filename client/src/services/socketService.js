import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = {};
        this.connected = false;
    }

    connect(roomId) {
        if (this.socket) {
            this.socket.disconnect();
        }

        console.log(`[Socket] Connecting to signaling server for room: ${roomId}`);
        const IS_PROD = import.meta.env.PROD;
        const SOCKET_URL = import.meta.env.VITE_API_URL || (IS_PROD ? window.location.origin : `http://${window.location.hostname}:3001`);
        this.socket = io(SOCKET_URL);

        const identity = JSON.parse(localStorage.getItem('portal_identity') || '{"name":"Unknown"}');

        this.socket.on('connect', () => {
            this.connected = true;
            this.socket.emit('join-room', { code: roomId, user: identity });
            this.emit('joined', { peerId: this.socket.id });
        });

        // Bubble up events
        this.socket.on('portal-connected', (data) => this.emit('portal-connected', data));
        this.socket.on('transfer-received', (data) => this.emit('transfer-received', data));
        this.socket.on('chat-received', (data) => this.emit('chat-received', data));
        this.socket.on('peer-joined', (data) => this.emit('peer-joined', data));
        this.socket.on('peer-ack', (data) => this.emit('peer-ack', data));
        this.socket.on('webrtc-signal', (data) => this.emit('webrtc-signal', data));
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    sendSignal(code, targetPeerId, signal) {
        if (!this.socket) return;
        this.socket.emit('webrtc-signal', { code, targetPeerId, signal });
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    removeAllListeners() {
        this.listeners = {};
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.removeAllListeners();
        console.log('[Socket] Disconnected from signaling server');
        this.connected = false;
    }
}

export default new SocketService();
