import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePortalCode } from '../services/portalApi';
import Scene3D from './Scene3D';

export default function PortalCodeReveal() {
    const [code, setCode] = useState(['-', '-', '-']);
    const [revealed, setRevealed] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    const navigate = useNavigate();

    const digitColors = [
        { text: 'text-cyan-400', border: 'border-cyan-400', shadow: 'shadow-[0_0_18px_rgba(34,211,238,0.5)]', revealShadow: 'shadow-[0_0_32px_rgba(34,211,238,0.9)]' },
        { text: 'text-purple-400', border: 'border-purple-500', shadow: 'shadow-[0_0_18px_rgba(168,85,247,0.5)]', revealShadow: 'shadow-[0_0_32px_rgba(168,85,247,0.9)]' },
        { text: 'text-pink-400', border: 'border-pink-500', shadow: 'shadow-[0_0_18px_rgba(236,72,153,0.5)]', revealShadow: 'shadow-[0_0_32px_rgba(236,72,153,0.9)]' },
    ];

    useEffect(() => {
        let isMounted = true;
        const charPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let iterations = 0;
        let generatedCode = null;

        generatePortalCode()
            .then(data => { if (isMounted) generatedCode = data.code; })
            .catch(err => {
                console.error('Failed to generate code:', err);
                if (isMounted) {
                    if (err.details?.existingCode) {
                        // If it already exists, just take them there immediately
                        navigate(`/room/${err.details.existingCode}`, { state: { isHost: true } });
                        return;
                    }
                    generatedCode = 'ERR';
                    setErrorDetails(err.details || { message: err.message });
                }
            });

        const interval = setInterval(() => {
            setCode([
                charPool[Math.floor(Math.random() * charPool.length)],
                charPool[Math.floor(Math.random() * charPool.length)],
                charPool[Math.floor(Math.random() * charPool.length)],
            ]);
            iterations++;
            if (iterations > 15 && generatedCode) {
                clearInterval(interval);
                if (generatedCode === 'ERR') {
                    setCode(['E', 'R', 'R']);
                    setRevealed(true);
                    return;
                }
                setCode(generatedCode.split(''));
                setRevealed(true);
                setTimeout(() => navigate(`/room/${generatedCode}`, { state: { isHost: true } }), 800);
            }
        }, 100);

        return () => { clearInterval(interval); isMounted = false; };
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden text-slate-100" style={{ background: '#050709' }}>
            <Scene3D />

            <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-[10px] font-mono font-bold tracking-[0.2em] uppercase mb-8">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    Generating Secure Code
                </div>

                {/* Spinning border ring */}
                <div className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-8">
                    <div className="absolute inset-0 border border-dashed border-purple-400/20 rounded-full animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-4 border border-dashed border-cyan-400/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                    {/* Inner code reveal area */}
                    <div className="relative w-4/5 h-4/5 rounded-full border border-white/8 glass-panel-3d flex items-center justify-center overflow-hidden"
                        style={{ background: 'radial-gradient(circle at center, rgba(168,85,247,0.08), rgba(236,72,153,0.05), transparent 70%)' }}
                    >
                        {/* Ambient glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-cyan-400/5 pointer-events-none" />

                        <div className="flex flex-col items-center gap-5 z-10 px-4">
                            <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-slate-500">Sequence Active</span>

                            {/* Code digit boxes */}
                            <div className="flex gap-3">
                                {code.map((char, i) => (
                                    <div
                                        key={i}
                                        className={`w-14 h-20 md:w-16 md:h-24 rounded-xl flex items-center justify-center border-2 bg-black/50 ${digitColors[i].border} ${revealed ? digitColors[i].revealShadow + ' scale-110' : digitColors[i].shadow} transition-all duration-300`}
                                    >
                                        <span className={`text-4xl font-black font-mono ${digitColors[i].text}`}>{char}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Connecting status */}
                            {revealed && code.join('') !== 'ERR' && (
                                <div className="flex items-center gap-2 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                                    <span className="text-green-400 text-[10px] font-mono font-bold tracking-widest uppercase">Establishing Link...</span>
                                </div>
                            )}

                            {/* Error state */}
                            {revealed && code.join('') === 'ERR' && (
                                <div className="flex flex-col items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl w-full text-center">
                                    <div className="flex items-center gap-2 mb-2 text-red-400">
                                        <span className="material-symbols-outlined text-sm">warning</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {errorDetails?.error || 'Active Portal Restriction'}
                                        </span>
                                    </div>
                                    {errorDetails?.existingCode && (
                                        <div className="w-full">
                                            <p className="text-xs text-slate-400 mb-2">Sync conflict: active session found</p>
                                            <div className="text-3xl font-black font-mono text-neon-gradient tracking-widest my-2">
                                                {errorDetails.existingCode}
                                            </div>
                                            <p className="text-[10px] text-slate-600 mb-3 uppercase tracking-tighter">
                                                Valid until {new Date(errorDetails.expiresAt).toLocaleTimeString()}
                                            </p>
                                            <button
                                                onClick={() => navigate(`/room/${errorDetails.existingCode}`, { state: { isHost: true } })}
                                                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2.5 px-4 rounded-xl font-bold text-xs tracking-widest uppercase transition-all hover:brightness-110 flex items-center justify-center gap-2 glow-purple"
                                            >
                                                <span className="material-symbols-outlined text-sm">login</span>
                                                Resume Protocol
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Text below */}
                <div className="text-center">
                    <h1 className="text-3xl font-black tracking-tighter mb-3">
                        Portal <span className="text-neon-gradient">Sequence</span>
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                        Establishing a 3-character data bridge. Strictly one active uplink per device.
                    </p>
                </div>
            </div>
        </div>
    );
}
