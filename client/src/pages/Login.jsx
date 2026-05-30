import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Mail, Lock, Feather } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Validate inputs
  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please provide a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await login(email, password, rememberMe);
      addToast('Welcome back to InkSphere!', 'success');
      
      // Navigate to previous location or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      addToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageWrapperStyle}>
      <div className="card glass-panel" style={loginCardStyle}>
        {/* Brand Header */}
        <div style={headerStyle}>
          <div style={logoIconStyle}><Feather size={24} /></div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Login to your InkSphere account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={inputContainerStyle}>
              <Mail size={16} style={inputIconStyle} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                }}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={inputContainerStyle}>
              <Lock size={16} style={inputIconStyle} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                }}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
          </div>

          {/* Remember Me */}
          <div style={metaRowStyle}>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                Remember me
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={submitBtnStyle}
            disabled={submitting}
          >
            {submitting ? 'Logging In...' : (
              <>
                <LogIn size={16} /> Log In
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div style={footerLinkStyle}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  );
};

// Styling components
const pageWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 100px)',
  padding: '2rem 1.5rem'
};

const loginCardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: '2.5rem',
  boxShadow: 'var(--shadow-xl)',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'left'
};

const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: '1rem'
};

const logoIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  color: 'white',
  marginBottom: '1rem',
  boxShadow: '0 4px 12px rgba(var(--color-primary-hsl), 0.3)'
};

const inputContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const inputIconStyle = {
  position: 'absolute',
  left: '12px',
  color: 'var(--text-muted)',
  opacity: 0.8
};

const errorTextStyle = {
  fontSize: '0.75rem',
  color: 'var(--color-danger)',
  fontWeight: 500,
  marginTop: '2px'
};

const metaRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '1.25rem 0'
};

const submitBtnStyle = {
  width: '100%',
  padding: '0.75rem',
  fontSize: '0.95rem',
  marginTop: '0.5rem'
};

const footerLinkStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
  textAlign: 'center',
  marginTop: '2rem'
};

export default Login;
