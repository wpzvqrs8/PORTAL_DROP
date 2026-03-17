/**
 * Mock WebRTC Service
 * Handles P2P data channels for file and clipboard transfer
 */

class WebRTCService {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
    }

    initialize(isInitiator) {
        console.log(`[WebRTC] Initializing connection (Initiator: ${isInitiator})`);
        // Setup RTCPeerConnection and data channel logic here
    }

    sendFile(file, onProgress) {
        console.log(`[WebRTC] Starting file transfer: ${file.name}`);
        // Mock progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (onProgress) onProgress(progress);
            if (progress >= 100) clearInterval(interval);
        }, 100);
    }

    sendClipboardData(text) {
        console.log(`[WebRTC] Sending clipboard data: ${text.substring(0, 15)}...`);
    }

    cleanup() {
        console.log('[WebRTC] Cleaning up connection');
    }
}

export default new WebRTCService();
