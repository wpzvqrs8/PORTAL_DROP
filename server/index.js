const express = require('express');
const cors = require('cors');
const multer = require('multer');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
require('dotenv').config();

const { supabase, initDB } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Memory storage for multer since we're uploading to Supabase
const upload = multer({ storage: multer.memoryStorage() });

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'live',
        supabase: !!supabase,
        uptime: process.uptime(),
        memory: process.memoryUsage().rss
    });
});

// Initialize "Database" (Console log in this case)
initDB();

// Generate Random 3-char code
const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

// Routes

// Get current active portal for a user
app.post('/api/portal/me', async (req, res) => {
    try {
        const { deviceId } = req.body;
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
        if (ip === '::1') ip = '127.0.0.1';

        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('portals')
                    .select('*')
                    .or(`device_id.eq."${deviceId || 'none'}",ip_address.eq."${ip}"`)
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (!error && data && data.length > 0) {
                    return res.json({ active: true, portal: data[0] });
                }
            } catch(e) {}
        }
        
        // Memory fallback probe
        let found = null;
        for (const [code, portal] of memoryPortals.entries()) {
            if ((portal.device_id === deviceId || portal.ip_address === ip) && new Date(portal.expires_at) > new Date()) {
                found = portal;
                break;
            }
        }
        if (found) return res.json({ active: true, portal: found });

        res.json({ active: false });
    } catch (err) {
        console.error('[API Error/me]', err);
        res.status(500).json({ error: err.message });
    }
});

// In-Memory fallback for when Supabase is missing or errors locally
const memoryPortals = new Map();

app.post('/api/portal/create', async (req, res) => {
    try {
        const { deviceId, name } = req.body;
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
        if (ip === '::1') ip = '127.0.0.1';

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        const newPortal = {
            code,
            status: 'waiting',
            ip_address: ip,
            device_id: deviceId || null,
            creator_name: name || null,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
        };

        // If Supabase is connected, try to insert
        if (supabase) {
            try {
                // We disabled the "existing portal" restriction here to allow seamless localhost dev.
                const { data: created, error: createError } = await supabase
                    .from('portals')
                    .insert([newPortal])
                    .select();
                
                if (createError) throw createError;
                return res.json(created[0]);
            } catch (err) {
                console.warn('[Supabase Fallback] Error inserting portal, using memory store.', err.message);
            }
        }

        // Memory Fallback
        memoryPortals.set(code, newPortal);
        res.json(newPortal);
    } catch (err) {
        console.error('[API Error]', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/portal/join', async (req, res) => {
    let { code } = req.body;
    if (code) code = code.toUpperCase();
    try {
        let portalData = null;
        let usingMemory = false;

        if (supabase) {
            try {
                const { data: portals } = await supabase.from('portals').select('*').eq('code', code).limit(1);
                if (portals && portals.length > 0) portalData = portals[0];
            } catch(e) {}
        }
        
        if (!portalData && memoryPortals.has(code)) {
            portalData = memoryPortals.get(code);
            usingMemory = true;
        }

        if (!portalData) {
            return res.status(404).json({ error: 'Portal not found' });
        }

        if (portalData.status === 'connected') return res.status(400).json({ error: 'Portal full' });

        if (new Date(portalData.expires_at) < new Date()) {
            return res.status(403).json({ error: 'Portal expired. Sessions only last 5 minutes.' });
        }

        portalData.status = 'connected';

        if (!usingMemory && supabase) {
            try {
                await supabase.from('portals').update({ status: 'connected' }).eq('code', code);
            } catch(e) {}
        } else {
            memoryPortals.set(code, portalData);
        }

        io.to(code).emit('portal-connected', portalData);
        res.json(portalData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// File Upload endpoint
app.post('/api/portal/:code/file', upload.single('file'), async (req, res) => {
    const { code } = req.params;
    const file = req.file;
    const { senderName } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        // 1. Upload to Supabase Storage
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${code}${fileExt}`;
        const filePath = `${code}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portal-files')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: urlData } = supabase.storage
            .from('portal-files')
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // 3. Save to Database
        const { data: transferData, error: dbError } = await supabase
            .from('transfers')
            .insert([{
                portal_code: code,
                type: 'file',
                file_name: file.originalname,
                file_path: publicUrl,
                file_size: file.size,
                sender_name: senderName || 'Unknown User'
            }])
            .select();

        if (dbError) throw dbError;

        io.to(code).emit('transfer-received', transferData[0]);
        res.json(transferData[0]);
    } catch (err) {
        console.error('[Upload Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// Clipboard Upload endpoint
app.post('/api/portal/:code/clipboard', async (req, res) => {
    const { code } = req.params;
    const { text, senderName } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    try {
        const { data, error } = await supabase
            .from('transfers')
            .insert([{
                portal_code: code,
                type: 'clipboard',
                content: text,
                sender_name: senderName || 'Unknown User'
            }])
            .select();

        if (error) throw error;

        io.to(code).emit('transfer-received', data[0]);
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get portal details
app.get('/api/portal/:code', async (req, res) => {
    let { code } = req.params;
    if (code) code = code.toUpperCase();
    try {
        let portalData = null;
        if (supabase) {
            try {
                const { data: portals } = await supabase.from('portals').select('*').eq('code', code).limit(1);
                if (portals && portals.length > 0) portalData = portals[0];
            } catch(e) {}
        }
        if (!portalData && memoryPortals.has(code)) portalData = memoryPortals.get(code);

        if (!portalData) return res.status(404).json({ error: 'Portal not found' });
        res.json(portalData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get transfer history
app.get('/api/portal/:code/transfers', async (req, res) => {
    const { code } = req.params;
    try {
        const { data, error } = await supabase
            .from('transfers')
            .select('*')
            .eq('portal_code', code)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat endpoint
app.post('/api/portal/:code/chat', async (req, res) => {
    const { code } = req.params;
    const { text, senderName, deviceId } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    try {
        const { data, error } = await supabase
            .from('chats')
            .insert([{
                portal_code: code,
                content: text,
                sender_name: senderName || 'Unknown User',
                device_id: deviceId || null
            }])
            .select();

        if (error) throw error;

        io.to(code).emit('chat-received', data[0]);
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get chat history
app.get('/api/portal/:code/chats', async (req, res) => {
    const { code } = req.params;
    try {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('portal_code', code)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cleanup Task: Runs every 1 minute
setInterval(async () => {
    try {
        // 1. Find expired portals
        const { data: expiredPortals } = await supabase
            .from('portals')
            .select('code')
            .lt('expires_at', new Date().toISOString());

        if (expiredPortals && expiredPortals.length > 0) {
            for (const portal of expiredPortals) {
                const code = portal.code;

                // 2. Delete files from storage for this portal
                const { data: files } = await supabase.storage.from('portal-files').list(code);
                if (files && files.length > 0) {
                    const filesToDelete = files.map(f => `${code}/${f.name}`);
                    await supabase.storage.from('portal-files').remove(filesToDelete);
                }

                // 3. Delete portal (cascades to transfers and chats)
                await supabase.from('portals').delete().eq('code', code);
            }
            console.log(`[Cleanup] Cleared ${expiredPortals.length} expired portals.`);
        }
    } catch (err) {
        console.error('[Cleanup Error]', err);
    }
}, 60000);

// Realtime Sockets
io.on('connection', (socket) => {
    socket.on('join-room', ({ code, user }) => {
        socket.join(code);
        socket.to(code).emit('peer-joined', { ...user, peerId: socket.id });
    });

    socket.on('peer-ack', ({ code, user }) => {
        socket.to(code).emit('peer-ack', { ...user, peerId: socket.id });
    });

    socket.on('webrtc-signal', ({ code, targetPeerId, signal }) => {
        // If targetPeerId is provided, we could emit directly `io.to(targetPeerId).emit(...)`
        // But for portals we'll just broadcast to the room, so the other peer gets it.
        socket.to(code).emit('webrtc-signal', { signal, senderPeerId: socket.id });
    });

    socket.on('disconnect', () => { });
});

// Build path for frontend
const staticPath = path.join(__dirname, '../client/dist');
app.use(express.static(staticPath));

// Catch-all route to serve the React application for any non-API routes
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} with Supabase`);
});
