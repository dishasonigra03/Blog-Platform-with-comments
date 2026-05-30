import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (error) {
          console.error('Failed to verify session:', error);
          // If server is offline, don't clear token immediately, but stop loading
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password, rememberMe) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rememberMe })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      setToken(data.token);

      if (rememberMe) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Register handler
  const register = async (formData) => {
    try {
      // Since registration can contain avatar image, formData should be a FormData object
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: formData // Content-Type is auto-set for FormData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      setUser(data.user);
      setToken(data.token);
      sessionStorage.setItem('token', data.token); // default to session storage unless checked during login

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  };

  // Update profile details
  const updateProfile = async (formData) => {
    try {
      const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        },
        body: formData // Multer handles multipart/form-data
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
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
