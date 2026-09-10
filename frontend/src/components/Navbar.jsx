import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHome, FaPlus, FaList, FaSignOutAlt, FaUser, FaCog } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard">🏋️ FitnessTracker</Link>
        </div>
        
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">
            <FaHome /> Dashboard
          </Link>
          <Link to="/add-activity" className="nav-link">
            <FaPlus /> Add
          </Link>
          <Link to="/activities" className="nav-link">
            <FaList /> Activities
          </Link>
          <Link to="/settings" className="nav-link">
            <FaCog /> Settings
          </Link>
        </div>
        
        <div className="navbar-user">
          <span className="badge-count">🏆 {user?.achievements?.length || 0} Badges</span>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span className="user-name">
            <FaUser /> {user?.name}
          </span>
          <button onClick={handleLogout} className="btn-logout">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;