import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import API_URL from '../config/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [theme, setTheme] = useState(user?.theme || localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (user?.theme) setTheme(user.theme);
  }, [user?.theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    updateUser({ theme: nextTheme });
    if (user) {
      try {
        await axios.put(`${API_URL}/auth/theme`, { theme: nextTheme });
      } catch (error) {
        console.error('Could not save theme:', error);
      }
    }
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
