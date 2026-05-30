import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div style={wrapperStyle}>
      <div className="card glass-panel" style={cardStyle}>
        <ShieldAlert size={64} style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 1rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '340px', margin: '0 auto 2rem' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          <Home size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
};

const wrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 100px)',
  padding: '2rem 1.5rem'
};

const cardStyle = {
  width: '100%',
  maxWidth: '460px',
  padding: '3rem 2.5rem',
  textAlign: 'center',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-xl)'
};

export default NotFound;
