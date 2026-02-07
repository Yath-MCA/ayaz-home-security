// User Service - Handles CRUD operations for users with JSON file storage

const STORAGE_KEY = 'usersData';

// Initialize with default admin user if no data exists
const initializeUsers = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const defaultUsers = [
      {
        id: '1',
        username: 'admin',
        password: 'admin123',
        email: 'admin@security.com',
        role: 'admin',
        fullName: 'Administrator',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  
  const users = JSON.parse(existing);
  
  // Ensure default admin user exists (in case it was deleted)
  const adminExists = users.some(u => u.username === 'admin');
  if (!adminExists) {
    const defaultAdmin = {
      id: '1',
      username: 'admin',
      password: 'admin123',
      email: 'admin@security.com',
      role: 'admin',
      fullName: 'Administrator',
      createdAt: new Date().toISOString(),
    };
    users.unshift(defaultAdmin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return users;
  }
  
  return users;
};

// Get all users (with passwords) - for authentication
export const getUsersForAuth = () => {
  return initializeUsers();
};

// Get all users (without passwords) - for display
export const getUsers = () => {
  const users = initializeUsers();
  // Remove passwords from returned data
  return users.map(({ password, ...user }) => user);
};

// Get user by ID
export const getUserById = (id) => {
  const users = initializeUsers();
  const user = users.find(u => u.id === id);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

// Create new user
export const createUser = (userData) => {
  const users = initializeUsers();
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// Update user
export const updateUser = (id, userData) => {
  const users = initializeUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    throw new Error('User not found');
  }
  
  // Preserve password if not provided
  const updatedUser = {
    ...users[index],
    ...userData,
    id, // Ensure ID doesn't change
  };
  
  users[index] = updatedUser;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

// Delete user
export const deleteUser = (id) => {
  const users = initializeUsers();
  const filtered = users.filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

// Export users to JSON file
export const exportUsers = () => {
  const users = getUsers();
  const dataStr = JSON.stringify(users, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `users_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Import users from JSON file
export const importUsers = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedUsers = JSON.parse(e.target.result);
        if (Array.isArray(importedUsers)) {
          // Validate and merge with existing users
          const existingUsers = initializeUsers();
          const merged = [...existingUsers];
          
          importedUsers.forEach(importedUser => {
            const existingIndex = merged.findIndex(u => u.id === importedUser.id || u.username === importedUser.username);
            if (existingIndex >= 0) {
              // Update existing user
              merged[existingIndex] = { ...merged[existingIndex], ...importedUser };
            } else {
              // Add new user
              if (!importedUser.id) {
                importedUser.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              }
              merged.push(importedUser);
            }
          });
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          resolve(merged);
        } else {
          reject(new Error('Invalid JSON format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Reset to default users (useful for troubleshooting)
export const resetToDefaultUsers = () => {
  const defaultUsers = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      email: 'admin@security.com',
      role: 'admin',
      fullName: 'Administrator',
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};
