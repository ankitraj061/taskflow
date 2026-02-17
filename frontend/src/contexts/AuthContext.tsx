// AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { axiosClient } from '../client/axiosClient';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await axiosClient.get('/api/auth/me');
      if (response.data.authenticated) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await axiosClient.post('/api/auth/login', { email, password });
    setUser(response.data.user);
    localStorage.setItem("userId", response.data.user.id);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await axiosClient.post('/api/auth/register', { name, email, password });
    setUser(response.data.user);
    localStorage.setItem("userId", response.data.user.id);
  }, []);

  const logout = useCallback(async () => {
    await axiosClient.post('/api/auth/logout');
    setUser(null);
    localStorage.removeItem("userId");
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};