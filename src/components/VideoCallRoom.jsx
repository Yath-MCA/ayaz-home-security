import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const VideoCallRoom = ({ roomId, displayName, signalingUrl, onLeave, onBack }) => {
  const [myPeerId, setMyPeerId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
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
      setParticipants(list || []);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        setError('Could not access camera/microphone.');
      }
    });

    socket.on('user-joined', async ({ peerId, displayName: name, participants: list }) => {
      setParticipants(list || []);
      if (!localStreamRef.current) return;
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      pc.ontrack = (e) => {
        const vid = remoteVideosRef.current[peerId];
        if (vid && vid.srcObject !== e.streams[0]) {
          vid.srcObject = e.streams[0];
        }
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('signal', { to: peerId, type: 'ice', data: e.candidate });
      };
      peersRef.current[peerId] = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal', { to: peerId, type: 'offer', data: offer });
    });

    socket.on('signal', async ({ from, type, data }) => {
      let pc = peersRef.current[from];
      if (type === 'offer') {
        pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pc.ontrack = (e) => {
          const vid = remoteVideosRef.current[from];
          if (vid && vid.srcObject !== e.streams[0]) vid.srcObject = e.streams[0];
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('signal', { to: from, type: 'ice', data: e.candidate });
        };
        peersRef.current[from] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { to: from, type: 'answer', data: answer });
      } else if (type === 'answer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (type === 'ice' && pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });

    socket.on('user-left', ({ participants: list }) => {
      setParticipants(list || []);
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

  const sendMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;
    if (!socketRef.current.connected) {
      setError('Not connected. Reconnecting...');
      return;
    }
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBack} style={styles.navBtn}>Back</button>
          <span style={styles.roomBadge}>Room: {roomId}</span>
          {connected && <span style={styles.liveBadge}>● Live</span>}
        </div>
        <button onClick={leaveRoom} style={styles.leaveBtn}>Leave room</button>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.main}>
        <div style={styles.videoSection}>
          <div style={styles.videoGrid}>
            <div style={styles.videoTile}>
              <video ref={localVideoRef} autoPlay playsInline muted style={styles.video} />
              <div style={styles.videoLabel}>You ({displayName})</div>
            </div>
            {participants.filter((p) => p.id !== myPeerId).map((p) => (
              <div key={p.id} style={styles.videoTile}>
                <video
                  ref={(el) => { remoteVideosRef.current[p.id] = el; }}
                  autoPlay
                  playsInline
                  style={styles.video}
                />
                <div style={styles.videoLabel}>{p.displayName}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chatSection}>
          <h3 style={styles.chatTitle}>💬 Chat</h3>
          <div style={styles.chatMessages}>
            {messages.length === 0 ? (
              <div style={styles.chatEmpty}>No messages yet. Say hello!</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} style={styles.chatRow}>
                  <span style={styles.chatName}>{m.displayName}:</span>
                  <span style={styles.chatText}>{m.message}</span>
                </div>
              ))
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
            <button type="submit" style={styles.chatSend}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: 'rgba(15, 23, 42, 0.9)',
    borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  navBtn: {
    padding: '8px 16px',
    background: 'rgba(71, 85, 105, 0.5)',
    border: '1px solid rgba(71, 85, 105, 0.8)',
    borderRadius: '8px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '14px',
  },
  roomBadge: { fontSize: '14px', color: '#94a3b8' },
  liveBadge: { fontSize: '12px', color: '#22c55e', fontWeight: '600' },
  leaveBtn: {
    padding: '8px 20px',
    background: 'rgba(239, 68, 68, 0.3)',
    border: '1px solid rgba(239, 68, 68, 0.6)',
    borderRadius: '8px',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  errorBanner: {
    padding: '12px 24px',
    background: 'rgba(239, 68, 68, 0.2)',
    borderBottom: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#fca5a5',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px',
    padding: '24px',
    overflow: 'hidden',
  },
  videoSection: { minHeight: 0, display: 'flex', flexDirection: 'column' },
  videoGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    alignContent: 'start',
    overflow: 'auto',
  },
  videoTile: {
    position: 'relative',
    background: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '16/10',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  videoLabel: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    background: 'rgba(0,0,0,0.6)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  chatSection: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    overflow: 'hidden',
    minHeight: 0,
  },
  chatTitle: { margin: '12px 16px', fontSize: '16px', fontWeight: '600' },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '200px',
  },
  chatEmpty: { color: '#64748b', fontSize: '14px' },
  chatRow: { fontSize: '14px' },
  chatName: { color: '#93c5fd', marginRight: '6px' },
  chatText: { color: '#e2e8f0' },
  chatForm: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid rgba(71, 85, 105, 0.3)',
  },
  chatInput: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
  },
  chatSend: {
    padding: '10px 20px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default VideoCallRoom;
