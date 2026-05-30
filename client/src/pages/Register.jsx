import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, Mail, Lock, User, FileText, Camera } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
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
    if (bio && bio.length > 200) {
      newErrors.bio = 'Bio cannot be more than 200 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle avatar file selection & create local preview
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Avatar image must be smaller than 2MB', 'warning');
        return;
      }
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Create multipart FormData
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('bio', bio.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await register(formData);
      addToast('Welcome to InkSphere! Your account is created.', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Registration failed. Try a different email.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageWrapperStyle}>
      <div className="card glass-panel" style={registerCardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Join our writing community today
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginTop: '1.5rem' }}>
          
          {/* Avatar Upload with preview */}
          <div style={avatarUploadContainerStyle}>
            <div style={avatarPreviewWrapperStyle}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" style={avatarPreviewStyle} />
              ) : (
                <div style={avatarPlaceholderStyle}>
                  <User size={32} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <label htmlFor="avatar-upload" style={cameraLabelStyle}>
                <Camera size={14} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block' }}>Profile Picture</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG, WEBP (Max 2MB)</span>
            </div>
          </div>

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={inputContainerStyle}>
              <User size={16} style={inputIconStyle} />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={inputContainerStyle}>
              <Mail size={16} style={inputIconStyle} />
              <input
                type="email"
                placeholder="john@example.com"
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
            <label className="form-label">Password (Min 6 Characters)</label>
            <div style={inputContainerStyle}>
              <Lock size={16} style={inputIconStyle} />
              <input
                type="password"
                placeholder="Create a strong password"
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

          {/* Bio */}
          <div className="form-group">
            <label className="form-label">Short Bio (Optional)</label>
            <div style={inputContainerStyle}>
              <FileText size={16} style={{ ...inputIconStyle, top: '14px' }} />
              <textarea
                placeholder="Tell the community about yourself (Max 200 chars)..."
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (errors.bio) setErrors(prev => ({ ...prev, bio: null }));
                }}
                className="form-control"
                style={{ paddingLeft: '2.5rem', minHeight: '60px' }}
                maxLength={200}
              />
            </div>
            {errors.bio && <span style={errorTextStyle}>{errors.bio}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={submitBtnStyle}
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : (
              <>
                <UserPlus size={16} /> Sign Up
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={footerLinkStyle}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

// Layout styles
const pageWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 100px)',
  padding: '2rem 1.5rem'
};

const registerCardStyle = {
  width: '100%',
  maxWidth: '460px',
  padding: '2.5rem',
  boxShadow: 'var(--shadow-xl)',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'left'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '1rem'
};

const avatarUploadContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  marginBottom: '1.5rem'
};

const avatarPreviewWrapperStyle = {
  position: 'relative',
  width: '70px',
  height: '70px'
};

const avatarPreviewStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid var(--color-primary)'
};

const avatarPlaceholderStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: 'var(--bg-card-hover)',
  border: '2px dashed var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const cameraLabelStyle = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-md)',
  transition: 'transform 0.2s',
  ':hover': {
    transform: 'scale(1.1)'
  }
};

const inputContainerStyle = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column'
};

const inputIconStyle = {
  position: 'absolute',
  left: '12px',
  top: '12px',
  color: 'var(--text-muted)',
  opacity: 0.8
};

const errorTextStyle = {
  fontSize: '0.75rem',
  color: 'var(--color-danger)',
  fontWeight: 500,
  marginTop: '2px'
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

export default Register;
