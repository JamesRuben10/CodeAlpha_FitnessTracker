import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification, error, setError } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice('');
    const result = await verifyEmail({ email, code });
    setLoading(false);
    if (result.success) navigate('/dashboard');
  };

  const handleResend = async () => {
    setNotice('');
    const result = await resendVerification(email);
    if (result.success) {
      setError(null);
      setNotice(result.message);
    }
  };

  return (
    <div className="auth-container register-page verification-page">
      <div className="login-brand-panel">
        <span className="login-kicker">ONE LAST STEP</span>
        <h1>Confirm your stride.</h1>
        <p>Verify your email so your progress stays connected to you.</p>
        <div className="login-brand-mark" aria-hidden="true">FT</div>
      </div>
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-overline">EMAIL VERIFICATION</span>
          <h2>Check your inbox</h2>
        </div>
        <p className="auth-subtitle">We just sent you a six-digit verification code. Enter it below to activate your account.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="form-group">
            <label>Verification code</label>
            <input className="verification-code-input" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>
        <button type="button" className="resend-button" onClick={handleResend}>Didn’t receive it? Resend code</button>
        <p className="auth-link">Already verified? <Link to="/login">Return to login</Link></p>
      </div>
    </div>
  );
};

export default VerifyEmail;
