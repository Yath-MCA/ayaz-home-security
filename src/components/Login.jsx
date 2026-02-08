import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏠 Security System</h1>
          <p style={styles.subtitle}>Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorContainer}>
              <div style={styles.errorText}>{error}</div>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={styles.resetBtn}
              >
                🔄 Reset System
              </button>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, width: '100%', paddingRight: '45px', boxSizing: 'border-box' }}
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Default: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
  },

  loginBox: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  },

  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },

  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 8px 0',
  },

  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#cbd5e1',
  },

  input: {
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 200ms',
  },

  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },

  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    zIndex: 2,
    '&:hover': {
      transform: 'scale(1.1)',
    }
  },

  button: {
    padding: '12px 24px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms',
    marginTop: '8px',
  },

  errorContainer: {
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },

  errorText: {
    color: '#fca5a5',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500',
  },

  resetBtn: {
    padding: '6px 14px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    transition: 'all 0.2s',
  },

  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },

  footerText: {
    fontSize: '12px',
    color: '#64748b',
  },
};

export default Login;
