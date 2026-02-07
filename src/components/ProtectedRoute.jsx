import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const styles = {
  loading: {
    minHeight: '100vh',
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

export default ProtectedRoute;
