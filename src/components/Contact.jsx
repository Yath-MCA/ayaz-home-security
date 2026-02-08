import React from 'react';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 onClick={() => navigate('/')} style={styles.navTitle}>🏠 Family Security</h1>
                <div style={styles.headerRight}>
                    <button onClick={() => navigate('/')} style={styles.navLink}>Home</button>
                    <button onClick={() => navigate('/about')} style={styles.navLink}>About</button>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.contactHeader}>
                    <h2 style={styles.title}>Secure <span style={styles.highlight}>Support Line</span></h2>
                    <p style={styles.subtitle}>Have questions about your system? Our technical team is standing by 24/7.</p>
                </div>

                <div style={styles.contentGrid}>
                    <div style={styles.infoCard}>
                        <div style={styles.infoSection}>
                            <div style={styles.infoIcon}>🛡️</div>
                            <div style={styles.infoText}>
                                <h3 style={styles.infoTitle}>Technical Support</h3>
                                <p style={styles.infoValue}>support@vigilsafe.com</p>
                            </div>
                        </div>

                        <div style={styles.infoSection}>
                            <div style={styles.infoIcon}>📞</div>
                            <div style={styles.infoText}>
                                <h3 style={styles.infoTitle}>Phone</h3>
                                <a href="tel:04448036360" style={styles.infoLink} aria-label="Call YazTech Innovations">
                                    044 4803 6360
                                </a>
                            </div>
                        </div>

                        <div style={styles.infoSection}>
                            <div style={styles.infoIcon}>📍</div>
                            <div style={styles.infoText}>
                                <h3 style={styles.infoTitle}>Headquarters</h3>
                                <a
                                    href="https://maps.app.goo.gl/ePJ1U4ngeaNoSeaW8"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.infoLink}
                                    aria-label="Open YazTech Innovations location in Google Maps"
                                >
                                    4th block, 4, 290, 93rd Street
                                </a>
                                <span style={styles.infoSubValue}>Muthamizh Nagar, Kodungaiyur</span>
                                <span style={styles.infoSubValue}>Chennai, Tamil Nadu 600118</span>
                            </div>
                        </div>
                    </div>

                    <div style={styles.devBrand}>
                        <div style={styles.devCard}>
                            <span style={styles.devLabel}>Developed By</span>
                            <h2 style={styles.devName}>YazTech Innovations</h2>
                            <p style={styles.devMeta}>Website designer in Chennai, Tamil Nadu</p>
                            <div style={styles.devRating}>
                                <span style={styles.starIcon}>★ 5.01</span> Google Review
                            </div>
                            <button style={styles.visitBtn}>Visit Studio</button>
                        </div>
                    </div>
                </div>
            </main>

            <footer style={styles.footer}>
                <div style={styles.footerLinks}>
                    <button type="button" onClick={() => navigate('/')} style={styles.footerLink}>
                        Home
                    </button>
                    <button type="button" onClick={() => navigate('/about')} style={styles.footerLink}>
                        About
                    </button>
                </div>
                <p>&copy; {new Date().getFullYear()} YazTech Innovations. All rights reserved.</p>
            </footer>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: '#020617',
        color: '#fff',
        fontFamily: '"Outfit", sans-serif',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    navTitle: { fontSize: '20px', fontWeight: '900', margin: 0, color: '#3b82f6', cursor: 'pointer', letterSpacing: '-0.5px' },
    headerRight: { display: 'flex', gap: '24px' },
    navLink: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },

    main: { flex: 1, padding: '80px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' },
    contactHeader: { textAlign: 'center', marginBottom: '60px' },
    title: { fontSize: '42px', fontWeight: '900', marginBottom: '16px' },
    highlight: { color: '#3b82f6' },
    subtitle: { fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' },

    contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' },

    infoCard: { background: 'rgba(15, 23, 42, 0.6)', padding: '40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '32px' },
    infoSection: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
    infoIcon: { fontSize: '24px', width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' },
    infoText: { display: 'flex', flexDirection: 'column' },
    infoTitle: { fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' },
    infoValue: { fontSize: '18px', fontWeight: '700', color: '#f8fafc' },
    infoSubValue: { fontSize: '14px', color: '#94a3b8', margin: '2px 0' },
    infoLink: { fontSize: '18px', fontWeight: '700', color: '#f8fafc', textDecoration: 'none' },

    devBrand: { background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', borderRadius: '32px', padding: '60px 40px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    devLabel: { fontSize: '12px', fontWeight: '900', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '12px' },
    devName: { fontSize: '32px', fontWeight: '900', marginBottom: '8px' },
    devMeta: { color: '#94a3b8', fontSize: '14px', marginBottom: '24px' },
    devRating: { background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '8px 20px', borderRadius: '40px', fontSize: '14px', fontWeight: '700' },
    starIcon: { color: '#f59e0b' },
    visitBtn: { marginTop: '32px', padding: '12px 32px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px -10px #3b82f6' },

    footer: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(2, 6, 23, 0.9)', marginTop: 'auto' },
    footerLinks: { display: 'flex', justifyContent: 'center', gap: '18px', marginBottom: '14px', flexWrap: 'wrap' },
    footerLink: { background: 'none', border: 'none', color: '#e2e8f0', fontSize: '14px', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '4px' },
};

export default Contact;
