import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync / verify current user on initial mount
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      // data: { token, type, id, username, email, role }
      const userObj = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userObj));
      setToken(data.token);
      setUser(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      return {
        success: false,
        error: err.userMessage || 'Invalid username or password'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((...allowedRoles) => {
    if (!user || !user.role) return false;
    // Roles can be passed as ('ADMIN', 'FACULTY') or (['ADMIN', 'FACULTY'])
    const flat = allowedRoles.flat();
    return flat.includes(user.role);
  }, [user]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
