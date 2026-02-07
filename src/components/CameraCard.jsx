// CameraCard.jsx - Reusable Camera Component
import React from 'react';

const CameraCard = ({ 
  camera, 
  isSelected = false, 
  onSelect = () => {}, 
  platform = 'web' 
}) => {
  const statusColor = camera.status === 'online' ? '#10b981' : '#6b7280';
  const borderColor = isSelected ? '#3b82f6' : '#475569';

  const handleClick = () => {
    onSelect(camera);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        ...styles.card,
        borderColor,
        background: isSelected ? '#1e3a8a' : '#1e293b',
      }}
    >
      <div style={styles.info}>
        <div style={styles.name}>{camera.name}</div>
        <div style={styles.location}>{camera.location}</div>
        <div style={styles.meta}>
          {camera.resolution} • {camera.framerate}fps
        </div>
      </div>
      <div style={styles.statusContainer}>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: statusColor,
          }}
        />
        <div style={styles.statusText}>
          {camera.status === 'online' ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    borderRadius: '8px',
    border: '2px solid',
    backgroundColor: '#1e293b',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '4px',
  },

  location: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '4px',
  },

  meta: {
    fontSize: '11px',
    color: '#64748b',
  },

  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '12px',
  },

  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  statusText: {
    fontSize: '10px',
    color: '#64748b',
  },
};

export default CameraCard;
