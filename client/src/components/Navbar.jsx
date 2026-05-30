import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, LogOut, LayoutDashboard, Settings, Compass, Feather } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel" style={navStyle}>
      <div className="container" style={containerStyle}>
        {/* Brand Logo */}
        <Link to="/" style={logoStyle} onClick={() => setMobileOpen(false)}>
          <div style={logoIconStyle}><Feather size={20} /></div>
          <span>InkSphere</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div style={desktopLinksStyle}>
          <Link to="/" style={isActive('/') ? activeLinkStyle : linkStyle}>
            <Compass size={16} /> Explore
          </Link>
          
          {user && (
            <>
              <Link to="/dashboard" style={isActive('/dashboard') ? activeLinkStyle : linkStyle}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" style={isActive('/admin') ? activeLinkStyle : linkStyle}>
                  <Settings size={16} /> Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right side buttons (Auth, Theme, Mobile Toggle) */}
        <div style={rightActionsStyle}>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="btn-secondary" style={iconBtnStyle} title="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* User info / Login buttons */}
          <div style={desktopAuthStyle}>
            {user ? (
              <div style={userProfileWrapperStyle}>
                <Link to="/dashboard" style={profileLinkStyle}>
                  {user.avatar ? (
                    <img src={`http://localhost:5000${user.avatar}`} alt={user.name} style={avatarStyle} onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }} />
                  ) : (
                    <div style={avatarFallbackStyle}>{user.name[0].toUpperCase()}</div>
                  )}
                  <span style={{ fontWeight: 500 }}>{user.name.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem' }} title="Log out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Log In</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-secondary" style={mobileToggleBtnStyle}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileOpen && (
        <div className="glass-panel" style={mobileMenuStyle}>
          <Link to="/" style={mobileNavLinkStyle(isActive('/'))} onClick={() => setMobileOpen(false)}>
            Explore Blogs
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard" style={mobileNavLinkStyle(isActive('/dashboard'))} onClick={() => setMobileOpen(false)}>
                User Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" style={mobileNavLinkStyle(isActive('/admin'))} onClick={() => setMobileOpen(false)}>
                  Admin Panel
                </Link>
              )}
              
              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
              
              <div style={mobileUserStyle}>
                {user.avatar ? (
                  <img src={`http://localhost:5000${user.avatar}`} alt={user.name} style={avatarStyle} onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }} />
                ) : (
                  <div style={avatarFallbackStyle}>{user.name[0].toUpperCase()}</div>
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', marginTop: '0.5rem' }}>
                <LogOut size={16} /> Log Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link to="/register" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// Inline styles designed to integrate with global.css and variables.css
const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  padding: '0.8rem 0',
  borderBottom: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-sm)'
};

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '50px'
};

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '1.4rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  fontFamily: 'var(--font-heading)',
  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

const logoIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.35rem',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  color: 'white',
  WebkitTextFillColor: 'initial' // Prevents the logo icon from becoming transparent
};

const desktopLinksStyle = {
  display: 'none',
  alignItems: 'center',
  gap: '1.5rem',
  marginLeft: '2rem',
  marginRight: 'auto'
};

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  color: 'var(--text-muted)',
  fontSize: '0.95rem',
  fontWeight: 500,
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  transition: 'all 0.2s'
};

const activeLinkStyle = {
  ...linkStyle,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-light)'
};

const rightActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const iconBtnStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer'
};

const desktopAuthStyle = {
  display: 'none'
};

const userProfileWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const profileLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.25rem 0.5rem',
  borderRadius: '20px',
  cursor: 'pointer'
};

const avatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '1.5px solid var(--border-color)'
};

const avatarFallbackStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.9rem'
};

const mobileToggleBtnStyle = {
  display: 'flex',
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer'
};

const mobileMenuStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
  gap: '1rem',
  borderTop: 'none',
  borderBottom: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-lg)'
};

const mobileNavLinkStyle = (active) => ({
  fontSize: '1rem',
  fontWeight: 600,
  color: active ? 'var(--color-primary)' : 'var(--text-main)',
  padding: '0.5rem 0'
});

const mobileUserStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 0'
};

// Add responsive media query rules tags
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @media (min-width: 768px) {
      nav > div > div:nth-child(2) { display: flex !important; }
      nav > div > div:nth-child(3) > div:nth-child(2) { display: flex !important; }
      nav > div > div:nth-child(3) > button:nth-child(3) { display: none !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Navbar;
