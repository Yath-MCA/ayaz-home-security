import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.content}>
          <h1 style={styles.title}>🏠 Home Security System</h1>
          <p style={styles.subtitle}>
            Monitor your home with advanced security cameras and real-time alerts
          </p>
          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>📹</div>
              <div style={styles.featureText}>Live Camera Feeds</div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>🔔</div>
              <div style={styles.featureText}>Real-time Alerts</div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>📱</div>
              <div style={styles.featureText}>Mobile Access</div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>🔒</div>
              <div style={styles.featureText}>Secure Dashboard</div>
            </div>
          </div>
          <div style={styles.actions}>
            <button onClick={handleGetStarted} style={styles.primaryButton}>
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
            {user && (
              <button onClick={() => navigate('/users')} style={styles.secondaryButton}>
                Manage Users
              </button>
            )}
            {user && (
              <button onClick={() => { logout(); navigate('/login'); }} style={styles.logoutButton}>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={styles.infoSection}>
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>🎥 Multi-Camera Support</h3>
          <p style={styles.infoText}>
            Connect and monitor multiple security cameras from a single dashboard
          </p>
        </div>
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>⚡ Real-time Monitoring</h3>
          <p style={styles.infoText}>
            Get instant notifications when motion or objects are detected
          </p>
        </div>
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>📊 Smart Analytics</h3>
          <p style={styles.infoText}>
            Track events and manage your security system with ease
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  },

  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    padding: '40px 20px',
  },

  content: {
    textAlign: 'center',
    maxWidth: '800px',
  },

  title: {
    fontSize: '48px',
    fontWeight: '700',
    margin: '0 0 16px 0',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  subtitle: {
    fontSize: '20px',
    color: '#cbd5e1',
    margin: '0 0 40px 0',
    lineHeight: '1.6',
  },

  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },

  feature: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
  },

  featureIcon: {
    fontSize: '32px',
  },

  featureText: {
    fontSize: '14px',
    color: '#cbd5e1',
    fontWeight: '500',
  },

  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  primaryButton: {
    padding: '16px 32px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms',
    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
  },

  secondaryButton: {
    padding: '16px 32px',
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '8px',
    color: '#93c5fd',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms',
  },

  logoutButton: {
    padding: '16px 32px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms',
  },

  infoSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },

  infoCard: {
    padding: '24px',
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
  },

  infoTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#fff',
  },

  infoText: {
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: '1.6',
    margin: 0,
  },
};

export default Home;
