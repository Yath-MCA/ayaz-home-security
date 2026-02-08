import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function useServerActive(baseUrl, {
  pollIntervalMs = 0,
} = {}) {
  const [active, setActive] = useState(true);
  const [checking, setChecking] = useState(false);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  const normalizedBaseUrl = useMemo(() => {
    if (!baseUrl) return '';
    return baseUrl.replace(/\/$/, '');
  }, [baseUrl]);

  const fetchStatus = useCallback(async () => {
    if (!normalizedBaseUrl) return null;

    try {
      setChecking(true);
      setError(null);

      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`${normalizedBaseUrl}/status`, {
        method: 'GET',
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Status check failed (${res.status})`);
      const data = await res.json();
      setActive(Boolean(data?.active));
      return data;
    } catch (e) {
      setError(e);
      // If status fails due to cold start, treat as inactive until wake succeeds.
      setActive(false);
      return null;
    } finally {
      setChecking(false);
    }
  }, [normalizedBaseUrl]);

  const wake = useCallback(async () => {
    if (!normalizedBaseUrl) return false;

    try {
      setWaking(true);
      setError(null);

      const res = await fetch(`${normalizedBaseUrl}/wake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Wake failed (${res.status})`);
      const data = await res.json();
      setActive(Boolean(data?.active));
      return Boolean(data?.active);
    } catch (e) {
      setError(e);
      setActive(false);
      return false;
    } finally {
      setWaking(false);
    }
  }, [normalizedBaseUrl]);

  useEffect(() => {
    fetchStatus();

    if (!pollIntervalMs) return;
    const id = setInterval(fetchStatus, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchStatus, pollIntervalMs]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort?.();
    };
  }, []);

  return {
    active,
    checking,
    waking,
    error,
    fetchStatus,
    wake,
  };
}
