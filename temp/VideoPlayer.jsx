// VideoPlayer.jsx - HLS Video Player Component
import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({
  hlsUrl,
  cameraId,
  cameraName = 'Camera',
  isLive = true,
  onError = null
}) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    setIsLoading(true);
    setError(null);

    const setupHLS = async () => {
      try {
        // Load HLS.js if not already loaded
        if (!window.Hls) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          script.async = true;
          script.onload = () => {
            playStream();
          };
          script.onerror = () => {
            setError('Failed to load HLS player');
            setIsLoading(false);
          };
          document.head.appendChild(script);
        } else {
          playStream();
        }
      } catch (err) {
        setError('Failed to initialize video player');
        setIsLoading(false);
        if (onError) onError(err.message);
      }
    };

    const playStream = () => {
      const video = videoRef.current;
      if (!video) return;

      if (window.Hls.isSupported()) {
        const hls = new window.Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(e => {
            console.log('Autoplay prevented:', e);
            setIsPlaying(false);
          });
        });

        hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setError('Video stream error');
            if (onError) onError(data.details);
          }
        });

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = hlsUrl;
        video.addEventListener('canplay', () => {
          setIsLoading(false);
          video.play().catch(e => {
            console.log('Autoplay prevented:', e);
            setIsPlaying(false);
          });
        });
      } else {
        setError('HLS video format not supported');
        setIsLoading(false);
      }
    };

    setupHLS();
  }, [hlsUrl, onError]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
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
          controls={false}
          muted={false}
          playsInline
        />

        {isLoading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Loading stream...</div>
          </div>
        )}

        {error && (
          <div style={styles.errorOverlay}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorText}>{error}</div>
            <div style={styles.errorSubtext}>{cameraName}</div>
          </div>
        )}

        {isLive && !isLoading && (
          <div style={styles.liveBadge}>● LIVE</div>
        )}

        {/* Custom Controls */}
        {!isLoading && !error && (
          <div style={styles.controlsContainer}>
            <div style={styles.controls}>
              <button
                onClick={handlePlayPause}
                style={styles.controlButton}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={styles.volumeSlider}
                title="Volume"
              />

              <button
                onClick={handleFullscreen}
                style={styles.controlButton}
                title="Fullscreen"
              >
                ⛶
              </button>
            </div>
          </div>
        )}

        {/* Camera Info */}
        {!isLoading && !error && (
          <div style={styles.cameraInfo}>
            <div style={styles.cameraName}>{cameraName}</div>
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
    objectFit: 'contain',
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
    gap: '12px',
    zIndex: 20,
  },

  errorIcon: {
    fontSize: '32px',
  },

  errorText: {
    color: '#fca5a5',
    fontSize: '16px',
    fontWeight: '600',
  },

  errorSubtext: {
    color: '#9ca3af',
    fontSize: '12px',
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
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'opacity 200ms',
  },

  volumeSlider: {
    width: '80px',
    height: '4px',
    cursor: 'pointer',
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

export default VideoPlayer;
