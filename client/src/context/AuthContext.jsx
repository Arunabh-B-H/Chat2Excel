import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Gemini-style persistent side-by-side sidebar state
  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('chat2excel_sidebar');
    return saved !== null ? saved === 'true' : true;
  });

  const setSidebarOpen = (val) => {
    setSidebarOpenState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('chat2excel_sidebar', String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Dedicated right-docked Support Bot state
  const [supportBotOpen, setSupportBotOpen] = useState(false);
  const toggleSupportBot = () => {
    setSupportBotOpen((prev) => !prev);
  };

  // Load user data on startup if token exists
  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);

    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await API.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.warn('Failed to load user session:', err.response?.data?.error || err.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();

    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const googleLogin = async (credentialOrPayload) => {
    const payload =
      typeof credentialOrPayload === 'string'
        ? { credential: credentialOrPayload }
        : credentialOrPayload;

    const { data } = await API.post('/auth/google', payload);
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await API.get('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pricingModalOpen,
        setPricingModalOpen,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        supportBotOpen,
        setSupportBotOpen,
        toggleSupportBot,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        updateUser,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

