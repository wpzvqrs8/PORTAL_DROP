import React from 'react';

export default function ClipboardPanel({ onSend }) {
    return (
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6 z-10 transition-transform duration-500 hover:[transform:perspective(1000px)_rotateY(2deg)]">
            <div className="bg-[#1a2e35] p-5 rounded-xl border border-cyan-400/20 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-cyan-400">content_paste_go</span>
                    <h3 className="font-bold text-lg uppercase tracking-tight">Clipboard Sharing</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {/* Holographic Preview Item */}
                    <div className="p-4 rounded-lg bg-cyan-400/5 border-l-2 border-cyan-400 group hover:bg-cyan-400/10 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-cyan-400/60 font-mono">ENCRYPTED_BUF_01</span>
                            <span className="text-[10px] text-slate-500 uppercase">Just now</span>
                        </div>
                        <p className="text-sm line-clamp-3 font-mono opacity-80 break-words">Text representation of copied data goes here...</p>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={onSend}
                        className="w-full py-3 px-4 bg-cyan-400 text-[#101e22] font-bold rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined">send_to_mobile</span>
                        SEND CLIPBOARD
                    </button>
                </div>
            </div>

            <div className="bg-[#1a2e35] p-5 rounded-xl border border-cyan-400/20 hidden lg:block">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Network Load</h4>
                <div className="h-24 w-full bg-[#101e22]/50 rounded flex items-end gap-1 p-2">
                    <div className="w-full bg-cyan-400/20 h-1/3 rounded-t-sm"></div>
                    <div className="w-full bg-cyan-400/30 h-1/2 rounded-t-sm"></div>
                    <div className="w-full bg-cyan-400/40 h-2/3 rounded-t-sm"></div>
                    <div className="w-full bg-cyan-400/60 h-3/4 rounded-t-sm"></div>
                    <div className="w-full bg-cyan-400 h-5/6 rounded-t-sm"></div>
                    <div className="w-full bg-cyan-400/80 h-1/2 rounded-t-sm"></div>
                    <div className="w-full bg-cyan-400/40 h-1/4 rounded-t-sm"></div>
                </div>
            </div>
        </aside>
    );
}
