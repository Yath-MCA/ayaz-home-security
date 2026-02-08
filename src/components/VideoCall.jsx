import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VideoCallRoom from './VideoCallRoom';
import useServerActive from '../hooks/useServerActive';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3002';
const DEFAULT_QUICK_ROOM = 'room-SafyHaji-YathAffae';

const generateGuestName = () => {
  const adjectives = ['Swift', 'Calm', 'Bright', 'Silent', 'Brave', 'Kind', 'Smart', 'Nova', 'Shadow', 'Crystal'];
  const nouns = ['Visitor', 'Guest', 'Watcher', 'Guardian', 'Friend', 'Helper', 'Member', 'Partner', 'Caller', 'User'];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${a}${n}${num}`;
};

const VideoCall = () => {
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const previewVideoRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { active: serverActive, checking: serverChecking, waking: serverWaking, wake } = useServerActive(SIGNALING_URL, {
    proxyBaseUrl: '/api',
  });

  const defaultName = user?.fullName || user?.username || '';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomFromUrl = (params.get('room') || '').trim();
    const nameFromUrl = (params.get('name') || '').trim();

    if (roomFromUrl && !roomId) {
      setRoomId(roomFromUrl);
    }

    if (!defaultName && !displayName) {
      setDisplayName(nameFromUrl || generateGuestName());
    }
  }, [location.search, roomId, defaultName, displayName]);

  useEffect(() => {
    if (!joined) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setPreviewStream(stream);
          if (previewVideoRef.current) previewVideoRef.current.srcObject = stream;
        })
        .catch(err => console.error('Preview error:', err));
    }
    return () => {
      previewStream?.getTracks().forEach(t => t.stop());
    };
  }, [joined]);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await fetch('/api/rooms');
      if (!res.ok) return;
      const data = await res.json();
      setActiveRooms(Array.isArray(data?.rooms) ? data.rooms : []);
    } catch {
      // ignore
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (!serverActive) return;
    fetchRooms();
    const id = setInterval(fetchRooms, 5000);
    return () => clearInterval(id);
  }, [serverActive]);

  const quickJoin = () => {
    setError('');
    if (!serverActive) {
      setError('Server is in sleep mode. Please wake the server to start a call.');
      return;
    }
    const rid = DEFAULT_QUICK_ROOM;
    const name = (displayName || defaultName || 'Guest').trim();
    if (!name) {
      setError('Please enter a display name');
      return;
    }
    previewStream?.getTracks().forEach(t => t.stop());
    setRoomId(rid);
    setDisplayName(name);
    setJoined(true);
  };

  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const generateRandomRoom = () => {
    const prefixes = ['Secure', 'Shield', 'Guardian', 'Vigil', 'Safe', 'Elite', 'Alpha', 'Home', 'Sentry', 'Cyber'];
    const suffixes = ['Port', 'Gate', 'Nexus', 'Point', 'Zone', 'Hub', 'Node', 'Link', 'Sphere', 'Vault'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomNumber = Math.floor(100 + Math.random() * 899); // 3-digit number
    setRoomId(`${randomPrefix}-${randomSuffix}-${randomNumber}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');

    if (!serverActive) {
      setError('Server is in sleep mode. Please wake the server to start a call.');
      return;
    }

    const rid = roomId.trim();
    const name = (displayName || defaultName || 'Guest').trim();
    if (!rid) {
      setError('Please enter a room ID');
      return;
    }
    if (!name) {
      setError('Please enter a display name');
      return;
    }
    previewStream?.getTracks().forEach(t => t.stop());
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
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 style={styles.title}>VigilRoom Secure Video</h1>
      </header>

      <div style={styles.serverBanner}>
        <div style={styles.serverBannerLeft}>
          <div style={styles.serverPill}>
            <span style={{ ...styles.serverDot, background: serverActive ? '#10b981' : '#f59e0b' }} />
            <span style={styles.serverText}>
              {serverChecking ? 'Checking server...' : serverWaking ? 'Waking up server...' : serverActive ? 'Server Active' : 'Server Sleeping'}
            </span>
          </div>
          {!serverActive && !serverWaking && !serverChecking && (
            <span style={styles.serverHint}>Wake the server before joining a room.</span>
          )}
        </div>
        <div style={styles.serverBannerRight}>
          {!serverActive && (
            <button
              type="button"
              onClick={() => wake()}
              disabled={serverWaking || serverChecking}
              style={{
                ...styles.wakeBtn,
                opacity: serverWaking || serverChecking ? 0.7 : 1,
                cursor: serverWaking || serverChecking ? 'not-allowed' : 'pointer',
              }}
            >
              {serverWaking ? 'Waking...' : 'Wake Server'}
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.previewCard}>
          <div style={styles.videoWrapper}>
            <video ref={previewVideoRef} autoPlay playsInline muted style={styles.previewVideo} />
            {!previewStream && <div style={styles.videoBlocked}>Camera is off or blocked</div>}
          </div>
          <div style={styles.previewControls}>
            <div style={styles.statusDot}>●</div>
            <span style={styles.statusText}>Preview Mode</span>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Join Session</h2>
          <p style={styles.hint}>Enter or generate a room ID to connect securely with your family.</p>
          <form onSubmit={handleJoin} style={styles.form}>
            {error && <div style={styles.error}>{error}</div>}
            {!serverActive && (
              <div style={styles.info}>
                Server is in sleep mode. Click <strong>Wake Server</strong> above, then join.
              </div>
            )}
            <div style={styles.quickJoinWrap}>
              <button
                type="button"
                onClick={quickJoin}
                disabled={!serverActive}
                style={{
                  ...styles.quickJoinBtn,
                  opacity: serverActive ? 1 : 0.6,
                  cursor: serverActive ? 'pointer' : 'not-allowed',
                }}
              >
                Quick Join: {DEFAULT_QUICK_ROOM}
              </button>
            </div>

            <div style={styles.roomsPanel}>
              <div style={styles.roomsHeader}>
                <span style={styles.roomsTitle}>Active Rooms</span>
                <button type="button" onClick={fetchRooms} style={styles.roomsRefresh}>
                  Refresh
                </button>
              </div>
              <div style={styles.roomsList}>
                {roomsLoading ? (
                  <div style={styles.roomsEmpty}>Loading rooms...</div>
                ) : activeRooms.length === 0 ? (
                  <div style={styles.roomsEmpty}>No active rooms right now.</div>
                ) : (
                  activeRooms.slice(0, 10).map((r) => (
                    <button
                      key={r.roomId}
                      type="button"
                      onClick={() => setRoomId(r.roomId)}
                      style={styles.roomRow}
                      title="Click to set Room ID"
                    >
                      <span style={styles.roomRowId}>{r.roomId}</span>
                      <span style={styles.roomRowCount}>{r.count}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Room Identifier</label>
                <button type="button" onClick={generateRandomRoom} style={styles.randomBtn}>
                  🎲 Generate Random
                </button>
              </div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. Shield-Port-402"
                style={styles.input}
                disabled={!serverActive}
                autoFocus
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Display Name</label>
              <input
                type="text"
                value={displayName || defaultName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
                style={styles.input}
                disabled={!serverActive}
              />
            </div>
            <button type="submit" style={{ ...styles.joinBtn, opacity: serverActive ? 1 : 0.6, cursor: serverActive ? 'pointer' : 'not-allowed' }} disabled={!serverActive}>
              Enter Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0f1a',
    color: '#fff',
    padding: '40px 24px',
    fontFamily: '-apple-system, system-ui, sans-serif',
  },
  header: {
    maxWidth: '1000px',
    margin: '0 auto 40px auto',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  serverBanner: {
    maxWidth: '1000px',
    margin: '0 auto 26px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '14px 16px',
    borderRadius: '16px',
    background: 'rgba(30, 41, 59, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  serverBannerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  serverBannerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  serverPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '999px',
    background: 'rgba(2, 6, 23, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    width: 'fit-content',
  },
  serverDot: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    display: 'inline-block',
  },
  serverText: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  serverHint: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  wakeBtn: {
    background: '#f59e0b',
    border: 'none',
    color: '#0b1220',
    fontSize: '13px',
    fontWeight: '900',
    padding: '10px 14px',
    borderRadius: '12px',
  },
  backBtn: {
    width: '40px',
    height: '40px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#cbd5e1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  title: { margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', color: '#f8fafc' },
  content: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '40px',
    alignItems: 'start',
  },
  previewCard: {
    background: 'rgba(30, 41, 59, 0.3)',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  videoWrapper: {
    aspectRatio: '16/10',
    background: '#000',
    position: 'relative',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)', // Mirror effect
  },
  videoBlocked: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontSize: '14px',
  },
  previewControls: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0,0,0,0.2)',
  },
  statusDot: { color: '#3b82f6', fontSize: '10px' },
  statusText: { fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
  card: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '40px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  cardTitle: { margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700', color: '#f1f5f9' },
  hint: { margin: '0 0 32px 0', color: '#94a3b8', fontSize: '15px', lineHeight: '1.6' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  quickJoinWrap: { marginTop: '-6px' },
  quickJoinBtn: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    fontWeight: '900',
    textAlign: 'left',
  },
  roomsPanel: {
    padding: '14px',
    borderRadius: '16px',
    background: 'rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  roomsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  roomsTitle: { fontSize: '12px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
  roomsRefresh: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '800', fontSize: '12px' },
  roomsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  roomsEmpty: { color: '#64748b', fontSize: '13px', padding: '8px 2px' },
  roomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(2, 6, 23, 0.35)',
    color: '#e2e8f0',
    cursor: 'pointer',
    textAlign: 'left',
  },
  roomRowId: { fontSize: '13px', fontWeight: '700', color: '#e2e8f0' },
  roomRowCount: { fontSize: '12px', fontWeight: '900', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.12)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(59, 130, 246, 0.18)' },
  field: { display: 'flex', flexDirection: 'column', gap: '10px' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  randomBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    '&:hover': { background: 'rgba(59, 130, 246, 0.1)' }
  },
  input: {
    padding: '14px 18px',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    transition: 'all 0.2s',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    '&:focus': { border: '1px solid #3b82f6', background: 'rgba(15, 23, 42, 0.8)' }
  },
  error: {
    padding: '14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    color: '#fca5a5',
    fontSize: '14px',
  },
  info: {
    padding: '14px',
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.18)',
    borderRadius: '12px',
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  joinBtn: {
    padding: '16px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
    '&:hover': { background: '#2563eb', transform: 'translateY(-1px)' },
    '&:active': { transform: 'translateY(0)' }
  },
};

export default VideoCall;
