import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import Dashboard from './components/Dashboard';
import AddActivity from './components/AddActivity';
import ActivityList from './components/ActivityList';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import './index.css';

// Private Route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const publicRoutes = ['/login', '/register', '/verify-email'];
  const showNavbar = user && !publicRoutes.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/add-activity" 
            element={
              <PrivateRoute>
                <AddActivity />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/activities" 
            element={
              <PrivateRoute>
                <ActivityList />
              </PrivateRoute>
            } 
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </>
  );
}

const AppWithRouter = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default AppWithRouter;