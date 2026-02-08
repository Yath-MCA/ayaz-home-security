import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useSocket from '../hooks/useSocket';
import useServerActive from '../hooks/useServerActive';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3002';
const IS_LOCAL = !import.meta.env.VITE_SIGNALING_URL;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

const ChatRoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const stateDisplayName = location.state?.displayName || '';
  const queryName = new URLSearchParams(location.search).get('name') || '';
  const authName = user?.fullName || user?.username || '';
  const displayName = stateDisplayName || queryName || authName || 'Guest';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [lightboxImg, setLightboxImg] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const myIdRef = useRef(null);

  const { active: serverActive, checking: serverChecking, waking: serverWaking, wake } = useServerActive(SIGNALING_URL, {
    proxyBaseUrl: IS_LOCAL ? '' : '/api',
  });
  const { socket, connected: socketConnected, error: socketError } = useSocket(SIGNALING_URL, {
    enabled: Boolean(SIGNALING_URL) && serverActive && !serverWaking,
    transports: ['websocket'],
  });

  useEffect(() => { if (!roomId) navigate('/chat', { replace: true }); }, [roomId, navigate]);
  useEffect(() => { if (socketError?.message) setError(socketError.message); }, [socketError]);
  useEffect(() => { if (!serverActive && !serverChecking && !serverWaking) wake(); }, [serverActive, serverChecking, serverWaking, wake]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const joinRoom = () => { socket.emit('join-room', { roomId, displayName }); };
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    socket.on('room-joined', ({ peerId, participants: list }) => {
      myIdRef.current = peerId;
      setConnected(true);
      setParticipants(list || []);
    });
    socket.on('user-joined', ({ participants: list }) => setParticipants(list || []));
    socket.on('user-left', ({ participants: list }) => setParticipants(list || []));
    socket.on('chat-msg', (msg) => setMessages(prev => [...prev.slice(-499), msg]));
    socket.on('error', (err) => setError(err.message || 'Connection error'));

    return () => {
      socket.off('connect', joinRoom);
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('chat-msg');
      socket.off('error');
    };
  }, [socket, roomId, displayName]);

  const sendText = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !socket) return;
    socket.emit('chat-text', { roomId, text: t });
    setText('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { setError('Image must be under 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const sendImage = () => {
    if (!imagePreview || !socket) return;
    socket.emit('chat-image', { roomId, image: imagePreview, caption: imageCaption.trim() });
    setImagePreview(null);
    setImageCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelImage = () => {
    setImagePreview(null);
    setImageCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${encodeURIComponent(roomId)}`);
  };

  const leaveRoom = () => { socket?.disconnect(); navigate('/chat'); };
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!roomId) return null;

  if (!serverActive || serverChecking || serverWaking) {
    return (
      <div style={st.page}>
        <div style={st.topBar}>
          <button onClick={() => navigate('/chat')} style={st.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div style={st.topInfo}>
            <span style={st.topName}>{roomId}</span>
            <span style={st.topSub}>{serverWaking ? 'Waking server...' : serverChecking ? 'Checking...' : 'Server offline'}</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8696a0' }}>Connecting...</div>
      </div>
    );
  }

  return (
    <div style={st.page}>
      {/* Top bar */}
      <div style={st.topBar}>
        <button onClick={leaveRoom} style={st.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e9edef" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div style={st.topInfo}>
          <span style={st.topName}>{roomId}</span>
          <span style={st.topSub}>
            {connected ? `${participants.length + 1} participants` : 'connecting...'}
          </span>
        </div>
        <div style={st.topActions}>
          <button onClick={copyLink} style={st.topIconBtn} title="Copy invite link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
      </div>

      {error && <div style={st.errBar}>{error}</div>}

      {/* Messages */}
      <div style={st.messagesArea}>
        {messages.length === 0 ? (
          <div style={st.emptyChat}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>💬</div>
            <div style={{ color: '#8696a0', fontSize: '14px' }}>No messages yet. Say hello!</div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.from === myIdRef.current;
            return (
              <div key={msg.id} style={{ ...st.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ ...st.bubble, background: isMe ? '#005c4b' : '#202c33' }}>
                  {!isMe && <div style={st.bubbleName}>{msg.displayName}</div>}
                  {msg.type === 'image' ? (
                    <div>
                      <img src={msg.image} alt="" style={st.bubbleImg} onClick={() => setLightboxImg(msg.image)} />
                      {msg.caption && <div style={st.bubbleCaption}>{msg.caption}</div>}
                    </div>
                  ) : (
                    <div style={st.bubbleText}>{msg.text}</div>
                  )}
                  <div style={st.bubbleTime}>{fmtTime(msg.timestamp)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview bar */}
      {imagePreview && (
        <div style={st.previewBar}>
          <img src={imagePreview} alt="preview" style={st.previewThumb} />
          <input type="text" value={imageCaption} onChange={e => setImageCaption(e.target.value)} placeholder="Add caption..." style={st.captionInput} />
          <button onClick={sendImage} style={st.previewSend}>Send</button>
          <button onClick={cancelImage} style={st.previewCancel}>✕</button>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={sendText} style={st.inputBar}>
        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
        <button type="button" onClick={() => fileInputRef.current?.click()} style={st.attachBtn} title="Send image">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Type a message" style={st.textInput} autoFocus />
        <button type="submit" style={st.sendBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>

      {/* Lightbox */}
      {lightboxImg && (
        <div style={st.lightbox} onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" style={st.lightboxImg} />
        </div>
      )}
    </div>
  );
};

const st = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#0b141a', color: '#e9edef', fontFamily: '-apple-system, system-ui, sans-serif', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#1f2c34', flexShrink: 0 },
  backBtn: { background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  topInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  topName: { fontSize: '16px', fontWeight: '600', color: '#e9edef' },
  topSub: { fontSize: '12px', color: '#8696a0' },
  topActions: { display: 'flex', gap: '12px' },
  topIconBtn: { background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  errBar: { padding: '6px 16px', background: '#ea4335', color: '#fff', fontSize: '13px', textAlign: 'center', flexShrink: 0 },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1\' fill=\'%23ffffff06\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'url(%23p)\' width=\'200\' height=\'200\'/%3E%3C/svg%3E")' },
  emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  msgRow: { display: 'flex' },
  bubble: { maxWidth: '75%', padding: '6px 8px 2px 8px', borderRadius: '8px' },
  bubbleName: { fontSize: '12px', fontWeight: '600', color: '#00a884', marginBottom: '2px' },
  bubbleText: { fontSize: '14px', lineHeight: '1.45', color: '#e9edef', wordBreak: 'break-word' },
  bubbleImg: { width: '100%', maxWidth: '260px', maxHeight: '280px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', display: 'block' },
  bubbleCaption: { fontSize: '13px', color: '#d1d7db', marginTop: '4px' },
  bubbleTime: { fontSize: '11px', color: '#8696a0', textAlign: 'right', marginTop: '2px' },
  previewBar: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: '#1f2c34', borderTop: '1px solid #2a3942', flexShrink: 0 },
  previewThumb: { width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' },
  captionInput: { flex: 1, background: '#2a3942', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#e9edef', fontSize: '13px', outline: 'none' },
  previewSend: { background: '#00a884', border: 'none', borderRadius: '8px', color: '#fff', padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  previewCancel: { background: 'none', border: 'none', color: '#8696a0', fontSize: '18px', cursor: 'pointer' },
  inputBar: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#1f2c34', flexShrink: 0 },
  attachBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' },
  textInput: { flex: 1, background: '#2a3942', border: 'none', borderRadius: '8px', padding: '10px 14px', color: '#e9edef', fontSize: '14px', outline: 'none' },
  sendBtn: { width: '40px', height: '40px', background: '#00a884', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  lightbox: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, cursor: 'pointer' },
  lightboxImg: { maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '4px' },
};

export default ChatRoomPage;
