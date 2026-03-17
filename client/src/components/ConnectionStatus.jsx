import React from 'react';

export default function ConnectionStatus({ status = 'SECURE_LINK_STABLE', peer = 'PEER_NODE_01', progress = 0 }) {
    return (
        <footer className="border-t border-white/5 p-4 sticky bottom-0 z-50 glass-panel">
            <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6 items-center">

                {/* Connection Status */}
                <div className="col-span-12 md:col-span-3 flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-mono">Connection Status</span>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-400 text-sm">
                                {status === 'WAITING' ? 'leak_add' : 'wifi_tethering'}
                            </span>
                            <span className={`text-xs font-black font-mono tracking-widest ${status === 'WAITING' ? 'text-amber-400' : 'text-cyan-400'}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Neon Progress Bar */}
                <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-cyan-400/80 font-mono tracking-[0.2em]">TRANSMISSION_PROGRESS</span>
                        <span className="text-xs font-bold text-cyan-400">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full border border-white/10 relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Connected User Indicator */}
                <div className="col-span-12 md:col-span-3 flex md:justify-end">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-colors ${status === 'WAITING' ? 'border-amber-500/20 bg-amber-500/5' : 'border-cyan-400/20 bg-cyan-400/5'}`}>
                        <div className={`size-6 rounded-full flex items-center justify-center ${status === 'WAITING' ? 'bg-amber-500/20' : 'bg-cyan-400/20'}`}>
                            <span className={`material-symbols-outlined text-xs ${status === 'WAITING' ? 'text-amber-500' : 'text-cyan-400'}`}>person</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 leading-none font-mono">PEER_NODE</span>
                            <span className={`text-xs font-black leading-tight tracking-wide ${status === 'WAITING' ? 'text-amber-500' : 'text-cyan-400'}`}>
                                {peer}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
