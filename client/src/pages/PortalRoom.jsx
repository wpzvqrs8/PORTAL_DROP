import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ClipboardPanel from '../components/ClipboardPanel';
import PortalGate from '../components/PortalGate';
import FileDropZone from '../components/FileDropZone';
import ConnectionStatus from '../components/ConnectionStatus';
import SocketService from '../services/socketService';
import WebRTCService from '../services/webrtcService';
import { fetchTransfers, uploadFile, fetchChats, sendChat, fetchPortalDetails } from '../services/portalApi';
import ChatPanel from '../components/ChatPanel';
import Scene3D from '../components/Scene3D';
import WarpTransferEffect from '../components/WarpTransferEffect';
import { use3DTilt } from '../hooks/use3DTilt';

export default function PortalRoom() {
    const { code } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isHost = location.state?.isHost ?? false;

    const [status, setStatus] = useState('RESTORING_LINK');
    const [timeLeft, setTimeLeft] = useState(300);
    const [files, setFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [clipboardItems, setClipboardItems] = useState([]);
    const [chats, setChats] = useState([]);
    const [peerName, setPeerName] = useState(null);
    const [transferActive, setTransferActive] = useState(false);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const clipTilt = use3DTilt(8, isMobile);
    const chatTilt = use3DTilt(8, isMobile);
    const fileTilt = use3DTilt(8, isMobile);

    const getIdentity = () => JSON.parse(localStorage.getItem('portal_identity') || '{"name":"Unknown User"}');

    const formatTime = (isoString) => isoString
        ? new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formatCountdown = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useEffect(() => {
        SocketService.connect(code);

        // Fetch portal metadata for the timer
        fetchPortalDetails(code)
            .then(data => {
                const expires = new Date(data.expires_at).getTime();
                const now = new Date().getTime();
                const diff = Math.max(0, Math.floor((expires - now) / 1000));

                if (diff <= 0) {
                    alert('Session has expired.');
                    navigate('/');
                    return;
                }
                console.log(`[Room] Portal details active. Link established. Expires in ${Math.floor(diff / 60)}m ${diff % 60}s`);
                setTimeLeft(diff);

                // Start countdown
                const timer = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            alert('Nexus link lost. Session expired.');
                            navigate('/');
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                return () => clearInterval(timer);
            })
            .catch(err => {
                console.error('[Room Error] Portal details fetch failed:', err);
                // Try to wait a bit before giving up, maybe server is restarting
                setTimeout(() => navigate('/'), 2000);
            });

        fetchTransfers(code)
            .then(data => {
                console.log(`[Room] Fetched ${data?.length || 0} transfers.`);
                if (Array.isArray(data)) {
                    const existingFiles = data.filter(t => t.type === 'file').map(t => ({
                        name: t.file_name, id: t.id,
                        url: t.file_path && (t.file_path.startsWith('http') || t.file_path.startsWith('https'))
                            ? t.file_path
                            : `http://${window.location.hostname}:3001/data/${t.file_path}`
                    }));
                    const existingClips = data.filter(t => t.type === 'clipboard').map(t => ({
                        id: t.id, text: t.content, time: formatTime(t.created_at), sender: t.sender_name || 'Unknown'
                    }));
                    setFiles(existingFiles);
                    setClipboardItems(existingClips);
                }
                setStatus('SECURE_LINK_STABLE');
            })
            .catch(err => {
                console.error('[Room Error] Transfers fetch failed:', err);
                setStatus('SECURE_LINK_STABLE'); // Allow UI to load even if history fails
            });

        fetchChats(code)
            .then(data => { if (Array.isArray(data)) setChats(data.reverse()); })
            .catch(console.error);

        if (!isHost) {
            WebRTCService.initialize(code, false);
        }

        WebRTCService.on('onConnected', () => {
             console.log('[Room] WebRTC Connected P2P');
             setStatus('SECURE_LINK_STABLE');
        });
        
        WebRTCService.on('onDisconnected', () => {
             console.log('[Room] WebRTC Disconnected P2P');
             setStatus('RESTORING_LINK');
        });

        WebRTCService.on('onProgress', (prog) => {
             setProgress(prog);
             if (prog > 0 && prog < 100) setTransferActive(true);
             if (prog >= 100) setTimeout(() => { setTransferActive(false); setProgress(0); }, 800);
        });

        const handleConnected = () => setStatus('SECURE_LINK_STABLE');
        const handleTransfer = (data) => {
            if (data.type === 'file') {
                const fileUrl = data.file_path && (data.file_path.startsWith('http') || data.file_path.startsWith('blob'))
                    ? data.file_path
                    : `http://${window.location.hostname}:3001/data/${data.file_path}`;
                setFiles(prev => [{ name: data.file_name, id: data.id, url: fileUrl }, ...prev]);
            } else if (data.type === 'clipboard') {
                setClipboardItems(prev => [{ id: data.id, text: data.content, time: formatTime(data.created_at), sender: data.sender_name }, ...prev]);
            }
            setStatus('SECURE_LINK_STABLE');
            setProgress(0);
            setTransferActive(false);
        };
        const handleChat = (data) => setChats(prev => [...prev, data]);
        
        WebRTCService.on('onTransferReceived', handleTransfer);
        WebRTCService.on('onChatReceived', handleChat);

        const handlePeerJoined = (user) => {
            if (user?.name) setPeerName(user.name);
            setStatus('SECURE_LINK_STABLE');
            const identity = JSON.parse(localStorage.getItem('portal_identity') || '{"name":"Unknown"}');
            SocketService.socket?.emit('peer-ack', { code, user: identity });
            
            if (isHost) {
                WebRTCService.initialize(code, true);
            }
        };
        const handlePeerAck = (user) => {
            if (user?.name) setPeerName(user.name);
            setStatus('SECURE_LINK_STABLE');
        };

        SocketService.on('portal-connected', handleConnected);
        SocketService.on('transfer-received', handleTransfer);
        SocketService.on('chat-received', handleChat);
        SocketService.on('peer-joined', handlePeerJoined);
        SocketService.on('peer-ack', handlePeerAck);

        return () => {
            SocketService.disconnect();
            WebRTCService.cleanup();
        };
    }, [code, isHost]);

    const handleSendMessage = async (text) => {
        if (!text.trim() || status !== 'SECURE_LINK_STABLE') return;
        const identity = getIdentity();
        try {
            const newChat = {
                id: Math.random().toString(36).substr(2, 9),
                content: text,
                sender_name: identity.name,
                device_id: identity.deviceId,
                created_at: new Date().toISOString()
            };
            setChats(prev => [...prev, newChat]);
            WebRTCService.sendChatData(text, identity.name, identity.deviceId);
        } catch (err) { console.error('Chat failed:', err); }
    };

    const processFiles = async (filesToProcess) => {
        setTransferActive(true);
        setStatus('SENDING_DATA');
        setProgress(10);
        const identity = getIdentity();
        try {
            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i];
                const url = URL.createObjectURL(file);
                setFiles(prev => [{ name: file.name, id: Math.random().toString(36).substring(7), url }, ...prev]);
                
                await new Promise((resolve) => {
                    WebRTCService.sendFile(file, identity.name, (prog) => {
                        setProgress(Math.max(10, prog));
                        if (prog >= 100) resolve();
                    });
                });
            }
            setTimeout(() => { setTransferActive(false); setStatus('SECURE_LINK_STABLE'); setProgress(0); }, 800);
        } catch (err) {
            console.error('Upload failed:', err);
            setTransferActive(false);
            setStatus('SECURE_LINK_STABLE');
            setProgress(0);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        if (status !== 'SECURE_LINK_STABLE') return;
        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        if (droppedFiles.length === 0) return;
        await processFiles(droppedFiles);
    };

    const handleFileSelect = async (e) => {
        if (status !== 'SECURE_LINK_STABLE') return;
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;
        
        // Reset input to allow selecting the same file again and prevent duplicates
        e.target.value = null;

        await processFiles(selectedFiles);
    };

    const handleDragOver = (e) => e.preventDefault();

    return (
        <div
            className="text-slate-100 min-h-screen flex flex-col relative"
            style={{ background: '#050709' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {/* 3D Background */}
            <Scene3D />

            {/* Warp Transfer Overlay */}
            <WarpTransferEffect active={transferActive} progress={progress} />

            {/* Header */}
            <header className="relative z-30 flex items-center justify-between border-b border-white/5 px-4 lg:px-8 py-3 glass-panel sticky top-0">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-base text-white">deployed_code</span>
                    </div>
                    <h2 className="text-base font-black tracking-tighter">
                        PORTAL<span className="text-neon-gradient">DROP</span>
                    </h2>
                    <span className="hidden sm:inline-block ml-3 text-[10px] font-mono px-3 py-1 bg-white/5 rounded-md uppercase text-cyan-400/70 border border-cyan-400/10">
                        Code: <span className="font-black text-cyan-400">{code}</span>
                    </span>

                    {/* Timer HUD */}
                    <div className={`ml-4 flex items-center gap-2 px-3 py-1 bg-black/40 rounded-lg border ${timeLeft < 60 ? 'border-red-500/50 text-red-400 animate-pulse' : 'border-white/10 text-slate-400'} font-mono text-[10px] uppercase font-bold tracking-widest`}>
                        <span className="material-symbols-outlined text-[12px]">timer</span>
                        <span className="shrink-0">LINK STATUS: {formatCountdown(timeLeft)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {peerName && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-green-400/20 bg-green-400/5 text-green-400 text-[10px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            {peerName}
                        </div>
                    )}
                    <ConnectionStatus status={status} progress={progress} />
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white transition-all"
                        title="Disconnect"
                    >
                        <span className="material-symbols-outlined text-lg">power_settings_new</span>
                    </button>
                </div>
            </header>

            {/* Main Dashboard */}
            <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 overflow-y-auto custom-scrollbar max-w-[1920px] mx-auto w-full">

                {/* ── Clipboard Panel (Purple) ── */}
                <aside
                    ref={clipTilt.ref}
                    onMouseMove={clipTilt.onMouseMove}
                    onMouseLeave={clipTilt.onMouseLeave}
                    className="panel-3d col-span-1 lg:col-span-3 flex flex-col gap-4"
                >
                    <div className="glass-panel-3d border border-purple-500/15 p-5 rounded-2xl flex-1 flex flex-col glow-purple min-h-[280px] lg:min-h-0">
                        <div className="flex items-center gap-3 mb-5 relative">
                            <div className="absolute -left-5 w-0.5 h-7 accent-strip-purple rounded-r-full" />
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                                <span className="material-symbols-outlined text-lg">content_paste_go</span>
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest text-slate-100">Clipboard Stream</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                            {clipboardItems.length === 0 ? (
                                <div className="h-full flex items-center justify-center opacity-30">
                                    <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting clipboard sync...</p>
                                </div>
                            ) : (
                                clipboardItems.map(item => (
                                    <div key={item.id} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all cursor-pointer group relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500/30 group-hover:bg-purple-400 transition-colors" />
                                        <div className="flex justify-between items-start mb-1.5 pl-2">
                                            <span className="text-[9px] text-purple-400/80 font-mono truncate mr-2">{item.sender}</span>
                                            <span className="text-[9px] text-slate-400 shrink-0">{item.time}</span>
                                        </div>
                                        <p className="text-xs line-clamp-3 font-mono pl-2 text-slate-200 group-hover:text-white transition-colors">{item.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── Center: PortalGate + Chat (Cyan) ── */}
                <div
                    ref={chatTilt.ref}
                    onMouseMove={chatTilt.onMouseMove}
                    onMouseLeave={chatTilt.onMouseLeave}
                    className="panel-3d col-span-1 lg:col-span-6 flex flex-col gap-4"
                >
                    <PortalGate />
                    <ChatPanel
                        chats={chats}
                        onSendMessage={handleSendMessage}
                        disabled={status !== 'SECURE_LINK_STABLE'}
                        identity={getIdentity()}
                    />
                </div>

                {/* ── File Transfer Panel (Pink) ── */}
                <div
                    ref={fileTilt.ref}
                    onMouseMove={fileTilt.onMouseMove}
                    onMouseLeave={fileTilt.onMouseLeave}
                    className="panel-3d col-span-1 lg:col-span-3"
                >
                    <FileDropZone files={files} onFileSelect={handleFileSelect} code={code} />
                </div>
            </main>

            {/* Status bar */}
            <div className="relative z-30 border-t border-white/5 glass-panel px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'SECURE_LINK_STABLE' ? 'bg-green-400' :
                        status === 'SENDING_DATA' ? 'bg-pink-400 neon-pulse' :
                            'bg-amber-400 neon-pulse'
                        }`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{status}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:block">PortalDrop Terminal v2</span>
            </div>
        </div>
    );
}
