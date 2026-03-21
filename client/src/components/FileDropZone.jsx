import React, { useRef } from 'react';

export default function FileDropZone({ files = [], onFileSelect, code }) {
    const fileInputRef = useRef(null);

    const handleContainerClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };
    const handleContainerTouch = (e) => {
        e.preventDefault();
        handleContainerClick();
    };

    return (
        <aside className="flex flex-col gap-4 h-full">
            <div className="glass-panel-3d border border-pink-500/15 p-5 rounded-2xl flex-1 flex flex-col glow-pink">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5 relative">
                    <div className="absolute -left-5 w-0.5 h-7 accent-strip-pink rounded-r-full" />
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 border border-pink-500/20">
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-100">File Payload</h3>
                </div>

                {/* Drop Zone */}
                <div className="flex-1 flex flex-col gap-4">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={onFileSelect}
                        id="file-drop-input"
                    />
                    <div
                        onClick={handleContainerClick}
                        onTouchStart={handleContainerTouch}
                        className="border-2 border-dashed border-pink-400/25 rounded-xl bg-pink-400/3 flex flex-col items-center justify-center p-8 text-center group hover:border-pink-400/60 hover:bg-pink-400/5 transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-5xl text-pink-400/70 mb-3 group-hover:scale-110 group-hover:text-pink-400 transition-all">cloud_upload</span>
                        <p className="text-sm font-bold text-slate-200 mb-1">Click or Drop files here</p>
                        <p className="text-[10px] text-pink-300/60 uppercase font-mono tracking-widest">Max size: 500 EB</p>
                    </div>

                    {/* File list */}
                    <div className="grid grid-cols-2 gap-2">
                        {files.length > 0 ? (
                            files.slice(0, 4).map((file, idx) => (
                                <div key={idx} className="aspect-square rounded-xl bg-black/30 border border-pink-500/10 hover:border-pink-500/30 flex flex-col items-center justify-center p-3 relative overflow-hidden group transition-all">
                                    <div className="w-10 h-10 mb-3 bg-pink-400/10 border border-pink-400/30 flex items-center justify-center rounded-lg group-hover:border-pink-400/60 transition-colors">
                                        <span className="material-symbols-outlined text-pink-400 text-lg">description</span>
                                    </div>
                                    <span className="text-[9px] font-mono truncate w-full text-center text-slate-400">{file.name}</span>
                                    {file.url && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    // Always fetch the file directly to avoid Cross-Origin "Open in new tab" behavior
                                                    const urlToFetch = file.url ? file.url : `/api/portal/${code}/file/${encodeURIComponent(file.name)}`;
                                                    
                                                    const resp = await fetch(urlToFetch);
                                                    if (!resp.ok) throw new Error('Download failed');
                                                    
                                                    const blob = await resp.blob();
                                                    const objectUrl = window.URL.createObjectURL(blob);
                                                    
                                                    const a = document.createElement('a');
                                                    a.href = objectUrl;
                                                    a.download = file.name;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    a.remove();
                                                    
                                                    window.URL.revokeObjectURL(objectUrl);
                                                } catch (err) { console.error('Download error:', err); }
                                            }}
                                            className="mt-1.5 text-[9px] text-pink-400 font-bold uppercase flex items-center gap-1 hover:text-pink-300 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[11px]">download</span>
                                            Download
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="aspect-square rounded-xl bg-black/30 border border-pink-500/10 flex flex-col items-center justify-center p-3">
                                    <div className="w-10 h-10 mb-3 bg-cyan-400/15 border border-cyan-400/30 rounded-lg animate-[rotate-slow_10s_linear_infinite]" />
                                    <span className="text-[10px] font-mono font-bold text-cyan-400/60 uppercase tracking-tight">awaiting_data...</span>
                                </div>
                                <div className="aspect-square rounded-xl bg-black/30 border border-purple-500/10 flex flex-col items-center justify-center p-3">
                                    <div className="w-10 h-10 mb-3 bg-purple-500/15 border border-purple-500/30 rounded-lg animate-[rotate-slow_15s_linear_infinite_reverse]" />
                                    <span className="text-[10px] font-mono font-bold text-purple-400/60 uppercase tracking-tight">empty_slot...</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:from-pink-400 hover:to-pink-500 transition-all shadow-md shadow-pink-500/20 active:scale-95"
                    >
                        Upload File
                    </button>
                </div>
            </div>

            {/* Vault stats mini widget */}
            <div className="glass-panel-3d p-4 rounded-xl border border-white/5 hidden lg:block">
                <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-pink-400">storage</span>
                    Vault Storage
                </h4>
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 w-[42%]" />
                    </div>
                    <span className="text-[10px] font-mono text-pink-400 font-bold">42%</span>
                </div>
            </div>
        </aside>
    );
}
