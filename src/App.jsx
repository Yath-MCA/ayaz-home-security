import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import VideoCall from './components/VideoCall';
import VideoCallRoomPage from './components/VideoCallRoomPage';
import ChatRoom from './components/ChatRoom';
import ChatRoomPage from './components/ChatRoomPage';
import About from './components/About';
import Contact from './components/Contact';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-call"
            element={<VideoCall />}
          />
          <Route
            path="/room/:roomId"
            element={<VideoCallRoomPage />}
          />
          <Route
            path="/chat"
            element={<ChatRoom />}
          />
          <Route
            path="/chat/:roomId"
            element={<ChatRoomPage />}
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
