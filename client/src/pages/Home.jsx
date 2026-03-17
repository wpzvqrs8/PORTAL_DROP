import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchActivePortal } from '../services/portalApi';
import Scene3D from '../components/Scene3D';
import { use3DTilt } from '../hooks/use3DTilt';

function ActivePortalModal({ portal, onDismiss, onRejoin }) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="glass-panel-3d border border-cyan-400/30 p-8 rounded-2xl glow-cyan max-w-sm w-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-cyan-400/10 border border-cyan-400/40 flex items-center justify-center mb-4 neon-pulse">
                    <span className="material-symbols-outlined text-3xl text-cyan-400">deployed_code</span>
                </div>
                <h2 className="text-lg font-black uppercase tracking-widest text-slate-100 mb-2">Active Portal Detected</h2>
                <p className="text-sm text-slate-400 mb-6">You have a running portal. Rejoin now or create a new one.</p>
                <div className="bg-black/40 border border-cyan-400/20 p-4 rounded-xl w-full mb-6">
                    <div className="text-4xl font-mono font-black tracking-[0.4em] text-neon-gradient">{portal.code}</div>
                    <div className="text-[10px] font-mono text-cyan-400/60 mt-1 uppercase">
                        Valid until {new Date(portal.expires_at).toLocaleTimeString()}
                    </div>
                </div>
                <div className="flex gap-3 w-full">
                    <button onClick={onDismiss} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-bold uppercase hover:border-white/30 transition-colors">
                        Dismiss
                    </button>
                    <button onClick={onRejoin} className="flex-1 py-3 rounded-xl bg-cyan-400 text-black font-black text-sm uppercase tracking-widest glow-cyan hover:brightness-110 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-base">login</span> Rejoin
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const [activePortal, setActivePortal] = useState(null);
    const cardTilt = use3DTilt(10);

    useEffect(() => {
        let isMounted = true;
        fetchActivePortal().then(data => {
            if (isMounted && data.active && data.portal) setActivePortal(data.portal);
        }).catch(err => console.error(err));
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="relative min-h-screen flex flex-col overflow-x-hidden text-slate-100" style={{ background: '#050709' }}>
            {/* 3D Background */}
            <Scene3D />

            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 glass-panel">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg text-white">deployed_code</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tighter">
                            PORTAL<span className="text-neon-gradient">DROP</span>
                        </h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-10">
                        <span className="cursor-pointer text-xs font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-400 transition-colors" onClick={() => navigate('/create')}>Protocols</span>
                        <span className="cursor-pointer text-xs font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-purple-400 transition-colors" onClick={() => navigate('/create')}>Security</span>
                    </nav>
                    <button onClick={() => activePortal ? navigate(`/room/${activePortal.code}`, { state: { isHost: true } }) : navigate('/create')}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-5 py-2 rounded-lg font-bold text-xs tracking-widest uppercase hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/20 glow-purple">
                        {activePortal ? `REJOIN ${activePortal.code}` : 'LAUNCH PORTAL'}
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-16 px-6">
                <div className="relative z-10 container mx-auto py-20 flex flex-col items-center text-center max-w-5xl">

                    {/* Animated logo rings */}
                    <div className="relative mb-14 group">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-3xl animate-pulse" />
                        <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full border border-cyan-400/20 flex items-center justify-center glow-cyan">
                            <div className="absolute inset-0 rounded-full border-[10px] border-cyan-400/5 animate-[spin_30s_linear_infinite]" />
                            <div className="absolute inset-5 rounded-full border-2 border-dashed border-purple-400/20 animate-[spin_20s_linear_infinite]" />
                            <div className="absolute inset-12 rounded-full border-2 border-pink-400/30 animate-[spin_12s_linear_infinite_reverse]" />
                            <div className="absolute inset-20 rounded-full border-t-2 border-cyan-400/60 animate-spin" />
                            <div className="relative z-10 p-8 rounded-full bg-gradient-to-tr from-cyan-400/10 to-purple-500/10 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-purple-500 [background-clip:text] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">adjust</span>
                            </div>
                        </div>

                        {/* Floating data tags */}
                        <div className="absolute -top-4 -right-10 glass-panel-3d px-3 py-1.5 rounded-lg text-[9px] font-mono border border-cyan-400/20 text-cyan-400 uppercase tracking-widest floating-card" style={{ animationDelay: '-1s' }}>
                            ENCRYPTED_TUNNEL: LIVE
                        </div>
                        <div className="absolute bottom-6 -left-16 glass-panel-3d px-3 py-1.5 rounded-lg text-[9px] font-mono border border-purple-400/20 text-purple-400 uppercase tracking-widest floating-card" style={{ animationDelay: '-3s' }}>
                            P2P_MATRIX: STABLE
                        </div>
                        <div className="absolute top-8 -left-12 glass-panel-3d px-3 py-1.5 rounded-lg text-[9px] font-mono border border-pink-400/20 text-pink-400 uppercase tracking-widest floating-card" style={{ animationDelay: '-5s' }}>
                            DATA_RATE: MAX
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-none">
                        Transfer Files Across{' '}
                        <span className="text-neon-gradient">Realities</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg max-w-xl mb-14 leading-relaxed">
                        Instant, encrypted peer-to-peer data transmission. No accounts. No limits. Just pure energy.
                    </p>

                    {/* Action card with 3D tilt */}
                    <div
                        ref={cardTilt.ref}
                        onMouseMove={cardTilt.onMouseMove}
                        onMouseLeave={cardTilt.onMouseLeave}
                        className="panel-3d w-full max-w-md p-8 glass-panel-3d rounded-2xl border border-white/5"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => activePortal ? navigate(`/room/${activePortal.code}`, { state: { isHost: true } }) : navigate('/create')}
                                className={`flex flex-col items-center justify-center gap-3 ${activePortal ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30' : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/30'} text-black p-6 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg glow-cyan active:scale-95`}
                            >
                                <span className="material-symbols-outlined text-3xl">{activePortal ? 'login' : 'add_circle'}</span>
                                {activePortal ? `REJOIN_0${activePortal.code}` : 'CREATE PORTAL'}
                            </button>
                            <button
                                onClick={() => navigate('/join')}
                                className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 p-6 rounded-xl font-black text-sm uppercase tracking-widest hover:from-purple-500/30 hover:to-purple-600/30 transition-all text-purple-300 glow-purple active:scale-95"
                            >
                                <span className="material-symbols-outlined text-3xl text-purple-400">join_inner</span>
                                JOIN PORTAL
                            </button>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                                Awaiting uplink synchronization...
                            </p>
                        </div>
                    </div>

                    {/* Feature badges */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
                        {[
                            { label: 'End-to-End Encrypted', color: 'text-cyan-400 border-cyan-400/20' },
                            { label: 'Zero Account Required', color: 'text-purple-400 border-purple-400/20' },
                            { label: 'File + Text Transfer', color: 'text-pink-400 border-pink-400/20' },
                            { label: 'Multi-Device', color: 'text-green-400 border-green-400/20' },
                        ].map(f => (
                            <div key={f.label} className={`px-3 py-1.5 rounded-full border glass-panel-3d text-[10px] font-mono uppercase tracking-widest ${f.color}`}>
                                {f.label}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Active Portal Popup */}
            {activePortal && (
                <ActivePortalModal
                    portal={activePortal}
                    onDismiss={() => setActivePortal(null)}
                    onRejoin={() => {
                        console.log('[Home] Rejoining portal:', activePortal.code);
                        navigate(`/room/${activePortal.code}`, { state: { isHost: true } });
                    }}
                />
            )}
        </div>
    );
}
