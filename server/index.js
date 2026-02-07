import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Room state: roomId -> { peerId -> { id, displayName } }
const rooms = new Map();

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, displayName }) => {
    if (!roomId || !displayName) {
      socket.emit('error', { message: 'Room ID and display name required' });
      return;
    }
    const peerId = socket.id;
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    const room = rooms.get(roomId);
    room.set(peerId, { id: peerId, displayName });
    socket.join(roomId);

    const participants = Array.from(room.values());
    socket.emit('room-joined', { roomId, peerId, participants });
    socket.to(roomId).emit('user-joined', { peerId, displayName, participants });

    socket.on('signal', ({ to, type, data }) => {
      io.to(to).emit('signal', { from: peerId, type, data });
    });

    socket.on('chat-message', (message) => {
      const payload = {
        from: peerId,
        displayName: room.get(peerId)?.displayName || 'Unknown',
        message,
        timestamp: new Date().toISOString(),
      };
      io.to(roomId).emit('chat-message', payload);
    });

    socket.on('disconnect', () => {
      room.delete(peerId);
      if (room.size === 0) rooms.delete(roomId);
      socket.to(roomId).emit('user-left', { peerId, participants: Array.from(room.values()) });
    });
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
