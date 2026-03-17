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
        this.socket.on('peer-joined', (data) => this.emit('peer-joined', data));
        this.socket.on('peer-ack', (data) => this.emit('peer-ack', data));
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

    sendSignal(targetPeerId, signalData) {
        console.log(`[Socket] Sending signal to ${targetPeerId}`);
        // Stub
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        console.log('[Socket] Disconnected from signaling server');
        this.connected = false;
    }
}

export default new SocketService();
