import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3002;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const PI_TOKEN = process.env.PI_TOKEN || '';

const allowedOriginsRaw = process.env.CORS_ORIGIN || '*';
const allowedOrigins = allowedOriginsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOriginsRaw === '*') return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOriginsRaw === '*' ? '*' : allowedOrigins,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// --- State ---
// Room state: roomId -> Map(peerId -> { id, displayName })
const rooms = new Map();
let isActive = process.env.DEFAULT_ACTIVE ? process.env.DEFAULT_ACTIVE === 'true' : true;
let piStreamUrl = '';

const nowIso = () => new Date().toISOString();

const requireAdmin = (req, res, next) => {
  if (!ADMIN_TOKEN) {
    return res.status(500).json({ error: 'ADMIN_TOKEN not set on server' });
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const requirePiToken = (req, res, next) => {
  if (!PI_TOKEN) {
    return res.status(500).json({ error: 'PI_TOKEN not set on server' });
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (!token || token !== PI_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// --- HTTP endpoints (Render health/wake/admin) ---
app.get('/health', (req, res) => {
  res.json({ ok: true, active: isActive, ts: nowIso() });
});

app.get('/status', (req, res) => {
  res.json({ active: isActive, ts: nowIso() });
});

// Used by the frontend to "poke" the service so Render wakes the instance.
// If the instance is asleep, the request itself is what wakes it.
app.post('/wake', (req, res) => {
  isActive = true;
  res.json({ ok: true, active: isActive, ts: nowIso() });
});

app.post('/admin/active', requireAdmin, (req, res) => {
  const { active } = req.body || {};
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'Body must be { active: boolean }' });
  }
  isActive = active;
  io.emit('server-active', { active: isActive, ts: nowIso() });
  if (!isActive) {
    // Let clients know and then disconnect them so they stop draining battery.
    io.emit('server-sleep', { message: 'Server is in Sleep Mode', ts: nowIso() });
    for (const [, socket] of io.sockets.sockets) {
      socket.disconnect(true);
    }
  }
  res.json({ ok: true, active: isActive, ts: nowIso() });
});

app.get('/pi/stream', (req, res) => {
  res.json({ url: piStreamUrl || null, ts: nowIso() });
});

app.post('/pi/stream', requirePiToken, (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Body must be { url: string }' });
  }
  piStreamUrl = url.trim();
  io.emit('pi-stream', { url: piStreamUrl, ts: nowIso() });
  res.json({ ok: true, url: piStreamUrl, ts: nowIso() });
});

// --- Socket.io signaling ---
io.use((socket, next) => {
  if (!isActive) {
    socket.emit('server-sleep', { message: 'Server is in Sleep Mode' });
    return next(new Error('Server is in Sleep Mode'));
  }
  next();
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, displayName }) => {
    if (!roomId || !displayName) {
      socket.emit('error', { message: 'Room ID and display name required' });
      return;
    }

    const peerId = socket.id;
    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    const room = rooms.get(roomId);
    room.set(peerId, { id: peerId, displayName });

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.peerId = peerId;

    const participants = Array.from(room.values());
    socket.emit('room-joined', { roomId, peerId, participants, piStreamUrl: piStreamUrl || null });
    socket.to(roomId).emit('user-joined', { peerId, displayName, participants });
  });

  // WebRTC bridge messages.
  // Supports 2 patterns:
  // 1) direct: { to, type: 'offer'|'answer'|'ice', data }
  // 2) room broadcast: { type, data, broadcast: true }
  socket.on('signal', ({ to, type, data, broadcast } = {}) => {
    const roomId = socket.data.roomId;

    if (broadcast && roomId) {
      socket.to(roomId).emit('signal', { from: socket.id, type, data });
      return;
    }

    if (!to) {
      socket.emit('error', { message: 'Missing signal target "to"' });
      return;
    }

    io.to(to).emit('signal', { from: socket.id, type, data });
  });

  socket.on('chat-message', (message) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    const payload = {
      from: socket.id,
      displayName: room?.get(socket.id)?.displayName || 'Unknown',
      message: typeof message === 'string' ? message : message?.message || String(message),
      timestamp: nowIso(),
    };

    io.to(roomId).emit('chat-message', payload);
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.delete(socket.id);
    if (room.size === 0) rooms.delete(roomId);
    socket.to(roomId).emit('user-left', { peerId: socket.id, participants: Array.from(room.values()) });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
