import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThreeBackground from './ThreeBackground';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedFeature, setSelectedFeature] = useState(null);

  const handleGetStarted = () => {
    if (user) navigate('/dashboard');
    else navigate('/login');
  };

  const handleFeatureClick = (path, isFuture = false) => {
    if (isFuture) {
      setSelectedFeature(path);
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const features = [
    { id: 'dash', title: 'Security Dashboard', desc: 'Live feeds & alerts', icon: '🛡️', path: '/dashboard' },
    { id: 'video', title: 'Video Call', desc: 'Family video chat', icon: '🎥', path: '/video-call' },
    { id: 'users', title: 'User Access', desc: 'Manage permissions', icon: '👥', path: '/users' },
  ];

  const futureFeatures = [
    { id: 'ai', title: 'AI Detection', desc: 'Neural threat recognition' },
    { id: 'lock', title: 'Smart Lock', desc: 'Remote biometric entry' },
    { id: 'cloud', title: 'Cloud Vault', desc: 'Secure event archiving' },
  ];

  return (
    <div style={styles.page}>
      <style>{`
        [data-home-card]:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15) !important; }
        [data-home-card-coming]:hover { opacity: 1; border-color: rgba(148,163,184,0.4) !important; }
        [data-home-nav]:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
        [data-home-footer-link]:hover { color: #e2e8f0; }
      `}</style>
      <ThreeBackground />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <button type="button" onClick={() => navigate('/')} style={styles.logo}>
            🏠 Family Security
          </button>
          <nav style={styles.nav}>
            <button type="button" data-home-nav onClick={() => navigate('/')} style={styles.navItem}>
              Home
            </button>
            {user && (
              <>
                <button type="button" data-home-nav onClick={() => navigate('/dashboard')} style={styles.navItem}>
                  Dashboard
                </button>
                <button type="button" data-home-nav onClick={() => navigate('/video-call')} style={styles.navItem}>
                  Video Call
                </button>
                <button type="button" data-home-nav onClick={() => navigate('/users')} style={styles.navItem}>
                  Users
                </button>
              </>
            )}
            {user ? (
              <button type="button" onClick={() => { logout(); navigate('/login'); }} style={styles.btnLogout}>
                Logout
              </button>
            ) : (
              <button type="button" onClick={() => navigate('/login')} style={styles.btnPrimary}>
                Get Started
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Home Security System</h1>
          <p style={styles.heroSub}>
            Monitor your home with live cameras, real-time alerts, and secure video calls.
          </p>
          <button type="button" onClick={handleGetStarted} style={styles.heroCta}>
            {user ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Features</h2>
          <div style={styles.cardGrid}>
            {features.map((f) => (
              <button
                key={f.id}
                type="button"
                data-home-card
                onClick={() => handleFeatureClick(f.path)}
                style={styles.card}
              >
                <span style={styles.cardIcon}>{f.icon}</span>
                <h3 style={styles.cardTitle}>{f.title}</h3>
                <p style={styles.cardDesc}>{f.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Coming Soon</h2>
          <div style={styles.cardGrid}>
            {futureFeatures.map((f) => (
              <button
                key={f.id}
                type="button"
                data-home-card-coming
                onClick={() => setSelectedFeature(f.title)}
                style={styles.cardComing}
              >
                <span style={styles.cardIcon}>{f.icon}</span>
                <h3 style={styles.cardTitle}>{f.title}</h3>
                <p style={styles.cardDesc}>{f.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerGrid}>
            <div style={styles.footerCol}>
              <div style={styles.footerLogo}>🏠 Family Security</div>
              <p style={styles.footerTagline}>Secure your home, anytime.</p>
            </div>
            <div style={styles.footerCol}>
              <div style={styles.footerHeading}>Company</div>
              <button type="button" data-home-footer-link onClick={() => navigate('/about')} style={styles.footerLink}>
                About
              </button>
              <button type="button" data-home-footer-link onClick={() => navigate('/contact')} style={styles.footerLink}>
                Contact
              </button>
            </div>
            <div style={styles.footerCol}>
              <div style={styles.footerHeading}>Product</div>
              <button type="button" data-home-footer-link onClick={() => navigate('/dashboard')} style={styles.footerLink}>
                Dashboard
              </button>
              <button type="button" data-home-footer-link onClick={() => navigate('/video-call')} style={styles.footerLink}>
                Video Call
              </button>
              <button type="button" data-home-footer-link onClick={() => navigate('/users')} style={styles.footerLink}>
                Users
              </button>
            </div>
            <div style={styles.footerCol}>
              <div style={styles.footerHeading}>Account</div>
              <button type="button" data-home-footer-link onClick={() => navigate('/login')} style={styles.footerLink}>
                Login
              </button>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <span style={styles.copyright}>© {new Date().getFullYear()} YazTech Innovations. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Modal for coming soon */}
      {selectedFeature && (
        <div style={styles.overlay} onClick={() => setSelectedFeature(null)} role="dialog" aria-modal="true">
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>🚀</div>
            <h2 style={styles.modalTitle}>{selectedFeature}</h2>
            <p style={styles.modalDesc}>This feature is coming in a future update.</p>
            <button type="button" onClick={() => setSelectedFeature(null)} style={styles.modalBtn}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#020617',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(2, 6, 23, 0.85)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  logo: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontSize: '20px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '4px 0',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  navItem: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
  },
  btnPrimary: {
    background: '#3b82f6',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  btnLogout: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    fontSize: '14px',
    padding: '8px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    padding: '48px 24px 80px',
  },
  hero: {
    textAlign: 'center',
    padding: '60px 0 80px',
  },
  heroTitle: {
    fontSize: 'clamp(32px, 5vw, 48px)',
    fontWeight: '800',
    margin: '0 0 16px 0',
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  heroSub: {
    fontSize: '18px',
    color: '#94a3b8',
    maxWidth: '560px',
    margin: '0 auto 32px',
    lineHeight: 1.6,
  },
  heroCta: {
    background: '#3b82f6',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px 32px',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
  },
  section: {
    marginBottom: '56px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: '24px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  cardComing: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px dashed rgba(148, 163, 184, 0.25)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'left',
    cursor: 'pointer',
    opacity: 0.85,
    transition: 'opacity 0.2s ease, border-color 0.2s ease',
  },
  cardIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: '#fff',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 'auto',
    background: 'rgba(2, 6, 23, 0.95)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'relative',
    zIndex: 1,
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px 24px',
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '32px',
    marginBottom: '32px',
  },
  footerCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footerLogo: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#60a5fa',
  },
  footerTagline: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  footerHeading: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  footerLink: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 0',
    textAlign: 'left',
  },
  footerBottom: {
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'center',
  },
  copyright: {
    fontSize: '13px',
    color: '#64748b',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
  },
  modalIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#fff',
  },
  modalDesc: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  modalBtn: {
    background: '#3b82f6',
    border: 'none',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
};

export default Home;
