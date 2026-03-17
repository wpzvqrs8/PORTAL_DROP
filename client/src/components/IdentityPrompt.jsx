import React, { useState, useEffect } from 'react';

export default function IdentityPrompt({ children }) {
    const [identity, setIdentity] = useState(null);
    const [nameInput, setNameInput] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('portal_identity');
        if (stored) {
            setIdentity(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nameInput.trim()) return;

        const deviceId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const newIdentity = { name: nameInput.trim(), deviceId };

        localStorage.setItem('portal_identity', JSON.stringify(newIdentity));
        setIdentity(newIdentity);
    };

    if (loading) return null;

    if (!identity) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#101e22] flex items-center justify-center font-display text-slate-100 p-6 overflow-hidden">
                <div className="absolute inset-0 z-0 data-rain opacity-50 pointer-events-none"></div>
                <div className="absolute inset-0 z-0 cyber-grid opacity-30 pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-md bg-[#101e22] border border-cyan-400/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(37,192,244,0.15)] flex flex-col items-center">
                    <div className="text-cyan-400 p-3 bg-cyan-400/10 rounded-full mb-6 animate-pulse">
                        <span className="material-symbols-outlined text-4xl">fingerprint</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight mb-2 text-center uppercase">Identity Unknown</h1>
                    <p className="text-slate-400 text-sm text-center mb-8">Please register your terminal handle to establish zero-gravity connections.</p>

                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold ml-1">Terminal Alias</label>
                            <input
                                autoFocus
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Enter your name..."
                                className="w-full bg-[#101e22] border-2 border-slate-700 focus:border-cyan-400 rounded-lg py-4 px-4 text-slate-100 font-bold tracking-wide transition-colors outline-none placeholder:font-normal placeholder:text-slate-600"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!nameInput.trim()}
                            className="w-full bg-cyan-400 text-[#101e22] py-4 rounded-lg font-bold uppercase tracking-widest mt-4 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xl">login</span>
                            Register Device
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
