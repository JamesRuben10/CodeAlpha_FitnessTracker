import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authRequestId = useRef(0);

  // Set auth token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    const requestId = ++authRequestId.current;
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      if (requestId !== authRequestId.current || !localStorage.getItem('token')) return;
      setUser(res.data);
      setError(null);
    } catch (error) {
      if (requestId !== authRequestId.current) return;
      console.error('Load user error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      if (res.data.token) {
        setAuthToken(res.data.token);
        setUser(res.data);
      }
      setError(null);
      return { success: true, verificationRequired: res.data.verificationRequired, email: res.data.email };
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const verifyEmail = async (verificationData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/verify`, verificationData);
      setAuthToken(res.data.token);
      setUser(res.data);
      setError(null);
      return { success: true, message: res.data.message };
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
      return { success: false };
    }
  };

  const resendVerification = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/auth/resend-verification`, { email });
      setError(null);
      return { success: true, message: res.data.message };
    } catch (error) {
      setError(error.response?.data?.message || 'Could not resend the code');
      return { success: false };
    }
  };

  const login = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email.trim().toLowerCase(),
        password: userData.password
      });
      setAuthToken(res.data.token);
      setUser(res.data);
      setError(null);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message
        || (error.request ? 'The server is unavailable. Start the backend with npm start from the backend folder.' : 'Login failed');
      setError(message);
      return {
        success: false,
        error: message,
        verificationRequired: error.response?.data?.verificationRequired,
        email: error.response?.data?.email
      };
    }
  };

  const logout = () => {
    authRequestId.current += 1;
    setAuthToken(null);
    setUser(null);
    setError(null);
  };

  const updateUser = (updates) => setUser(previous => ({ ...previous, ...updates }));

  const updateGoals = async (goals) => {
    try {
      const res = await axios.put(`${API_URL}/auth/goals`, goals);
      setUser(prev => ({ ...prev, dailyGoal: res.data }));
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Update failed');
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    verifyEmail,
    resendVerification,
    login,
    logout,
    updateGoals,
    updateUser,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};