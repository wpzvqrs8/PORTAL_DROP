import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePortalCode } from '../services/portalApi';
import Scene3D from '../components/Scene3D';
import { use3DTilt } from '../hooks/use3DTilt';

export default function JoinPortal() {
    const [code, setCode] = useState(['', '', '']);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const cardTilt = use3DTilt(10);

    const handleInputChange = (index, value) => {
        const newCode = [...code];
        newCode[index] = value.toUpperCase().slice(-1);
        setCode(newCode);
        if (value && index < 2) {
            document.getElementById(`code-input-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            document.getElementById(`code-input-${index - 1}`).focus();
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 3) {
            setErrorMsg('Portal Code must be 3 characters.');
            setError(true);
            return;
        }
        setError(false);
        setConnecting(true);
        try {
            const res = await validatePortalCode(fullCode);
            if (!res.valid) {
                setErrorMsg(res.details?.error || 'Invalid or expired portal code.');
                setError(true);
                setConnecting(false);
                return;
            }
            navigate(`/room/${fullCode}`, { state: { isHost: false } });
        } catch (err) {
            console.error('Failed to connect:', err);
            setErrorMsg('Server offline. Please try again.');
            setError(true);
            setConnecting(false);
        }
    };

    const digitColors = ['text-cyan-400 border-cyan-400', 'text-purple-400 border-purple-400', 'text-pink-400 border-pink-400'];
    const digitGlows = ['focus:shadow-[0_0_20px_rgba(34,211,238,0.4)]', 'focus:shadow-[0_0_20px_rgba(168,85,247,0.4)]', 'focus:shadow-[0_0_20px_rgba(236,72,153,0.4)]'];

    return (
        <div className="min-h-screen relative overflow-hidden text-slate-100" style={{ background: '#050709' }}>
            <Scene3D />

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="border-b border-white/5 px-6 py-4 glass-panel">
                    <div className="flex items-center gap-3 cursor-pointer w-fit" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg text-white">deployed_code</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tighter">
                            PORTAL<span className="text-neon-gradient">DROP</span>
                        </h2>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full space-y-10">

                        {/* Title badge */}
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-400/30 bg-purple-400/5 text-purple-400 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                                <span className="flex h-2 w-2 rounded-full bg-purple-400 neon-pulse" />
                                Neural Link Active
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                                Terminal <span className="text-neon-gradient">Access</span>
                            </h1>
                            <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                                Initialize Portal Sequence
                            </p>
                        </div>

                        {/* Code input card with 3D tilt */}
                        <div
                            ref={cardTilt.ref}
                            onMouseMove={cardTilt.onMouseMove}
                            onMouseLeave={cardTilt.onMouseLeave}
                            className="panel-3d"
                        >
                            <form onSubmit={handleJoin} className="glass-panel-3d border border-white/8 p-8 rounded-2xl shadow-xl overflow-hidden">
                                {/* Colored top strip */}
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />

                                <div className="flex justify-center gap-5 py-8">
                                    {[0, 1, 2].map((idx) => (
                                        <input
                                            key={idx}
                                            id={`code-input-${idx}`}
                                            type="text"
                                            maxLength={1}
                                            value={code[idx]}
                                            onChange={(e) => handleInputChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            placeholder="•"
                                            className={`w-16 h-20 text-center text-4xl font-black bg-black/40 border-2 ${digitColors[idx]} ${digitGlows[idx]} uppercase transition-all outline-none rounded-xl shadow-inner focus:scale-105`}
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono font-bold tracking-widest uppercase mb-6 px-1">
                                    <span>Sector_7G</span>
                                    <span>Awaiting_Input</span>
                                    <span>Ver_2.0.4</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={connecting}
                                    className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3 disabled:opacity-60 disabled:hover:translate-y-0 active:scale-95"
                                >
                                    <span className={`material-symbols-outlined ${connecting ? 'animate-spin' : ''}`}>
                                        {connecting ? 'sync' : 'bolt'}
                                    </span>
                                    {connecting ? 'Connecting...' : 'Connect to Portal'}
                                </button>
                            </form>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">error</span>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-0.5">Validation Error</p>
                                    <p className="text-xs text-slate-400">{errorMsg}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
