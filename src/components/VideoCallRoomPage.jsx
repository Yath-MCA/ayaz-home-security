import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VideoCallRoom from './VideoCallRoom';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3002';

const VideoCallRoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const stateDisplayName = location.state?.displayName || '';
  const queryName = new URLSearchParams(location.search).get('name') || '';
  const authName = user?.fullName || user?.username || '';
  const displayName = stateDisplayName || queryName || authName || 'Guest';

  if (!roomId) {
    navigate('/video-call', { replace: true });
    return null;
  }

  return (
    <VideoCallRoom
      roomId={roomId}
      displayName={displayName}
      signalingUrl={SIGNALING_URL}
      onLeave={() => navigate('/video-call')}
      onBack={() => navigate('/video-call')}
    />
  );
};

export default VideoCallRoomPage;
