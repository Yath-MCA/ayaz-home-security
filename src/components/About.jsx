import React from 'react';
import { useNavigate } from 'react-router-dom';

const About = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 onClick={() => navigate('/')} style={styles.navTitle}>🏠 Family Security</h1>
                <div style={styles.headerRight}>
                    <button onClick={() => navigate('/')} style={styles.navLink}>Home</button>
                    <button onClick={() => navigate('/contact')} style={styles.navLink}>Contact</button>
                </div>
            </header>

            <main style={styles.main}>
                <section style={styles.heroSection}>
                    <h2 style={styles.title}>Defining the Future of <span style={styles.highlight}>Residential Security</span></h2>
                    <p style={styles.subtitle}>
                        VigilSafe is not just an application; it's a commitment to your family's peace of mind.
                        Born from the need for high-fidelity monitoring and secure communication, we provide
                        enterprise-grade security for your private world.
                    </p>
                </section>

                <section style={styles.visionSection}>
                    <div style={styles.visionCard}>
                        <div style={styles.icon}>🎯</div>
                        <h3>Our Mission</h3>
                        <p>To empower homeowners with real-time awareness and encrypted communication tools that are both powerful and beautiful.</p>
                    </div>
                    <div style={styles.visionCard}>
                        <div style={styles.icon}>💎</div>
                        <h3>Premium Privacy</h3>
                        <p>We utilize quantum-resistant encryption patterns to ensure that your camera feeds and room conversations stay strictly private.</p>
                    </div>
                    <div style={styles.visionCard}>
                        <div style={styles.icon}>🚀</div>
                        <h3>Innovation First</h3>
                        <p>By integrating AI-driven threat detection and biometric verification, we stay two steps ahead of any security vulnerability.</p>
                    </div>
                </section>

                <section style={styles.devSection}>
                    <div style={styles.devCard}>
                        <div style={styles.devInfo}>
                            <h3 style={styles.devName}>YazTech Innovations</h3>
                            <p style={styles.devTagline}>Website designer in Chennai, Tamil Nadu</p>
                            <div style={styles.ratingInfo}>
                                <span style={styles.stars}>⭐⭐⭐⭐⭐</span>
                                <span style={styles.ratingCount}>5.01 Google Review</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={styles.footer}>
                <div style={styles.footerLinks}>
                    <button type="button" onClick={() => navigate('/')} style={styles.footerLink}>
                        Home
                    </button>
                    <button type="button" onClick={() => navigate('/contact')} style={styles.footerLink}>
                        Contact
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

    main: { flex: 1, padding: '60px 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' },
    heroSection: { textAlign: 'center', marginBottom: '80px' },
    title: { fontSize: '48px', fontWeight: '900', marginBottom: '24px', letterSpacing: '-1.5px' },
    highlight: { color: '#3b82f6' },
    subtitle: { fontSize: '18px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' },

    visionSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '100px' },
    visionCard: { background: 'rgba(30, 41, 59, 0.4)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
    icon: { fontSize: '32px', marginBottom: '16px' },

    devSection: { padding: '40px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '32px', border: '1px solid rgba(59, 130, 246, 0.1)' },
    devCard: { textAlign: 'center' },
    devName: { fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: '#3b82f6' },
    devTagline: { fontSize: '14px', color: '#94a3b8', marginBottom: '16px' },
    ratingInfo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
    stars: { color: '#fbbf24' },
    ratingCount: { fontSize: '12px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase' },

    footer: { padding: '40px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(2, 6, 23, 0.9)', color: '#64748b', fontSize: '13px', marginTop: 'auto' },
    footerLinks: { display: 'flex', justifyContent: 'center', gap: '18px', marginBottom: '14px', flexWrap: 'wrap' },
    footerLink: { background: 'none', border: 'none', color: '#e2e8f0', fontSize: '14px', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '4px' },
};

export default About;
