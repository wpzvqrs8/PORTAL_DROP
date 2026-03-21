import SocketService from './socketService';

class WebRTCService {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.code = null;
        this.isInitiator = false;
        
        // Listeners for UI
        this.listeners = {
            onConnected: null,
            onDisconnected: null,
            onTransferReceived: null,
            onChatReceived: null,
            onProgress: null
        };

        // File receiving state
        this.incomingFileInfo = null;
        this.incomingFileData = [];
        this.receivedBytes = 0;

        // Constants
        this.CHUNK_SIZE = 16384; // 16KB
    }

    initialize(code, isInitiator) {
        this.code = code;
        this.isInitiator = isInitiator;
        console.log(`[WebRTC] Initializing connection (Initiator: ${isInitiator})`);

        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                SocketService.sendSignal(this.code, null, {
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state: ${this.peerConnection.connectionState}`);
            if (this.peerConnection.connectionState === 'connected') {
                if (this.listeners.onConnected) this.listeners.onConnected();
            } else if (this.peerConnection.connectionState === 'disconnected' || this.peerConnection.connectionState === 'failed') {
                if (this.listeners.onDisconnected) this.listeners.onDisconnected();
            }
        };

        if (this.isInitiator) {
            this.dataChannel = this.peerConnection.createDataChannel('portal-data');
            this.setupDataChannel(this.dataChannel);
            
            this.peerConnection.createOffer()
                .then(offer => this.peerConnection.setLocalDescription(offer))
                .then(() => {
                    SocketService.sendSignal(this.code, null, {
                        type: 'offer',
                        sdp: this.peerConnection.localDescription
                    });
                })
                .catch(e => console.error('[WebRTC] Offer error:', e));
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel(this.dataChannel);
            };
        }

        // Listen for signals
        SocketService.on('webrtc-signal', async (data) => {
            const { signal } = data;
            if (!this.peerConnection) return;

            try {
                if (signal.type === 'offer') {
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    const answer = await this.peerConnection.createAnswer();
                    await this.peerConnection.setLocalDescription(answer);
                    SocketService.sendSignal(this.code, null, {
                        type: 'answer',
                        sdp: this.peerConnection.localDescription
                    });
                } else if (signal.type === 'answer') {
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                } else if (signal.type === 'candidate') {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch (err) {
                console.error('[WebRTC] Signaling error:', err);
            }
        });
    }

    setupDataChannel(channel) {
        channel.binaryType = 'arraybuffer';
        channel.onopen = () => console.log('[WebRTC] Data channel open');
        channel.onclose = () => console.log('[WebRTC] Data channel closed');
        
        channel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const message = JSON.parse(event.data);
                if (message.type === 'chat') {
                    if (this.listeners.onChatReceived) this.listeners.onChatReceived(message.data);
                } else if (message.type === 'clipboard') {
                    if (this.listeners.onTransferReceived) this.listeners.onTransferReceived(message.data);
                } else if (message.type === 'file-start') {
                    this.incomingFileInfo = message.data;
                    this.incomingFileData = [];
                    this.receivedBytes = 0;
                    if (this.listeners.onProgress) this.listeners.onProgress(0);
                } else if (message.type === 'file-end') {
                    const blob = new Blob(this.incomingFileData, { type: this.incomingFileInfo.type });
                    const url = URL.createObjectURL(blob);
                    
                    if (this.listeners.onTransferReceived) {
                        this.listeners.onTransferReceived({
                            id: Math.random().toString(36).substr(2, 9),
                            type: 'file',
                            file_name: this.incomingFileInfo.name,
                            file_path: url,
                            file_size: this.incomingFileInfo.size,
                            sender_name: this.incomingFileInfo.senderName,
                            created_at: new Date().toISOString()
                        });
                    }
                    this.incomingFileInfo = null;
                    this.incomingFileData = [];
                    this.receivedBytes = 0;
                    if (this.listeners.onProgress) this.listeners.onProgress(100);
                }
            } else if (event.data instanceof ArrayBuffer) {
                // File chunk
                this.incomingFileData.push(event.data);
                this.receivedBytes += event.data.byteLength;
                
                if (this.incomingFileInfo && this.listeners.onProgress) {
                    const pct = Math.floor((this.receivedBytes / this.incomingFileInfo.size) * 100);
                    this.listeners.onProgress(Math.min(99, pct));
                }
            }
        };
    }

    on(event, callback) {
        this.listeners[event] = callback;
    }

    async sendFile(file, senderName, onProgress) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            console.error('[WebRTC] Data channel not open');
            return;
        }

        // Send metadata
        this.dataChannel.send(JSON.stringify({
            type: 'file-start',
            data: {
                name: file.name,
                size: file.size,
                type: file.type,
                senderName
            }
        }));

        // Read and send chunks
        const reader = new FileReader();
        let offset = 0;

        reader.onload = (e) => {
            this.dataChannel.send(e.target.result);
            offset += e.target.result.byteLength;
            
            if (onProgress) {
                const pct = Math.floor((offset / file.size) * 100);
                onProgress(Math.min(99, pct));
            }

            if (offset < file.size) {
                readSlice(offset);
            } else {
                this.dataChannel.send(JSON.stringify({ type: 'file-end' }));
                if (onProgress) onProgress(100);
            }
        };

        const readSlice = (o) => {
            const slice = file.slice(o, o + this.CHUNK_SIZE);
            reader.readAsArrayBuffer(slice);
        };

        readSlice(0);
    }

    sendClipboardData(text, senderName) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
        this.dataChannel.send(JSON.stringify({
            type: 'clipboard',
            data: {
                id: Math.random().toString(36).substr(2, 9),
                type: 'clipboard',
                content: text,
                sender_name: senderName,
                created_at: new Date().toISOString()
            }
        }));
    }

    sendChatData(text, senderName, deviceId) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
        this.dataChannel.send(JSON.stringify({
            type: 'chat',
            data: {
                id: Math.random().toString(36).substr(2, 9),
                portal_code: this.code,
                content: text,
                sender_name: senderName,
                device_id: deviceId,
                created_at: new Date().toISOString()
            }
        }));
    }

    cleanup() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.code = null;
        console.log('[WebRTC] Cleaned up connection');
    }
}

export default new WebRTCService();
