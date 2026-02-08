import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 onClick={() => navigate('/')} style={{ ...styles.navTitle, cursor: 'pointer' }}>🏠 Family Security</h1>
        {user && (
          <div style={styles.headerRight}>
            <button onClick={() => navigate('/users')} style={styles.navLink}>Users</button>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        )}
      </header>

      <div style={styles.hero}>
        <div style={styles.content}>
          <h2 style={styles.title}>Welcome back, {user?.username || 'user'}</h2>
          <p style={styles.subtitle}>
            Your home security system is active. Select an action below to begin monitoring.
          </p>

          {!user ? (
            <button onClick={() => navigate('/login')} style={styles.loginCard}>
              <span>Sign in to your account</span>
              <div style={styles.loginArrow}>→</div>
            </button>
          ) : (
            <div style={styles.actionGrid}>
              <div onClick={() => navigate('/dashboard')} style={styles.actionCard}>
                <div style={styles.cardIcon}>🛡️</div>
                <h3 style={styles.cardTitle}>Security Dashboard</h3>
                <p style={styles.cardDesc}>Access live camera feeds, check sensor alerts, and manage device settings.</p>
                <div style={styles.cardTag}>Live Monitoring</div>
              </div>

              <div onClick={() => navigate('/video-call')} style={{ ...styles.actionCard, borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                <div style={styles.cardIcon}>🎥</div>
                <h3 style={styles.cardTitle}>VigilRoom Video</h3>
                <p style={styles.cardDesc}>Connect securely with family members through encrypted video and chat.</p>
                <div style={{ ...styles.cardTag, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>Secure Connect</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.statsSection}>
        <div style={styles.stat}>
          <span style={styles.statValue}>100%</span>
          <span style={styles.statLabel}>Encrypted</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>Realtime</span>
          <span style={styles.statLabel}>Latency</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>HD</span>
          <span style={styles.statLabel}>Quality</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0f1a',
    color: '#fff',
    fontFamily: '-apple-system, system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(10, 15, 26, 0.8)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  navTitle: { fontSize: '18px', fontWeight: '800', margin: 0, color: '#3b82f6' },
  headerRight: { display: 'flex', gap: '24px', alignItems: 'center' },
  navLink: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
  logoutBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    padding: '6px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  hero: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '900px',
    width: '100%',
    textAlign: 'center',
  },
  title: { fontSize: '42px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-1px' },
  subtitle: { fontSize: '18px', color: '#94a3b8', margin: '0 0 48px 0', lineHeight: '1.6' },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
    marginTop: '20px',
  },
  actionCard: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '40px 30px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      background: 'rgba(30, 41, 59, 0.6)',
      transform: 'translateY(-8px)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
    }
  },
  cardIcon: { fontSize: '48px', marginBottom: '24px' },
  cardTitle: { fontSize: '24px', fontWeight: '700', margin: '0 0 12px 0' },
  cardDesc: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px 0' },
  cardTag: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  loginCard: {
    background: '#3b82f6',
    border: 'none',
    width: '100%',
    maxWidth: '400px',
    padding: '20px 30px',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    margin: '0 auto',
    transition: 'transform 0.2s',
    '&:hover': { transform: 'translateY(-2px)' }
  },
  statsSection: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    gap: '80px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  statValue: { fontSize: '20px', fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' },
};

export default Home;

