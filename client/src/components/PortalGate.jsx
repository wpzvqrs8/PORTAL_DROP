import React from 'react';
import PortalScene from './PortalScene';

export default function PortalGate() {
    return (
        <section className="flex flex-col gap-0 z-10">
            <div className="relative flex-1 rounded-2xl border border-white/8 overflow-hidden flex items-center justify-center min-h-[280px] lg:min-h-[360px] glass-panel-3d">

                {/* Scanlines overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(168,85,247,0.03)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none z-10" />

                {/* Colorful gradient overlay — purple → pink → cyan instead of flat cyan */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/15 via-pink-500/8 to-cyan-400/5 pointer-events-none z-10" />

                {/* 3D Portal Engine */}
                <div className="absolute inset-0 z-0">
                    <PortalScene />
                </div>

                {/* Ready for Transfer label — colorful gradient text */}
                <div className="relative z-10 flex items-center justify-center pointer-events-none w-full h-full">
                    <div className="w-[280px] h-[280px] flex items-center justify-center">
                        <div className="flex flex-col items-center mt-16">
                            <span className="text-xs font-mono tracking-[0.4em] uppercase font-black text-neon-gradient bg-black/30 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                Ready for Transfer
                            </span>
                        </div>
                    </div>
                </div>

                {/* HUD — top-left */}
                <div className="absolute top-4 left-4 font-mono text-[9px] space-y-1 z-20 hidden sm:block pointer-events-none">
                    <p className="text-purple-400/80">PORTAL_STABILITY: 99.8%</p>
                    <p className="text-cyan-400/80">SYNC_PHASE: 0.002ms</p>
                    <p className="text-pink-400/80">COORDS: 42.128 // -71.21</p>
                </div>

                {/* HUD — bottom-right */}
                <div className="absolute bottom-4 right-4 font-mono text-[9px] text-right space-y-1 z-20 hidden sm:block pointer-events-none">
                    <p className="text-amber-400/80">GATE_ID: PT-X900</p>
                    <p className="text-green-400/80">BUFFER_STATUS: NOMINAL</p>
                </div>
            </div>
        </section>
    );
}
