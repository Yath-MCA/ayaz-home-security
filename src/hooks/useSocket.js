import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(url, {
  enabled = true,
  transports = ['websocket'],
} = {}) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const transportsRef = useRef(transports);

  useEffect(() => {
    if (!url || !enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = io(url, {
      autoConnect: true,
      transports: transportsRef.current,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 10000,
    });
    socketRef.current = s;
    setSocket(s);

    const onConnect = () => {
      console.log('[useSocket] connected', s.id);
      setConnected(true);
      setError(null);
    };
    const onDisconnect = () => {
      console.log('[useSocket] disconnected');
      setConnected(false);
    };
    const onConnectError = (e) => {
      console.log('[useSocket] connect_error', e?.message);
      setConnected(false);
      setError(e);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [url, enabled]);

  return {
    socket,
    connected,
    error,
  };
}
