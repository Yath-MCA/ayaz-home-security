import React, { useEffect, useRef, useState } from 'react';

const WebcamPlayer = ({ onError = null }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startWebcam();

    return () => {
      // Cleanup: stop webcam when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request access to user's camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user', // Use front camera on mobile, default on desktop
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error('Error playing video:', err);
            setError('Failed to start video');
            setIsLoading(false);
            if (onError) onError(err);
          });
      }
    } catch (err) {
      let errorMessage = 'Failed to access camera';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera does not support the required settings.';
      }

      setError(errorMessage);
      setIsLoading(false);
      if (onError) onError(err);
    }
  };

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleStart = () => {
    startWebcam();
  };

  return (
    <div style={styles.container}>
      <div style={styles.playerWrapper}>
        <video
          ref={videoRef}
          style={{
            ...styles.video,
            display: error ? 'none' : 'block',
          }}
          autoPlay
          playsInline
          muted
        />

        {isLoading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Accessing camera...</div>
          </div>
        )}

        {error && (
          <div style={styles.errorOverlay}>
            <div style={styles.errorIcon}>📷</div>
            <div style={styles.errorText}>{error}</div>
            <button onClick={handleStart} style={styles.retryButton}>
              🔄 Try Again
            </button>
          </div>
        )}

        {isPlaying && !isLoading && (
          <div style={styles.liveBadge}>● LIVE</div>
        )}

        {/* Controls */}
        {isPlaying && !isLoading && !error && (
          <div style={styles.controlsContainer}>
            <div style={styles.controls}>
              <button
                onClick={handleStop}
                style={styles.controlButton}
                title="Stop Camera"
              >
                ⏹ Stop
              </button>
              <button
                onClick={handleStart}
                style={styles.controlButton}
                title="Restart Camera"
              >
                🔄 Restart
              </button>
            </div>
          </div>
        )}

        {/* Camera Info */}
        {isPlaying && !isLoading && !error && (
          <div style={styles.cameraInfo}>
            <div style={styles.cameraName}>Device Camera</div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100%',
    minHeight: '400px',
  },

  playerWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
  },

  video: {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'cover',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.7)',
    gap: '16px',
    zIndex: 20,
  },

  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.2)',
    borderTop: '4px solid #fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  loadingText: {
    color: '#fff',
    fontSize: '14px',
  },

  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.9)',
    gap: '16px',
    zIndex: 20,
    padding: '20px',
  },

  errorIcon: {
    fontSize: '48px',
  },

  errorText: {
    color: '#fca5a5',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center',
  },

  retryButton: {
    padding: '12px 24px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },

  liveBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#ef4444',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    zIndex: 10,
    animation: 'pulse 2s infinite',
  },

  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    padding: '16px',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
  },

  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '8px 12px',
    borderRadius: '6px',
    backdropFilter: 'blur(4px)',
  },

  controlButton: {
    background: 'rgba(59, 130, 246, 0.3)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 16px',
    transition: 'opacity 200ms',
  },

  cameraInfo: {
    position: 'absolute',
    bottom: '16px',
    left: '12px',
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '6px 12px',
    borderRadius: '4px',
    backdropFilter: 'blur(4px)',
    zIndex: 10,
  },

  cameraName: {
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
  },
};

export default WebcamPlayer;
