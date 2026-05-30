import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';

// Stylesheets
import './styles/variables.css';
import './styles/global.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BlogDetails from './pages/BlogDetails';
import CreateEditPost from './pages/CreateEditPost';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div className="shimmer" style={loadingShimmerStyle} />
      </div>
    );
  }

  if (!user) {
    // Save current location to redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div className="shimmer" style={loadingShimmerStyle} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Footer Component
const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div className="container" style={footerContainerStyle}>
        <p>&copy; {new Date().getFullYear()} InkSphere. All rights reserved.</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Built with React, Express, MongoDB, and Premium Vanilla CSS.
        </p>
      </div>
    </footer>
  );
};

const AppContent = () => {
  return (
    <div style={layoutWrapperStyle}>
      <Navbar />
      <main style={mainContentStyle}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/posts/:idOrSlug" element={<BlogDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/write" 
            element={
              <ProtectedRoute>
                <CreateEditPost />
              </ProtectedRoute>
            } 
          />

          {/* Admin Moderation Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } 
          />

          {/* Error and Redirection */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Router>
              <AppContent />
            </Router>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Inline Styles for Layout Wrappers
const layoutWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh'
};

const mainContentStyle = {
  flex: 1
};

const footerStyle = {
  backgroundColor: 'var(--bg-card-hover)',
  borderTop: '1px solid var(--border-color)',
  padding: '2rem 0',
  marginTop: 'auto',
  textAlign: 'center'
};

const footerContainerStyle = {
  display: 'block !important', // overrides the responsive grid for footer
  color: 'var(--text-muted)',
  fontSize: '0.85rem'
};

const loadingContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: 'var(--bg-body)'
};

const loadingShimmerStyle = {
  height: '50px',
  width: '250px',
  borderRadius: '8px'
};

export default App;
