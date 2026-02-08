import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const VideoCallRoom = ({ roomId, displayName, signalingUrl, onLeave, onBack }) => {
  const [myPeerId, setMyPeerId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  // A/V States - Default to OFF as requested
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const myPeerIdRef = useRef(null);

  useEffect(() => {
    const socket = io(signalingUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId, displayName });
    });

    socket.on('room-joined', async ({ peerId, participants: list }) => {
      myPeerIdRef.current = peerId;
      setMyPeerId(peerId);
      setConnected(true);
      setParticipants(list.map(p => ({ ...p, isMicOn: false, isCamOn: false })) || []);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Disable tracks immediately after getting permission
        stream.getAudioTracks().forEach(track => track.enabled = false);
        stream.getVideoTracks().forEach(track => track.enabled = false);

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Broadcast initial "Off" status to everyone
        socket.emit('signal', { roomId, type: 'status-update', data: { isMicOn: false, isCamOn: false }, broadcast: true });
      } catch (err) {
        setError('Could not access camera/microphone.');
      }
    });

    socket.on('user-joined', async ({ peerId, displayName: name, participants: list }) => {
      setParticipants(list.map(p => ({ ...p, isMicOn: p.isMicOn ?? false, isCamOn: p.isCamOn ?? false })) || []);
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
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && msg.from === myPeerIdRef.current && last.message === msg.message) return prev;
        return [...prev.slice(-199), msg];
      });
    });

    socket.on('error', (err) => setError(err.message || 'Connection error'));

    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      socket.disconnect();
    };
  }, [roomId, displayName, signalingUrl]);

  const createPeerConnection = (peerId, socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    pc.ontrack = (e) => {
      const vid = remoteVideosRef.current[peerId];
      if (vid && vid.srcObject !== e.streams[0]) {
        vid.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('signal', { to: peerId, type: 'ice', data: e.candidate });
    };

    return pc;
  };

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = newState);
    }
    socketRef.current?.emit('signal', { roomId, type: 'status-update', data: { isMicOn: newState }, broadcast: true });
  };

  const toggleCam = () => {
    const newState = !isCamOn;
    setIsCamOn(newState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = newState);
    }
    socketRef.current?.emit('signal', { roomId, type: 'status-update', data: { isCamOn: newState }, broadcast: true });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;
    const payload = {
      from: myPeerIdRef.current || myPeerId,
      displayName,
      message: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev.slice(-199), payload]);
    socketRef.current.emit('chat-message', text);
    setChatInput('');
  };

  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peersRef.current).forEach((pc) => pc.close());
    socketRef.current?.disconnect();
    onLeave();
  };

  const IconMic = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
  const IconMicOff = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
  const IconCam = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
  const IconCamOff = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
  const IconChat = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
  const IconLeave = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBack} style={styles.navBtn}>✕</button>
          <div style={styles.roomInfo}>
            <span style={styles.roomLabel}>SECURE ROOM</span>
            <div style={styles.roomIdRow} onClick={copyRoomId}>
              <span style={styles.roomIdText}>{roomId}</span>
              <span style={styles.copyBadge}>{copied ? 'Copied!' : 'Copy'}</span>
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {connected && <div style={styles.statusIndicator}>● <span style={{ fontSize: '11px' }}>LIVE</span></div>}
          <div style={styles.participantCount}>
            {participants.length + 1} Participant{participants.length !== 0 ? 's' : ''}
          </div>
        </div>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.main}>
        <div style={styles.videoSection}>
          <div style={styles.videoGrid}>
            <div style={styles.videoTile}>
              <video ref={localVideoRef} autoPlay playsInline muted style={styles.video} />
              {!isCamOn && <div style={styles.videoPlaceholder}>{displayName[0]}</div>}
              <div style={styles.videoLabel}>
                {!isMicOn && <span style={styles.muteIcon}>🔇</span>}
                You ({displayName})
              </div>
            </div>
            {participants.filter((p) => p.id !== myPeerId).map((p) => (
              <div key={p.id} style={styles.videoTile}>
                <video
                  ref={(el) => { remoteVideosRef.current[p.id] = el; }}
                  autoPlay
                  playsInline
                  style={styles.video}
                />
                {!p.isCamOn && <div style={styles.videoPlaceholder}>{p.displayName?.[0] || '?'}</div>}
                <div style={styles.videoLabel}>
                  {!p.isMicOn && <span style={styles.muteIcon}>🔇</span>}
                  {p.displayName}
                </div>
              </div>
            ))}
          </div>

          {/* Floating Control Bar */}
          <div style={styles.controlBar}>
            <button onClick={toggleMic} style={{ ...styles.controlBtn, background: isMicOn ? 'rgba(71, 85, 105, 0.4)' : '#ef4444' }}>
              {isMicOn ? <IconMic /> : <IconMicOff />}
            </button>
            <button onClick={toggleCam} style={{ ...styles.controlBtn, background: isCamOn ? 'rgba(71, 85, 105, 0.4)' : '#ef4444' }}>
              {isCamOn ? <IconCam /> : <IconCamOff />}
            </button>
            <button onClick={() => setShowChat(!showChat)} style={{ ...styles.controlBtn, background: showChat ? '#3b82f6' : 'rgba(71, 85, 105, 0.4)' }}>
              <IconChat />
            </button>
            <button onClick={leaveRoom} style={{ ...styles.controlBtn, background: 'rgba(239, 68, 68, 0.8)', marginLeft: '12px' }}>
              <IconLeave />
            </button>
          </div>
        </div>

        {showChat && (
          <div style={styles.chatSection}>
            <div style={styles.chatHeader}>
              <h3 style={styles.chatTitle}>Room Chat</h3>
            </div>
            <div style={styles.chatMessages}>
              {messages.length === 0 ? (
                <div style={styles.chatEmpty}>No messages yet.</div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.from === (myPeerIdRef.current || myPeerId);
                  return (
                    <div key={i} style={{ ...styles.chatRow, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && <span style={styles.chatName}>{m.displayName}</span>}
                      <div style={{
                        ...styles.chatBubble,
                        backgroundColor: isMe ? '#3b82f6' : 'rgba(71, 85, 105, 0.3)',
                        borderBottomRightRadius: isMe ? '2px' : '12px',
                        borderBottomLeftRadius: isMe ? '12px' : '2px',
                      }}>
                        {m.message}
                      </div>
                      <span style={styles.chatTime}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={sendMessage} style={styles.chatForm}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                style={styles.chatInput}
              />
              <button type="submit" style={styles.chatSend}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    background: '#0a0f1a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: '-apple-system, system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(10, 15, 26, 0.8)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    zIndex: 10,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  navBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background 0.2s',
    '&:hover': { background: 'rgba(255,255,255,0.1)' }
  },
  roomInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  roomLabel: { fontSize: '10px', fontWeight: '800', color: '#3b82f6', letterSpacing: '1px' },
  roomIdRow: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  roomIdText: { fontSize: '16px', fontWeight: '600', color: '#e2e8f0' },
  copyBadge: { fontSize: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  statusIndicator: { display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '700' },
  participantCount: { fontSize: '13px', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' },
  errorBanner: {
    padding: '8px 24px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '13px',
    textAlign: 'center',
  },
  main: {
    flex: 1,
    display: 'flex',
    padding: '16px',
    gap: '16px',
    overflow: 'hidden',
  },
  videoSection: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    background: '#05070a',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  videoGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gridAutoRows: '1fr',
    gap: '12px',
    padding: '12px',
    alignContent: 'center',
  },
  videoTile: {
    position: 'relative',
    background: '#111827',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  videoPlaceholder: {
    position: 'absolute',
    width: '80px',
    height: '80px',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '32px',
    fontWeight: '700',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
  },
  videoLabel: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  muteIcon: { fontSize: '14px' },
  controlBar: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(16px)',
    padding: '12px 20px',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
  },
  controlBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  chatSection: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  chatHeader: { padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' },
  chatTitle: { margin: 0, fontSize: '15px', fontWeight: '600' },
  chatMessages: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  chatRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  chatName: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginLeft: '4px' },
  chatBubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#f1f5f9',
  },
  chatTime: { fontSize: '10px', color: '#64748b', marginTop: '2px' },
  chatEmpty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '14px' },
  chatForm: {
    padding: '16px',
    display: 'flex',
    gap: '8px',
    background: 'rgba(0,0,0,0.2)',
  },
  chatInput: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  chatSend: {
    width: '38px',
    height: '38px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
};

export default VideoCallRoom;

