import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel({ chats = [], onSendMessage, disabled, identity }) {
    const [text, setText] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats]);

    const handleSend = (e) => {
        e.preventDefault();
        if (text.trim() && !disabled) {
            onSendMessage(text);
            setText('');
        }
    };

    const handlePasteClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const clipText = await navigator.clipboard.readText();
                if (clipText) setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + clipText);
            }
        } catch (e) { console.error('Clipboard access denied', e); }
    };

    return (
        <div className="glass-panel-3d border border-cyan-500/15 p-5 rounded-2xl flex flex-col min-h-[340px] glow-cyan flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative">
                <div className="absolute -left-5 w-0.5 h-7 accent-strip-cyan rounded-r-full" />
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                    <span className="material-symbols-outlined text-lg">forum</span>
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-100">Comms Link</h3>
                {!disabled && (
                    <div className="ml-auto flex items-center gap-1.5 text-[9px] font-mono text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        LIVE
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 custom-scrollbar">
                {chats.length === 0 ? (
                    <div className="h-full flex items-center justify-center opacity-30">
                        <p className="text-[10px] font-mono uppercase tracking-widest">No messages yet</p>
                    </div>
                ) : (
                    chats.map((msg, i) => {
                        const isMe = msg.device_id === identity?.deviceId || msg.sender_name === identity?.name;
                        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <motion.div
                                key={msg.id || i}
                                initial={{ opacity: 0, y: 10, x: isMe ? 10 : -10 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className="text-[9px] text-slate-400 font-mono mb-1 mx-1">
                                    {isMe ? <span className="text-cyan-400 font-black">YOU</span> : <span className="text-purple-400 font-black">{msg.sender_name}</span>}
                                    {' '}· {time}
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl max-w-[88%] break-words text-sm shadow-lg ${isMe
                                    ? 'bg-gradient-to-br from-cyan-500/80 to-cyan-600/80 text-white rounded-tr-sm border border-cyan-400/20'
                                    : 'bg-white/5 border border-white/8 rounded-tl-sm text-slate-200'
                                    }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="relative mt-auto">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={disabled}
                    placeholder={disabled ? 'AWAITING SYNC...' : 'SEND SECURE MESSAGE...'}
                    className="w-full bg-black/40 border border-white/8 rounded-full py-3 pl-5 pr-24 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50 placeholder:text-slate-400 shadow-inner"
                />
                <button
                    type="button"
                    onClick={handlePasteClipboard}
                    disabled={disabled}
                    title="Paste Clipboard"
                    className="absolute right-11 top-1/2 -translate-y-1/2 text-slate-300 p-2 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-30"
                >
                    <span className="material-symbols-outlined text-sm">content_paste</span>
                </button>
                <button
                    type="submit"
                    disabled={disabled || !text.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-cyan-500/80 hover:bg-cyan-500 text-white p-2 rounded-full transition-all disabled:opacity-30 shadow-md"
                >
                    <span className="material-symbols-outlined text-sm">send</span>
                </button>
            </form>
        </div>
    );
}
