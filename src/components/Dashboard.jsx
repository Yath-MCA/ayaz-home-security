// Dashboard.jsx - Main Security Dashboard Component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CameraCard from './CameraCard';
import VideoPlayer from './VideoPlayer';
import WebcamPlayer from './WebcamPlayer';
import { AlertList } from './AlertNotification';

const Dashboard = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const API_URL = 'http://localhost:3001';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    
    websocket.onerror = () => {
      // Silently handle WebSocket errors (backend might not be running)
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
      // Still remove from UI even if API call fails
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading security system...</div>
      </div>
    );
  }

  const hlsUrl = selectedCamera 
    ? `${API_URL}/api/cameras/${selectedCamera.id}/stream`
    : null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🏠 Family Security</h1>
          <nav style={styles.nav}>
            <button
              onClick={() => navigate('/dashboard')}
              style={styles.navButton}
            >
              📹 Dashboard
            </button>
            <button
              onClick={() => navigate('/users')}
              style={styles.navButton}
            >
              👥 Users
            </button>
          </nav>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.username || 'User'}</span>
            {user?.role === 'admin' && (
              <span style={styles.userRole}>Admin</span>
            )}
          </div>
          <div style={styles.alertBadge}>
            🔔 {alerts.length} Alerts
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Video Section */}
        <div style={styles.videoSection}>
          <h2 style={styles.videoTitle}>
            {selectedCamera 
              ? selectedCamera.name 
              : cameras.length === 0 
                ? 'Device Camera' 
                : 'Select a camera'}
          </h2>
          {selectedCamera ? (
            <VideoPlayer
              hlsUrl={hlsUrl}
              cameraId={selectedCamera.id}
              cameraName={selectedCamera.name}
              isLive={selectedCamera.status === 'online'}
              onError={(error) => console.error('Video error:', error)}
            />
          ) : cameras.length === 0 ? (
            <WebcamPlayer
              onError={(error) => console.error('Webcam error:', error)}
            />
          ) : (
            <div style={styles.noCamera}>
              <div style={styles.noCameraText}>No camera selected</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Cameras List */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Cameras</h3>
            <div style={styles.cameraList}>
              {cameras.length === 0 ? (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>📷</div>
                  <div style={styles.emptyText}>No cameras available</div>
                  <div style={styles.emptySubtext}>Using device camera</div>
                </div>
              ) : (
                cameras.map(camera => (
                  <CameraCard
                    key={camera.id}
                    camera={camera}
                    isSelected={selectedCamera?.id === camera.id}
                    onSelect={setSelectedCamera}
                    platform="web"
                  />
                ))
              )}
            </div>
          </div>

          {/* Alerts List */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recent Alerts</h3>
            <AlertList
              alerts={alerts.slice(0, 10)}
              onDismiss={dismissAlert}
            />
          </div>
        </div>
      </main>
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
    flexWrap: 'wrap',
    gap: '16px',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },

  nav: {
    display: 'flex',
    gap: '8px',
  },

  navButton: {
    padding: '8px 16px',
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '6px',
    color: '#93c5fd',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 200ms',
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },

  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },

  userRole: {
    fontSize: '12px',
    color: '#9ca3af',
  },

  logoutButton: {
    padding: '8px 16px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 200ms',
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

  noCamera: {
    flex: 1,
    background: '#000',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },

  noCameraText: {
    color: '#6b7280',
    fontSize: '16px',
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

  empty: {
    color: '#6b7280',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },

  emptyIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },

  emptyText: {
    fontSize: '14px',
    fontWeight: '500',
  },

  emptySubtext: {
    fontSize: '12px',
    color: '#64748b',
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
