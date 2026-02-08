import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../hooks/useSocket';
import useServerActive from '../hooks/useServerActive';

const VideoCallRoom = ({ roomId, displayName, signalingUrl, onLeave, onBack }) => {
  const [myPeerId, setMyPeerId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const { active: serverActive, checking: serverChecking, waking: serverWaking, wake } = useServerActive(signalingUrl, {
    proxyBaseUrl: '/api',
  });
  const { socket, connected: socketConnected, error: socketError } = useSocket(signalingUrl, {
    enabled: Boolean(signalingUrl) && serverActive && !serverWaking,
    transports: ['websocket'],
  });

  // A/V States - Default to ON
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const myPeerIdRef = useRef(null);

  useEffect(() => {
    if (socketError?.message) {
      setError(socketError.message);
    }
  }, [socketError]);

  useEffect(() => {
    if (!serverActive && !serverChecking && !serverWaking) {
      // Cold start / sleeping instance: trigger wake.
      wake();
    }
  }, [serverActive, serverChecking, serverWaking, wake]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId, displayName });
    });

    socket.on('room-joined', async ({ peerId, participants: list }) => {
      myPeerIdRef.current = peerId;
      setMyPeerId(peerId);
      setConnected(true);
      setParticipants(list.map(p => ({ ...p, isMicOn: true, isCamOn: true })) || []);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        setError('Could not access camera/microphone.');
      }
    });

    socket.on('user-joined', async ({ peerId, displayName: name, participants: list }) => {
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
    socket?.emit('signal', { roomId, type: 'status-update', data: { isMicOn: newState }, broadcast: true });
  };

  const toggleCam = () => {
    const newState = !isCamOn;
    setIsCamOn(newState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = newState);
    }
    socket?.emit('signal', { roomId, type: 'status-update', data: { isCamOn: newState }, broadcast: true });
  };

  const copyRoomId = () => {
    const url = `${window.location.origin}/video-call?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform) => {
    const url = `${window.location.origin}/video-call?room=${roomId}`;
    const text = `Join my secure video room on VigilSafe: ${roomId}`;
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp': shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`; break;
      case 'telegram': shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`; break;
      default: copyRoomId(); return;
    }
    window.open(shareUrl, '_blank');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !socket) return;
    const payload = {
      from: myPeerIdRef.current || myPeerId,
      displayName,
      message: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev.slice(-199), payload]);
    socket.emit('chat-message', text);
    setChatInput('');
  };

  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peersRef.current).forEach((pc) => pc.close());
    socket?.disconnect();
    onLeave();
  };

  const IconWhatsApp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(37, 211, 102, 0.2))' }}>
      <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  const IconTelegram = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 136, 204, 0.2))' }}>
      <circle cx="12" cy="12" r="12" fill="#0088cc" />
      <path fill="#fff" d="M5.491 11.721l14.896-5.744c.691-.252 1.291.161 1.066.822l-2.536 11.954c-.191.854-.697 1.066-1.413.662l-3.868-2.852-1.865 1.795c-.206.206-.38.38-.778.38l.277-3.927 7.147-6.457c.311-.277-.068-.431-.483-.154l-8.834 5.561-3.804-1.19c-.827-.258-.843-.827.172-1.229z" />
    </svg>
  );

  const IconShare = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
  const IconMic = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
  const IconMicOff = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
  const IconCam = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
  const IconCamOff = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
  const IconChat = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
  const IconLeave = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

  if (!serverActive || serverChecking || serverWaking) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={onBack} style={styles.navBtn}>✕</button>
            <div style={styles.roomInfo}>
              <span style={styles.roomLabel}>SECURE ROOM</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={styles.roomIdText}>{roomId}</span>
              </div>
            </div>
          </div>
        </header>
        <div style={{ padding: '24px' }}>
          <div style={styles.errorBanner}>
            {serverWaking ? 'Waking up server...' : serverChecking ? 'Checking server status...' : 'Server is offline'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBack} style={styles.navBtn}>✕</button>
          <div style={styles.roomInfo}>
            <span style={styles.roomLabel}>SECURE ROOM</span>
            <div style={styles.roomIdRow} onClick={copyRoomId}>
              <span style={styles.roomIdText}>{roomId}</span>
              <span style={styles.copyBadge}>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.socialShare}>
            <span style={styles.shareLabel}>Invite Friends & Families</span>
            <button onClick={() => shareToSocial('whatsapp')} style={styles.shareIconBtn} title="Share to WhatsApp">
              <IconWhatsApp />
            </button>
            <button onClick={() => shareToSocial('telegram')} style={styles.shareIconBtn} title="Share to Telegram">
              <IconTelegram />
            </button>
          </div>
          {(connected || socketConnected) && <div style={styles.statusIndicator}>● <span style={{ fontSize: '11px' }}>LIVE</span></div>}
          <div style={styles.participantCount} title={participants.map(p => p.displayName).join(', ')}>
            👥 {participants.length + 1}
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
                {!isMicOn && <span style={styles.muteIndicator}>🔇</span>}
                You ({displayName})
              </div>
            </div>
            {participants.map((p) => (
              <div key={p.id} style={styles.videoTile}>
                <video
                  ref={(el) => { if (el) remoteVideosRef.current[p.id] = el; }}
                  autoPlay
                  playsInline
                  style={styles.video}
                />
                {!p.isCamOn && <div style={styles.videoPlaceholder}>{p.displayName?.[0] || '?'}</div>}
                <div style={styles.videoLabel}>
                  {!p.isMicOn && <span style={styles.muteIndicator}>🔇</span>}
                  {p.displayName}
                </div>
              </div>
            ))}
          </div>

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
            <button onClick={copyRoomId} style={styles.controlBtn}>
              <IconShare />
            </button>
            <button onClick={leaveRoom} style={{ ...styles.controlBtn, background: 'rgba(239, 68, 68, 0.8)', marginLeft: '12px' }}>
              <IconLeave />
            </button>
          </div>
        </div>

        {showChat && (
          <div style={styles.chatSection}>
            <div style={styles.chatHeader}>
              <h3 style={styles.chatTitle}>Participants ({participants.length + 1})</h3>
            </div>
            <div style={styles.participantList}>
              <div style={styles.participantRow}>
                <span style={styles.pCircle}>●</span>
                <span style={styles.pName}>{displayName} (You)</span>
              </div>
              {participants.map(p => (
                <div key={p.id} style={styles.participantRow}>
                  <span style={{ ...styles.pCircle, color: '#10b981' }}>●</span>
                  <span style={styles.pName}>{p.displayName}</span>
                </div>
              ))}
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
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
                placeholder="Message..."
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
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  socialShare: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' },
  shareLabel: { fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginRight: '4px' },
  shareIconBtn: {
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      background: 'rgba(255,255,255,0.05)',
    }
  },
  statusIndicator: { display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '700' },
  participantCount: { fontSize: '13px', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
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
  muteIndicator: { background: '#ef4444', padding: '2px', borderRadius: '4px', fontSize: '10px' },
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
    transition: 'all 0.2s',
    background: 'rgba(71, 85, 105, 0.4)',
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
  participantList: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  participantRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  pCircle: { fontSize: '10px', color: '#64748b' },
  pName: { fontSize: '13px', color: '#cbd5e1' },
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
