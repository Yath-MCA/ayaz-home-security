import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsersForAuth } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      try {
        // Get users from storage (this will initialize default admin if needed)
        const users = getUsersForAuth();
        
        // Find user
        const foundUser = users.find(
          u => u.username === username && u.password === password
        );

        if (foundUser) {
          const userData = { ...foundUser };
          delete userData.password; // Don't store password in state
          setUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error('Invalid username or password'));
        }
      } catch (error) {
        reject(new Error('Login failed: ' + error.message));
      }
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
