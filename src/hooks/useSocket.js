import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(url, {
  enabled = true,
  autoConnect = true,
  transports = ['websocket'],
  extraOptions = {},
} = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const options = useMemo(() => {
    return {
      autoConnect: enabled && autoConnect,
      transports,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 10000,
      ...extraOptions,
    };
  }, [enabled, autoConnect, transports, extraOptions]);

  useEffect(() => {
    if (!url || !enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io(url, options);
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      setError(null);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (e) => {
      setConnected(false);
      setError(e);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, enabled, options]);

  return {
    socket: socketRef.current,
    connected,
    error,
  };
}
