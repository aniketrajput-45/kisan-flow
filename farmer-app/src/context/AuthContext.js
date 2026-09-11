import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginFarmer, registerFarmer, logoutFarmer } from '../api/auth';
import { loadStoredToken, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore persisted token from AsyncStorage on app boot
    const restoreSession = async () => {
      try {
        const storedToken = await loadStoredToken();
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (e) {
        console.warn('Session restore error:', e);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (phone, password) => {
    try {
      const res = await loginFarmer({ phone, password });
      const userData = res.data?.user || res.user || { phone, name: 'Farmer' };
      const jwtToken = res.data?.token || res.token;

      await setAuthToken(jwtToken);
      setUser(userData);
      setToken(jwtToken);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (name, phone, password) => {
    try {
      // NOTE: Public registration MUST NOT send a role parameter
      const res = await registerFarmer({ name, phone, password });
      const userData = res.data?.user || res.user || { name, phone, role: 'FARMER' };
      const jwtToken = res.data?.token || res.token;

      await setAuthToken(jwtToken);
      setUser(userData);
      setToken(jwtToken);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    await setAuthToken(null);
    logoutFarmer();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
