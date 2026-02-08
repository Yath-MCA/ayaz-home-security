import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useServerActive from '../hooks/useServerActive';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3002';
const IS_LOCAL = !import.meta.env.VITE_SIGNALING_URL;
const DEFAULT_QUICK_ROOM = 'room-SHFY';

const generateGuestName = () => {
  const adjectives = ['Swift', 'Calm', 'Bright', 'Silent', 'Brave', 'Kind', 'Smart', 'Nova', 'Shadow', 'Crystal'];
  const nouns = ['Visitor', 'Guest', 'Watcher', 'Guardian', 'Friend', 'Helper', 'Member', 'Partner', 'Caller', 'User'];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a}${n}${Math.floor(100 + Math.random() * 900)}`;
};

const VideoCall = () => {
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { active: serverActive, checking: serverChecking, waking: serverWaking, wake } = useServerActive(SIGNALING_URL, {
    proxyBaseUrl: IS_LOCAL ? '' : '/api',
  });

  const defaultName = user?.fullName || user?.username || '';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomFromUrl = (params.get('room') || '').trim();
    const nameFromUrl = (params.get('name') || '').trim();
    if (roomFromUrl && !roomId) setRoomId(roomFromUrl);
    if (!defaultName && !displayName) setDisplayName(nameFromUrl || generateGuestName());
  }, [location.search, roomId, defaultName, displayName]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPermissionStatus('granted');
    } catch (err) {
      setPermissionStatus('denied');
    }
  };

  const requestPermissions = async () => {
    setPermissionStatus('requesting');
    await checkPermissions();
  };

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await fetch(IS_LOCAL ? `${SIGNALING_URL}/rooms` : '/api/rooms');
      if (!res.ok) return;
      const data = await res.json();
      setActiveRooms(Array.isArray(data?.rooms) ? data.rooms : []);
    } catch (e) { console.warn('[rooms]', e); }
    finally { setRoomsLoading(false); }
  };

  useEffect(() => {
    if (!serverActive) return;
    fetchRooms();
    const id = setInterval(fetchRooms, 5000);
    return () => clearInterval(id);
  }, [serverActive]);

  const goRoom = (rid) => {
    const name = (displayName || defaultName || 'Guest').trim();
    if (!name) { setError('Enter your name'); return; }
    navigate(`/room/${encodeURIComponent(rid)}`, { state: { displayName: name } });
  };

  const quickJoin = () => {
    setError('');
    if (!serverActive) { setError('Wake the server first'); return; }
    goRoom(DEFAULT_QUICK_ROOM);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (!serverActive) { setError('Wake the server first'); return; }
    const rid = roomId.trim();
    if (!rid) { setError('Enter a room ID'); return; }
    goRoom(rid);
  };

  const genRoom = () => {
    const w = ['Alpha', 'Bravo', 'Delta', 'Echo', 'Nova', 'Pulse', 'Zenith', 'Orbit', 'Apex', 'Shield'];
    setRoomId(`${w[Math.floor(Math.random()*w.length)]}-${w[Math.floor(Math.random()*w.length)]}-${Math.floor(100+Math.random()*899)}`);
  };

  return (
    <div style={st.page}>
      {/* Top bar */}
      <div style={st.topBar}>
        <button onClick={() => navigate('/')} style={st.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e9edef" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <span style={st.topTitle}>Video Call</span>
      </div>

      <div style={st.body}>
        {/* Server status */}
        <div style={st.serverRow}>
          <span style={{ ...st.dot, background: serverActive ? '#00a884' : '#f59e0b' }} />
          <span style={st.serverLabel}>
            {serverChecking ? 'Checking...' : serverWaking ? 'Waking...' : serverActive ? 'Server Online' : 'Server Sleeping'}
          </span>
          {!serverActive && !serverWaking && !serverChecking && (
            <button onClick={() => wake()} style={st.wakeBtn}>Wake</button>
          )}
        </div>

        {/* Permission Status */}
        <div style={st.permissionCard}>
          {permissionStatus === 'checking' && (
            <div style={st.permissionContent}>
              <div style={st.permissionIcon}>🔍</div>
              <div style={st.permissionText}>Checking permissions...</div>
            </div>
          )}
          {permissionStatus === 'granted' && (
            <div style={st.permissionContent}>
              <div style={{ ...st.permissionIcon, color: '#00a884' }}>✓</div>
              <div style={st.permissionText}>Camera & Mic Access Enabled</div>
              <div style={st.permissionHint}>Ready to join video call</div>
            </div>
          )}
          {permissionStatus === 'denied' && (
            <div style={st.permissionContent}>
              <div style={{ ...st.permissionIcon, color: '#ea4335' }}>✕</div>
              <div style={st.permissionText}>Camera & Mic Access Disabled</div>
              <div style={st.permissionHint}>Click below to enable</div>
              <button onClick={requestPermissions} style={st.enableBtn} disabled={permissionStatus === 'requesting'}>
                {permissionStatus === 'requesting' ? 'Requesting...' : 'Enable Access'}
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} style={st.form}>
          {error && <div style={st.error}>{error}</div>}

          <input
            type="text"
            value={displayName || defaultName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={st.input}
            disabled={!serverActive}
          />

          <button type="button" onClick={quickJoin} disabled={!serverActive} style={{ ...st.quickBtn, opacity: serverActive ? 1 : 0.5 }}>
            Quick Join: {DEFAULT_QUICK_ROOM}
          </button>

          {/* Active rooms */}
          {activeRooms.length > 0 && (
            <div style={st.roomsList}>
              <div style={st.roomsLabel}>Active Rooms</div>
              {activeRooms.slice(0, 6).map(r => (
                <button key={r.roomId} type="button" onClick={() => { setRoomId(r.roomId); goRoom(r.roomId); }} style={st.roomItem}>
                  <span style={st.roomName}>{r.roomId}</span>
                  <span style={st.roomCount}>{r.count}</span>
                </button>
              ))}
            </div>
          )}

          <div style={st.roomInputRow}>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              placeholder="Room ID"
              style={{ ...st.input, flex: 1 }}
              disabled={!serverActive}
            />
            <button type="button" onClick={genRoom} style={st.genBtn} title="Random room">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
          </div>

          <button type="submit" disabled={!serverActive} style={{ ...st.joinBtn, opacity: serverActive ? 1 : 0.5 }}>
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

const st = {
  page: { minHeight: '100vh', background: '#111b21', color: '#e9edef', fontFamily: '-apple-system, system-ui, sans-serif', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#1f2c34' },
  backBtn: { background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  topTitle: { fontSize: '18px', fontWeight: '600', color: '#e9edef' },
  body: { flex: 1, maxWidth: '440px', width: '100%', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' },
  serverRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#1f2c34', borderRadius: '10px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  serverLabel: { flex: 1, fontSize: '13px', fontWeight: '600', color: '#aebac1' },
  wakeBtn: { background: '#f59e0b', border: 'none', color: '#111b21', fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' },
  permissionCard: { padding: '32px 20px', borderRadius: '12px', background: '#1f2c34', textAlign: 'center' },
  permissionContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  permissionIcon: { fontSize: '48px', lineHeight: 1 },
  permissionText: { fontSize: '16px', fontWeight: '600', color: '#e9edef' },
  permissionHint: { fontSize: '13px', color: '#8696a0' },
  enableBtn: { marginTop: '8px', padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#00a884', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  error: { padding: '10px 14px', background: 'rgba(234,67,53,0.15)', borderRadius: '8px', color: '#f87171', fontSize: '13px' },
  input: { padding: '12px 14px', background: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  quickBtn: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: 'none', background: '#00a884', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textAlign: 'center' },
  roomsList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  roomsLabel: { fontSize: '11px', fontWeight: '700', color: '#8696a0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' },
  roomItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#1f2c34', border: 'none', color: '#e9edef', cursor: 'pointer', width: '100%', textAlign: 'left' },
  roomName: { fontSize: '14px', fontWeight: '500' },
  roomCount: { fontSize: '12px', fontWeight: '700', color: '#00a884', background: 'rgba(0,168,132,0.12)', padding: '2px 8px', borderRadius: '12px' },
  roomInputRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  genBtn: { width: '44px', height: '44px', background: '#2a3942', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  joinBtn: { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#00a884', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer' },
};

export default VideoCall;
