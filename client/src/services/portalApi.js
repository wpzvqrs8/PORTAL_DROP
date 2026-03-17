const IS_PROD = import.meta.env.PROD;
const API_BASE = IS_PROD ? '/api/portal' : `http://${window.location.hostname}:3001/api/portal`;

export const generatePortalCode = async () => {
    const identityString = localStorage.getItem('portal_identity') || '{}';
    let identity = {};
    try { identity = JSON.parse(identityString); } catch (e) { }

    const res = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identity)
    });
    if (!res.ok) {
        let errData = { error: 'Failed to create portal' };
        try {
            errData = await res.json();
        } catch (e) { }

        const err = new Error(errData.error || 'Failed to create portal');
        err.details = errData;
        throw err;
    }
    return res.json();
};

export const fetchActivePortal = async () => {
    const identityString = localStorage.getItem('portal_identity') || '{}';
    let identity = { deviceId: 'none' };
    try { identity = JSON.parse(identityString); } catch (e) { }

    console.log('[API] Checking session for device:', identity.deviceId);
    try {
        const res = await fetch(`${API_BASE}/me`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(identity)
        });
        if (!res.ok) return { active: false };
        return res.json();
    } catch (err) {
        console.error('[API] Session check failed:', err);
        return { active: false };
    }
};

export const validatePortalCode = async (code) => {
    console.log('[API] Validating code:', code);
    try {
        const res = await fetch(`${API_BASE}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({ error: 'Connection failed' }));
            return { valid: false, details: data };
        }
        const data = await res.json();
        return { valid: true, status: data.status, details: data };
    } catch (err) {
        console.error('[API] Join failed:', err);
        return { valid: false, details: { error: 'Network error or server offline' } };
    }
};

export const fetchPortalDetails = async (code) => {
    const res = await fetch(`${API_BASE}/${code}`);
    if (!res.ok) throw new Error('Portal not found or expired.');
    return res.json();
};

export const fetchTransfers = async (code) => {
    const res = await fetch(`${API_BASE}/${code}/transfers`);
    if (!res.ok) throw new Error('Failed to fetch transfers');
    return res.json();
};

export const uploadFile = async (code, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const identityString = localStorage.getItem('portal_identity') || '{}';
    let identity = {};
    try { identity = JSON.parse(identityString); } catch (e) { }
    if (identity.name) formData.append('senderName', identity.name);

    const res = await fetch(`${API_BASE}/${code}/file`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('File upload failed');
    return res.json();
};

export const sendClipboard = async (code, text) => {
    const identityString = localStorage.getItem('portal_identity') || '{}';
    let identity = {};
    try { identity = JSON.parse(identityString); } catch (e) { }

    const res = await fetch(`${API_BASE}/${code}/clipboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, senderName: identity.name })
    });
    if (!res.ok) throw new Error('Clipboard send failed');
    return res.json();
};

export const fetchChats = async (code) => {
    const res = await fetch(`${API_BASE}/${code}/chats`);
    if (!res.ok) throw new Error('Failed to fetch chats');
    return res.json();
};

export const sendChat = async (code, text) => {
    const identityString = localStorage.getItem('portal_identity') || '{}';
    let identity = {};
    try { identity = JSON.parse(identityString); } catch (e) { }

    const res = await fetch(`${API_BASE}/${code}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, senderName: identity.name, deviceId: identity.deviceId })
    });
    if (!res.ok) throw new Error('Chat send failed');
    return res.json();
};
