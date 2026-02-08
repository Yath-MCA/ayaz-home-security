import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../hooks/useSocket';
import useServerActive from '../hooks/useServerActive';

const IS_LOCAL = !import.meta.env.VITE_SIGNALING_URL;

const VideoCallRoom = ({ roomId, displayName, signalingUrl, onLeave, onBack }) => {
  const [myPeerId, setMyPeerId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const myPeerIdRef = useRef(null);
  const chatEndRef = useRef(null);

  const { active: serverActive, checking: serverChecking, waking: serverWaking, wake } = useServerActive(signalingUrl, {
    proxyBaseUrl: IS_LOCAL ? '' : '/api',
  });
  const { socket, connected: socketConnected, error: socketError } = useSocket(signalingUrl, {
    enabled: Boolean(signalingUrl) && serverActive && !serverWaking,
    transports: ['websocket'],
  });

  useEffect(() => { if (socketError?.message) setError(socketError.message); }, [socketError]);
  useEffect(() => { if (!serverActive && !serverChecking && !serverWaking) wake(); }, [serverActive, serverChecking, serverWaking, wake]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const joinRoom = () => {
      socket.emit('join-room', { roomId, displayName });
    };
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    socket.on('room-joined', async ({ peerId, participants: list }) => {
      myPeerIdRef.current = peerId;
      setMyPeerId(peerId);
      setConnected(true);
      setParticipants(list.map(p => ({ ...p, isMicOn: true, isCamOn: true })) || []);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        stream.getAudioTracks().forEach(t => t.enabled = false);
        stream.getVideoTracks().forEach(t => t.enabled = false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play?.().catch(() => {});
        }
      } catch (err) { setError('Could not access camera/microphone.'); }
    });

    socket.on('user-joined', async ({ peerId, participants: list }) => {
      setParticipants(list.map(p => ({ ...p, isMicOn: p.isMicOn ?? true, isCamOn: p.isCamOn ?? true })) || []);
      if (!localStreamRef.current) return;
      const pc = createPeerConnection(peerId, socket);
      peersRef.current[peerId] = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal', { to: peerId, type: 'offer', data: offer });
    });

    socket.on('signal', async ({ from, type, data }) => {
      let pc = peersRef.current[from];
      if (type === 'offer') {
        pc = createPeerConnection(from, socket);
        peersRef.current[from] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { to: from, type: 'answer', data: answer });
      } else if (type === 'answer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (type === 'ice' && pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      } else if (type === 'status-update') {
        setParticipants(prev => prev.map(p => p.id === from ? { ...p, ...data } : p));
      }
    });

    socket.on('user-left', ({ participants: list }) => {
      setParticipants(list.map(p => ({ ...p, isMicOn: true, isCamOn: true })) || []);
    });

    socket.on('chat-message', (msg) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && msg.from === myPeerIdRef.current && last.message === msg.message) return prev;
        return [...prev.slice(-199), msg];
      });
    });

    socket.on('error', (err) => setError(err.message || 'Connection error'));

    return () => {
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      socket.off('connect');
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('signal');
      socket.off('user-left');
      socket.off('chat-message');
      socket.off('error');
    };
  }, [roomId, displayName, socket]);

  const createPeerConnection = (peerId, socket) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }
    pc.ontrack = (e) => {
      const vid = remoteVideosRef.current[peerId];
      if (vid && vid.srcObject !== e.streams[0]) {
        vid.srcObject = e.streams[0];
        vid.play?.().catch(() => {});
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('signal', { to: peerId, type: 'ice', data: e.candidate });
    };
    return pc;
  };

  const toggleMic = () => {
    const v = !isMicOn; setIsMicOn(v);
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = v);
    socket?.emit('signal', { roomId, type: 'status-update', data: { isMicOn: v }, broadcast: true });
  };
  const toggleCam = () => {
    const v = !isCamOn; setIsCamOn(v);
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = v);
    socket?.emit('signal', { roomId, type: 'status-update', data: { isCamOn: v }, broadcast: true });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${encodeURIComponent(roomId)}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const t = chatInput.trim();
    if (!t || !socket) return;
    setMessages(prev => [...prev.slice(-199), { from: myPeerIdRef.current || myPeerId, displayName, message: t, timestamp: new Date().toISOString() }]);
    socket.emit('chat-message', t);
    setChatInput('');
  };

  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(peersRef.current).forEach(pc => pc.close());
    socket?.disconnect();
    onLeave();
  };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const initial = (name) => (name || '?')[0].toUpperCase();

  if (!serverActive || serverChecking || serverWaking) {
    return (
      <div style={st.page}>
        <div style={st.topBar}>
          <button onClick={onBack} style={st.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div style={st.topInfo}>
            <span style={st.topName}>{roomId}</span>
            <span style={st.topStatus}>{serverWaking ? 'Waking server...' : serverChecking ? 'Checking...' : 'Server offline'}</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8696a0' }}>
          Connecting...
        </div>
      </div>
    );
  }

  return (
    <div style={st.page}>
      {/* WhatsApp-style top bar */}
      <div style={st.topBar}>
        <button onClick={onBack} style={st.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div style={st.topInfo}>
          <span style={st.topName}>{roomId}</span>
          <span style={st.topStatus}>
            {connected ? `${participants.length + 1} participants` : 'connecting...'}
          </span>
        </div>
        <div style={st.topActions}>
          <button onClick={toggleCam} style={{ ...st.topIconBtn, color: isCamOn ? '#00a884' : '#8696a0' }} title={isCamOn ? 'Turn off camera' : 'Turn on camera'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
          <button onClick={copyLink} style={st.topIconBtn} title={copied ? 'Copied!' : 'Copy invite link'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
      </div>

      {error && <div style={st.errBar}>{error}</div>}

      {/* Main content area */}
      <div style={st.body}>
        {/* Video area */}
        <div style={st.videoArea}>
          <div style={st.videoGrid}>
            {/* Local video */}
            <div style={st.videoCard}>
              <video ref={localVideoRef} autoPlay playsInline muted style={st.video} />
              {!isCamOn && <div style={st.avatar}><span style={st.avatarText}>{initial(displayName)}</span></div>}
              <div style={st.nameTag}>
                {!isMicOn && <span style={st.muteBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>
                </span>}
                You
              </div>
            </div>
            {/* Remote videos */}
            {participants.map(p => (
              <div key={p.id} style={st.videoCard}>
                <video ref={el => { if (el) remoteVideosRef.current[p.id] = el; }} autoPlay playsInline style={st.video} />
                {!p.isCamOn && <div style={st.avatar}><span style={st.avatarText}>{initial(p.displayName)}</span></div>}
                <div style={st.nameTag}>
                  {!p.isMicOn && <span style={st.muteBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>
                  </span>}
                  {p.displayName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel (slides in) */}
        {showChat && (
          <div style={st.chatPanel}>
            <div style={st.chatHead}>
              <span style={st.chatHeadTitle}>Chat</span>
              <button onClick={() => setShowChat(false)} style={st.chatClose}>✕</button>
            </div>
            <div style={st.chatMessages}>
              {messages.length === 0 ? (
                <div style={st.chatEmpty}>No messages yet</div>
              ) : messages.map((m, i) => {
                const isMe = m.from === (myPeerIdRef.current || myPeerId);
                return (
                  <div key={i} style={{ ...st.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ ...st.bubble, background: isMe ? '#005c4b' : '#202c33' }}>
                      {!isMe && <div style={st.bubbleName}>{m.displayName}</div>}
                      <div style={st.bubbleText}>{m.message}</div>
                      <div style={st.bubbleTime}>{fmtTime(m.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} style={st.chatInputBar}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message" style={st.chatInput} />
              <button type="submit" style={st.sendBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom control bar — WhatsApp call style */}
      <div style={st.controls}>
        <button onClick={toggleMic} style={{ ...st.ctrlBtn, background: isMicOn ? '#3b4a54' : '#ea4335' }}>
          {isMicOn ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .87-.16 1.71-.46 2.49"/></svg>
          )}
        </button>
        <button onClick={toggleCam} style={{ ...st.ctrlBtn, background: isCamOn ? '#3b4a54' : '#ea4335' }}>
          {isCamOn ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          )}
        </button>
        <button onClick={() => setShowChat(!showChat)} style={{ ...st.ctrlBtn, background: showChat ? '#00a884' : '#3b4a54' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button onClick={leaveRoom} style={{ ...st.ctrlBtn, background: '#ea4335', width: '56px', height: '56px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" transform="rotate(135 12 12)"/></svg>
        </button>
      </div>
    </div>
  );
};

const st = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#111b21', color: '#e9edef', fontFamily: '-apple-system, system-ui, sans-serif', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#1f2c34', flexShrink: 0 },
  backBtn: { background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  topInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  topName: { fontSize: '16px', fontWeight: '600', color: '#e9edef' },
  topStatus: { fontSize: '12px', color: '#8696a0' },
  topActions: { display: 'flex', gap: '16px' },
  topIconBtn: { background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  errBar: { padding: '6px 16px', background: '#ea4335', color: '#fff', fontSize: '13px', textAlign: 'center', flexShrink: 0 },
  body: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' },
  videoArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '8px' },
  videoGrid: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '6px', alignContent: 'center' },
  videoCard: { position: 'relative', background: '#0b141a', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  avatar: { position: 'absolute', width: '72px', height: '72px', borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: '28px', fontWeight: '600', color: '#fff' },
  nameTag: { position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', color: '#e9edef', display: 'flex', alignItems: 'center', gap: '4px' },
  muteBadge: { display: 'inline-flex', background: '#ea4335', borderRadius: '50%', padding: '2px', marginRight: '2px' },
  chatPanel: { width: '320px', maxWidth: '100%', display: 'flex', flexDirection: 'column', background: '#111b21', borderLeft: '1px solid #2a3942', flexShrink: 0 },
  chatHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#1f2c34' },
  chatHeadTitle: { fontSize: '15px', fontWeight: '600', color: '#e9edef' },
  chatClose: { background: 'none', border: 'none', color: '#8696a0', fontSize: '18px', cursor: 'pointer' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1\' fill=\'%23ffffff08\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'url(%23p)\' width=\'200\' height=\'200\'/%3E%3C/svg%3E")' },
  chatEmpty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8696a0', fontSize: '14px' },
  msgRow: { display: 'flex' },
  bubble: { maxWidth: '80%', padding: '6px 8px 2px 8px', borderRadius: '8px', position: 'relative' },
  bubbleName: { fontSize: '12px', fontWeight: '600', color: '#00a884', marginBottom: '2px' },
  bubbleText: { fontSize: '14px', lineHeight: '1.4', color: '#e9edef', wordBreak: 'break-word' },
  bubbleTime: { fontSize: '11px', color: '#8696a0', textAlign: 'right', marginTop: '2px' },
  chatInputBar: { display: 'flex', gap: '8px', padding: '8px 12px', background: '#1f2c34' },
  chatInput: { flex: 1, background: '#2a3942', border: 'none', borderRadius: '8px', padding: '10px 14px', color: '#e9edef', fontSize: '14px', outline: 'none' },
  sendBtn: { width: '40px', height: '40px', background: '#00a884', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  controls: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px', background: '#1f2c34', flexShrink: 0 },
  ctrlBtn: { width: '48px', height: '48px', borderRadius: '50%', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' },
};

export default VideoCallRoom;
