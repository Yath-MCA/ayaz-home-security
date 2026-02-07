// Dashboard.jsx - Main Security Dashboard Component
import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);

  const API_URL = 'http://localhost:3001';

  // Load cameras on mount
  useEffect(() => {
    loadCameras();
    connectWebSocket();
  }, []);

  const loadCameras = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cameras`);
      const data = await res.json();
      setCameras(data);
      if (data.length > 0) {
        setSelectedCamera(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load cameras:', error);
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//localhost:3001`;

    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'initial-data') {
          setAlerts(msg.alerts);
        } else if (msg.type === 'new-alert') {
          setAlerts(prev => [msg.alert, ...prev].slice(0, 50));
        } else if (msg.type === 'alert-dismissed') {
          setAlerts(prev => prev.filter(a => a.id !== msg.alertId));
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    websocket.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };

    setWs(websocket);
  };

  const dismissAlert = async (alertId) => {
    try {
      await fetch(`${API_URL}/api/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading security system...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🏠 Family Security</h1>
        <div style={styles.alertBadge}>
          🔔 {alerts.length} Alerts
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Video Section */}
        <div style={styles.videoSection}>
          <h2 style={styles.videoTitle}>
            {selectedCamera ? selectedCamera.name : 'Select a camera'}
          </h2>
          <VideoPlayer camera={selectedCamera} />
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Cameras List */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Cameras</h3>
            <div style={styles.cameraList}>
              {cameras.map(camera => (
                <CameraCard
                  key={camera.id}
                  camera={camera}
                  isSelected={selectedCamera?.id === camera.id}
                  onSelect={setSelectedCamera}
                />
              ))}
            </div>
          </div>

          {/* Alerts List */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recent Alerts</h3>
            <div style={styles.alertsList}>
              {alerts.length === 0 ? (
                <div style={styles.empty}>No alerts</div>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => dismissAlert(alert.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Camera Card Component
const CameraCard = ({ camera, isSelected, onSelect }) => {
  return (
    <div
      style={{
        ...styles.cameraCard,
        ...(isSelected ? styles.cameraCardSelected : {}),
      }}
      onClick={() => onSelect(camera)}
    >
      <div style={styles.cameraInfo}>
        <div style={styles.cameraName}>{camera.name}</div>
        <div style={styles.cameraLocation}>{camera.location}</div>
      </div>
      <div
        style={{
          ...styles.statusDot,
          ...(camera.status === 'offline' ? styles.statusDotOffline : {}),
        }}
      />
    </div>
  );
};

// Video Player Component
const VideoPlayer = ({ camera }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (!camera) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadStream = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/cameras/${camera.id}/stream`);
        const data = await res.json();

        const video = videoRef.current;
        if (!video) return;

        // Load HLS.js if not already loaded
        if (!window.Hls) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          script.onload = () => {
            const hls = new window.Hls();
            hls.loadSource(data.hlsUrl);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(e => console.log('Autoplay prevented:', e));
              setIsLoading(false);
            });
          };
          document.head.appendChild(script);
        } else {
          const hls = new window.Hls();
          hls.loadSource(data.hlsUrl);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log('Autoplay prevented:', e));
            setIsLoading(false);
          });
        }
      } catch (err) {
        setError('Failed to load video stream');
        setIsLoading(false);
      }
    };

    loadStream();
  }, [camera]);

  return (
    <div style={styles.videoPlayer}>
      {isLoading && (
        <div style={styles.videoLoading}>
          <div>Loading stream...</div>
        </div>
      )}
      {error && (
        <div style={styles.videoError}>
          <div>{error}</div>
        </div>
      )}
      <video
        ref={videoRef}
        style={{
          ...styles.video,
          display: isLoading ? 'none' : 'block',
        }}
        controls
        autoPlay
        muted
      />
      {!isLoading && (
        <div style={styles.liveBadge}>● LIVE</div>
      )}
    </div>
  );
};

// Alert Item Component
const AlertItem = ({ alert, onDismiss }) => {
  const timeAgo = new Date(alert.timestamp);
  const timeStr = timeAgo.toLocaleTimeString();

  return (
    <div
      style={{
        ...styles.alertItem,
        ...(alert.alertType === 'offline' ? styles.alertItemOffline : {}),
      }}
    >
      <div style={styles.alertContent}>
        <div style={styles.alertCamera}>{alert.cameraName}</div>
        <div style={styles.alertTime}>
          {alert.alertType === 'motion' ? '⚠️ Motion' : '❌ Offline'} • {timeStr}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={styles.alertDismiss}
      >
        ✕
      </button>
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    background: 'rgba(15, 23, 42, 0.8)',
    borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },

  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
  },

  alertBadge: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fca5a5',
  },

  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '24px',
    padding: '24px',
    flex: 1,
    overflow: 'hidden',
  },

  videoSection: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },

  videoTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
  },

  videoPlayer: {
    flex: 1,
    background: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },

  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  videoLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '16px',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.5)',
  },

  videoError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fca5a5',
    fontSize: '16px',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.8)',
  },

  liveBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: '#ef4444',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    zIndex: 10,
    animation: 'pulse 2s infinite',
  },

  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    overflowY: 'auto',
    paddingRight: '12px',
  },

  section: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    backdropFilter: 'blur(10px)',
  },

  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  cameraList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  cameraCard: {
    background: '#1e293b',
    border: '2px solid #475569',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cameraCardSelected: {
    borderColor: '#3b82f6',
    background: '#1e3a8a',
  },

  cameraInfo: {
    flex: 1,
  },

  cameraName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
  },

  cameraLocation: {
    fontSize: '12px',
    color: '#9ca3af',
  },

  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 2s infinite',
  },

  statusDotOffline: {
    background: '#6b7280',
    animation: 'none',
  },

  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
  },

  alertItem: {
    background: '#1e293b',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '4px',
    padding: '12px',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    animation: 'slideIn 300ms ease',
  },

  alertItemOffline: {
    borderLeftColor: '#ef4444',
  },

  alertContent: {
    flex: 1,
  },

  alertCamera: {
    fontWeight: '600',
    marginBottom: '4px',
  },

  alertTime: {
    color: '#9ca3af',
    fontSize: '12px',
  },

  alertDismiss: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 8px',
  },

  empty: {
    color: '#6b7280',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
  },

  loadingContainer: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },

  loadingText: {
    color: '#9ca3af',
    fontSize: '16px',
  },
};

export default Dashboard;
