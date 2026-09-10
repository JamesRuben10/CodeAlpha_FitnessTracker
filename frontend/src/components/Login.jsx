import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData);
    setLoading(false);
    
    if (result.verificationRequired) {
      navigate('/verify-email', { state: { email: result.email || formData.email } });
    } else if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container login-page">
      <div className="login-brand-panel">
        <span className="login-kicker">PERSONAL PERFORMANCE</span>
        <h1>Move with purpose.</h1>
        <p>Build momentum, track every session, and make your next milestone count.</p>
        <div className="login-brand-mark" aria-hidden="true">FT</div>
      </div>
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-overline">FITNESS TRACKER</span>
          <h2>Welcome back</h2>
        </div>
        <p className="auth-subtitle">Login to track your fitness journey</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="jamesruben@gmail.com"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password"
                minLength="6"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;