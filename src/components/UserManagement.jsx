import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  exportUsers,
  importUsers,
} from '../services/userService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    try {
      const userList = getUsers();
      setUsers(userList);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'user',
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password
      email: user.email || '',
      fullName: user.fullName || '',
      role: user.role || 'user',
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        deleteUser(id);
        setSuccess('User deleted successfully');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete user');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        updateUser(editingUser.id, updateData);
        setSuccess('User updated successfully');
      } else {
        // Create user
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }
        createUser(formData);
        setSuccess('User created successfully');
      }
      setShowModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Operation failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExport = () => {
    try {
      exportUsers();
      setSuccess('Users exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export users');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      importUsers(file)
        .then(() => {
          setSuccess('Users imported successfully');
          loadUsers();
          setTimeout(() => setSuccess(''), 3000);
        })
        .catch((err) => {
          setError(err.message || 'Failed to import users');
          setTimeout(() => setError(''), 3000);
        });
    }
    e.target.value = ''; // Reset file input
  };

  return (
    <div style={styles.container}>
      <div style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <h1 onClick={() => navigate('/')} style={{ ...styles.title, cursor: 'pointer' }}>🏠 Family Security</h1>
          <nav style={styles.nav}>
            <button onClick={() => navigate('/dashboard')} style={styles.navButton}>📹 Dashboard</button>
            <button onClick={() => navigate('/users')} style={styles.navButtonActive}>👥 Users</button>
            <button onClick={() => navigate('/video-call')} style={styles.navButton}>📹 Video Call</button>
          </nav>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.username || 'User'}</span>
            {user?.role === 'admin' && (
              <span style={styles.userRole}>Admin</span>
            )}
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            🚪 Logout
          </button>
        </div>
      </div>
      <div style={styles.header}>
        <div style={styles.actions}>
          <label style={styles.importButton}>
            📥 Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleExport} style={styles.exportButton}>
            📤 Export JSON
          </button>
          <button onClick={handleCreate} style={styles.createButton}>
            ➕ Add User
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.alertError}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.alertSuccess}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading users...</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Full Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyCell}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>{user.username}</td>
                    <td style={styles.td}>{user.fullName || '-'}</td>
                    <td style={styles.td}>{user.email || '-'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser),
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleEdit(user)}
                          style={styles.editButton}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          style={styles.deleteButton}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Create User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Password {editingUser ? '(leave empty to keep current)' : '*'}
                </label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{ ...styles.input, width: '100%', paddingRight: '45px', boxSizing: 'border-box' }}
                    required={!editingUser}
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
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
  },

  topHeader: {
    background: 'rgba(15, 23, 42, 0.8)',
    borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    flexWrap: 'wrap',
    gap: '16px',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },

  nav: {
    display: 'flex',
    gap: '8px',
  },

  navButton: {
    padding: '8px 16px',
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '6px',
    color: '#93c5fd',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 200ms',
  },

  navButtonActive: {
    padding: '8px 16px',
    background: 'rgba(59, 130, 246, 0.4)',
    border: '1px solid rgba(59, 130, 246, 0.7)',
    borderRadius: '6px',
    color: '#bfdbfe',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },

  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },

  userRole: {
    fontSize: '12px',
    color: '#9ca3af',
  },

  logoutButton: {
    padding: '8px 16px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 200ms',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '24px 24px 0 24px',
  },

  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: 0,
  },

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },

  createButton: {
    padding: '10px 20px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms',
  },

  exportButton: {
    padding: '10px 20px',
    background: '#10b981',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms',
  },

  importButton: {
    padding: '10px 20px',
    background: '#8b5cf6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms',
    display: 'inline-block',
  },

  alertError: {
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    color: '#fca5a5',
    marginBottom: '16px',
  },

  alertSuccess: {
    padding: '12px 16px',
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.5)',
    borderRadius: '8px',
    color: '#6ee7b7',
    marginBottom: '16px',
  },

  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },

  tableContainer: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    overflowX: 'auto',
    backdropFilter: 'blur(10px)',
    WebkitOverflowScrolling: 'touch',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    padding: '16px',
    textAlign: 'left',
    background: 'rgba(15, 23, 42, 0.6)',
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: '600',
    borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
  },

  tr: {
    borderBottom: '1px solid rgba(71, 85, 105, 0.2)',
  },

  td: {
    padding: '16px',
    color: '#e2e8f0',
    fontSize: '14px',
  },

  emptyCell: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  },

  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },

  badgeAdmin: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
  },

  badgeUser: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
  },

  actionButtons: {
    display: 'flex',
    gap: '8px',
  },

  editButton: {
    padding: '6px 12px',
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '6px',
    color: '#93c5fd',
    fontSize: '12px',
    cursor: 'pointer',
  },

  deleteButton: {
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '12px',
    cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },

  modal: {
    background: 'rgba(30, 41, 59, 0.95)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
    backdropFilter: 'blur(10px)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },

  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
  },

  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '24px',
    cursor: 'pointer',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    width: '100%',
    boxSizing: 'border-box',
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

  select: {
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },

  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },

  cancelButton: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '8px',
    color: '#cbd5e1',
    fontSize: '14px',
    cursor: 'pointer',
  },

  submitButton: {
    padding: '10px 20px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default UserManagement;
