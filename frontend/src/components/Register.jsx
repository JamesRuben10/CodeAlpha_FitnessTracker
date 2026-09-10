import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, error, setError } = useAuth();
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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    setLoading(false);
    
    if (result.success && result.verificationRequired) {
      navigate('/verify-email', { state: { email: result.email } });
    } else if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container register-page">
      <div className="login-brand-panel">
        <span className="login-kicker">START YOUR NEXT CHAPTER</span>
        <h1>Train smarter.</h1>
        <p>Turn consistent effort into visible progress with one clear place for every workout.</p>
        <div className="login-brand-mark" aria-hidden="true">FT</div>
      </div>
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-overline">FITNESS TRACKER</span>
          <h2>Create your account</h2>
        </div>
        <p className="auth-subtitle">Start tracking your fitness today</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="James Ruben"
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="youremail@gmail.com"
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
          
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                minLength="6"
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;