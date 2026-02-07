// AlertNotification.jsx - Alert Component
import React, { useState, useEffect } from 'react';

const AlertNotification = ({ 
  alert, 
  onDismiss = () => {},
  autoCloseDuration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDuration]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(alert.id);
    }, 200);
  };

  if (!isVisible) return null;

  const alertTypeConfig = {
    motion: {
      icon: '⚠️',
      color: '#f59e0b',
      label: 'Motion Detected',
      borderColor: '#f59e0b',
    },
    object_detection: {
      icon: '👤',
      color: '#3b82f6',
      label: 'Object Detected',
      borderColor: '#3b82f6',
    },
    offline: {
      icon: '❌',
      color: '#ef4444',
      label: 'Camera Offline',
      borderColor: '#ef4444',
    },
  };

  const config = alertTypeConfig[alert.alertType] || alertTypeConfig.motion;
  const timeAgo = formatTimeAgo(new Date(alert.timestamp));

  return (
    <div
      style={{
        ...styles.container,
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
      }}
    >
      <div
        style={{
          ...styles.alert,
          borderLeftColor: config.borderColor,
        }}
      >
        <div style={styles.iconContainer}>
          <div style={{ fontSize: '20px' }}>{config.icon}</div>
        </div>

        <div style={styles.content}>
          <div style={styles.header}>
            <div style={styles.cameraName}>{alert.cameraName}</div>
            {alert.confidence && (
              <div style={styles.confidence}>
                {alert.confidence}% confidence
              </div>
            )}
          </div>

          <div style={styles.message}>
            {config.label}
          </div>

          <div style={styles.timestamp}>
            {timeAgo}
          </div>

          {alert.objectClass && (
            <div style={styles.objectClass}>
              Detected: {alert.objectClass}
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          style={styles.dismissButton}
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const AlertList = ({ alerts, onDismiss = () => {} }) => {
  return (
    <div style={styles.listContainer}>
      {alerts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <div style={styles.emptyText}>No alerts</div>
        </div>
      ) : (
        <div style={styles.list}>
          {alerts.map(alert => (
            <AlertNotification
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
              autoCloseDuration={0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Utility function
const formatTimeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// Styles
const styles = {
  container: {
    transition: 'all 200ms ease',
  },

  alert: {
    background: '#1e293b',
    borderLeft: '4px solid',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '8px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    animation: 'slideIn 300ms ease',
  },

  iconContainer: {
    fontSize: '20px',
    flexShrink: 0,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },

  cameraName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },

  confidence: {
    fontSize: '12px',
    color: '#9ca3af',
    flexShrink: 0,
  },

  message: {
    fontSize: '13px',
    color: '#cbd5e1',
    marginBottom: '4px',
  },

  timestamp: {
    fontSize: '12px',
    color: '#64748b',
  },

  objectClass: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
    padding: '4px 8px',
    background: 'rgba(71, 85, 105, 0.2)',
    borderRadius: '3px',
    display: 'inline-block',
  },

  dismissButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 4px',
    flexShrink: 0,
    transition: 'color 200ms',
  },

  listContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '8px',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#6b7280',
  },

  emptyIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },

  emptyText: {
    fontSize: '14px',
  },
};

export { AlertNotification, AlertList };
export default AlertNotification;
