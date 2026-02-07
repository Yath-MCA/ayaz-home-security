import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import VideoCallRoom from './VideoCallRoom';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3002';

const VideoCall = () => {
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultName = user?.fullName || user?.username || '';

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    const rid = roomId.trim();
    const name = (displayName || defaultName || 'Guest').trim();
    if (!rid) {
      setError('Please enter a room ID');
      return;
    }
    setDisplayName(name);
    setJoined(true);
  };

  if (joined && roomId.trim()) {
    return (
      <VideoCallRoom
        roomId={roomId.trim()}
        displayName={(displayName || defaultName || 'Guest').trim()}
        signalingUrl={SIGNALING_URL}
        onLeave={() => setJoined(false)}
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>Back</button>
        <h1 style={styles.title}>📹 Video Call & Chat</h1>
      </header>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Join a room</h2>
        <p style={styles.hint}>Share the room ID with others to connect.</p>
        <form onSubmit={handleJoin} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.field}>
            <label style={styles.label}>Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. family-room"
              style={styles.input}
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Your name</label>
            <input
              type="text"
              value={displayName || defaultName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.joinBtn}>Join room</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  backBtn: {
    padding: '8px 16px',
    background: 'rgba(71, 85, 105, 0.5)',
    border: '1px solid rgba(71, 85, 105, 0.8)',
    borderRadius: '8px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: { margin: 0, fontSize: '24px', fontWeight: '700' },
  card: {
    maxWidth: '420px',
    margin: '0 auto',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '16px',
    padding: '32px',
    backdropFilter: 'blur(10px)',
  },
  cardTitle: { margin: '0 0 8px 0', fontSize: '20px' },
  hint: { margin: '0 0 24px 0', color: '#94a3b8', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#cbd5e1' },
  input: {
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
  },
  error: {
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '14px',
  },
  joinBtn: {
    padding: '14px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default function VideoCallWithProtection() {
  return (
    <ProtectedRoute>
      <VideoCall />
    </ProtectedRoute>
  );
}
