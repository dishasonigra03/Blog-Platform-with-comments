import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BarChart3, Users, BookOpen, Heart, MessageSquare, Trash2, ShieldAlert, Award, UserCheck, Edit3 } from 'lucide-react';

const AdminPanel = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'posts'
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Users management
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsersPages, setTotalUsersPages] = useState(1);

  // Posts management
  const [postsList, setPostsList] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsPage, setPostsPage] = useState(1);
  const [totalPostsPages, setTotalPostsPages] = useState(1);

  // Check admin role safety lock
  useEffect(() => {
    if (user && user.role !== 'admin') {
      addToast('Access denied. Administrator privileges required.', 'error');
      navigate('/dashboard');
    }
  }, [user]);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch(`${API_URL}/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch(`${API_URL}/admin/users?page=${usersPage}&limit=8`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
        setTotalUsersPages(data.pages);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Posts
  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch(`${API_URL}/posts?page=${postsPage}&limit=8`);
      const data = await res.json();
      if (data.success) {
        setPostsList(data.posts);
        setTotalPostsPages(data.pages);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') fetchAnalytics();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'posts') fetchPosts();
  }, [activeTab, usersPage, postsPage]);

  // Update user role handler
  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change ${targetUser.name}'s role to ${nextRole}?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${targetUser._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      const data = await res.json();

      if (data.success) {
        addToast(`Successfully updated role to ${nextRole}`, 'success');
        setUsersList(prev => prev.map(u => u._id === targetUser._id ? { ...u, role: nextRole } : u));
      } else {
        addToast(data.message || 'Failed to update user role', 'error');
      }
    } catch (error) {
      addToast('Network error while updating role', 'error');
    }
  };

  // Delete user account cascade handler
  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to delete ${targetUser.name}'s account? This will cascade-delete ALL their written posts and comments. This action CANNOT be undone.`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${targetUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        addToast('Account and cascading content deleted successfully', 'success');
        setUsersList(prev => prev.filter(u => u._id !== targetUser._id));
      } else {
        addToast(data.message || 'Failed to delete account', 'error');
      }
    } catch (error) {
      addToast('Network error while deleting account', 'error');
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this article? All comments under it will also be deleted.')) return;

    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        addToast('Post deleted', 'success');
        setPostsList(prev => prev.filter(p => p._id !== postId));
      } else {
        addToast(data.message || 'Failed to delete post', 'error');
      }
    } catch (error) {
      addToast('Network error while deleting post', 'error');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', minHeight: 'calc(100vh - 100px)' }}>
      {/* Title Header */}
      <div style={panelHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={26} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Platform Administrator Panel</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px', textAlign: 'left' }}>
          Manage users, moderate blog posts, and view overall platform engagement analytics
        </p>
      </div>

      {/* Admin Panel Grid Layout */}
      <div className="admin-grid" style={adminGridStyle}>
        {/* Left Side: Sidebar Tabs Navigation */}
        <aside style={tabsRowStyle}>
          <button
            onClick={() => setActiveTab('overview')}
            style={activeTab === 'overview' ? activeTabBtnStyle : tabBtnStyle}
          >
            <BarChart3 size={16} /> Overview Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={activeTab === 'users' ? activeTabBtnStyle : tabBtnStyle}
          >
            <Users size={16} /> User Accounts
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            style={activeTab === 'posts' ? activeTabBtnStyle : tabBtnStyle}
          >
            <BookOpen size={16} /> Moderate Posts
          </button>
        </aside>

        {/* Right Side: Tab Panel Content */}
        <main style={contentPanelStyle}>
          
          {/* Tab 1: Analytics Overview */}
          {activeTab === 'overview' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {loadingAnalytics ? (
                <div style={metricsGridStyle}>
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="card shimmer" style={{ height: '110px' }} />
                  ))}
                </div>
              ) : analytics ? (
                <>
                  {/* Counters Grid */}
                  <div style={metricsGridStyle}>
                    <div className="card" style={metricsCardStyle}>
                      <Users size={24} style={{ color: 'var(--color-primary)' }} />
                      <span style={metricLabelStyle}>Total Accounts</span>
                      <span style={metricNumberStyle}>{analytics.totalUsers}</span>
                    </div>
                    <div className="card" style={metricsCardStyle}>
                      <BookOpen size={24} style={{ color: 'var(--color-secondary)' }} />
                      <span style={metricLabelStyle}>Total Posts</span>
                      <span style={metricNumberStyle}>{analytics.totalPosts}</span>
                    </div>
                    <div className="card" style={metricsCardStyle}>
                      <MessageSquare size={24} style={{ color: 'var(--color-success)' }} />
                      <span style={metricLabelStyle}>Comments Left</span>
                      <span style={metricNumberStyle}>{analytics.totalComments}</span>
                    </div>
                    <div className="card" style={metricsCardStyle}>
                      <Heart size={24} style={{ color: 'var(--color-danger)' }} />
                      <span style={metricLabelStyle}>Likes Count</span>
                      <span style={metricNumberStyle}>{analytics.totalLikes}</span>
                    </div>
                  </div>

                  {/* Lists Columns (Recents Users & Recents Posts) */}
                  <div style={recentsGridStyle}>
                    {/* Recents Users */}
                    <div className="card" style={{ textAlign: 'left' }}>
                      <h4 style={widgetTitleStyle}>Recent Registrations</h4>
                      <div style={listContainerStyle}>
                        {analytics.recentUsers.map(u => (
                          <div key={u._id} style={listItemStyle}>
                            {u.avatar ? (
                              <img src={`http://localhost:5000${u.avatar}`} alt={u.name} style={listAvatarStyle} onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }} />
                            ) : (
                              <div style={listAvatarFallbackStyle}>{u.name[0].toUpperCase()}</div>
                            )}
                            <div>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{u.name}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                            </div>
                            <span style={dateBadgeStyle}>{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recents Posts */}
                    <div className="card" style={{ textAlign: 'left' }}>
                      <h4 style={widgetTitleStyle}>Recent Stories</h4>
                      <div style={listContainerStyle}>
                        {analytics.recentPosts.map(p => (
                          <div key={p._id} style={listItemStyle}>
                            <div style={{ flex: 1 }}>
                              <Link to={`/posts/${p.slug || p._id}`} style={listPostLinkStyle}>
                                {p.title}
                              </Link>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                by {p.author ? p.author.name : 'Unknown Author'} in <strong>{p.category}</strong>
                              </span>
                            </div>
                            <span style={dateBadgeStyle}>{new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>Failed to load analytics.</p>
              )}
            </div>
          )}

          {/* Tab 2: User Moderation */}
          {activeTab === 'users' && (
            <div className="card animate-slide-up" style={{ padding: '1.5rem 0', overflowX: 'auto', textAlign: 'left' }}>
              <h3 style={{ padding: '0 1.5rem 1rem', fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                User Accounts Database
              </h3>
              {loadingUsers ? (
                <div style={{ padding: '2rem' }}>
                  <div className="shimmer" style={{ height: '40px', marginBottom: '8px' }} />
                  <div className="shimmer" style={{ height: '40px' }} />
                </div>
              ) : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>User</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Joined</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map(u => (
                        <tr key={u._id} style={tableRowStyle}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {u.avatar ? (
                                <img src={`http://localhost:5000${u.avatar}`} alt={u.name} style={listAvatarStyle} onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }} />
                              ) : (
                                <div style={listAvatarFallbackStyle}>{u.name[0].toUpperCase()}</div>
                              )}
                              <span style={{ fontWeight: 600 }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>{u.email}</td>
                          <td style={tdStyle}>
                            <span style={u.role === 'admin' ? adminRoleStyle : userRoleStyle}>
                              {u.role === 'admin' ? <Award size={12} /> : <User size={12} />} {u.role}
                            </span>
                          </td>
                          <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleToggleRole(u)}
                                disabled={u._id === user._id}
                                className="btn btn-secondary"
                                style={roleBtnStyle}
                                title="Toggle admin privilege"
                              >
                                <UserCheck size={12} /> Toggle Role
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={u._id === user._id}
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', borderRadius: '4px' }}
                                title="Delete account"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalUsersPages > 1 && (
                    <div style={tablePaginationStyle}>
                      <button disabled={usersPage === 1} onClick={() => setUsersPage(prev => Math.max(1, prev - 1))} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Prev</button>
                      <span style={{ fontSize: '0.85rem' }}>Page {usersPage} of {totalUsersPages}</span>
                      <button disabled={usersPage === totalUsersPages} onClick={() => setUsersPage(prev => Math.min(totalUsersPages, prev + 1))} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab 3: Moderate Posts */}
          {activeTab === 'posts' && (
            <div className="card animate-slide-up" style={{ padding: '1.5rem 0', overflowX: 'auto', textAlign: 'left' }}>
              <h3 style={{ padding: '0 1.5rem 1rem', fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                Moderated Blog Posts
              </h3>
              {loadingPosts ? (
                <div style={{ padding: '2rem' }}>
                  <div className="shimmer" style={{ height: '40px', marginBottom: '8px' }} />
                  <div className="shimmer" style={{ height: '40px' }} />
                </div>
              ) : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>Post Title</th>
                        <th style={thStyle}>Category</th>
                        <th style={thStyle}>Likes</th>
                        <th style={thStyle}>Published</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {postsList.map(p => (
                        <tr key={p._id} style={tableRowStyle}>
                          <td style={tdStyle}>
                            <Link to={`/posts/${p.slug || p._id}`} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              {p.title}
                            </Link>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              by {p.author ? p.author.name : 'Unknown Author'}
                            </span>
                          </td>
                          <td style={tdStyle}><span className="badge">{p.category}</span></td>
                          <td style={tdStyle}>{p.likes ? p.likes.length : 0}</td>
                          <td style={tdStyle}>{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Link
                                to={`/write?edit=${p._id}`}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', borderRadius: '4px' }}
                                title="Edit post"
                              >
                                <Edit3 size={12} />
                              </Link>
                              <button
                                onClick={() => handleDeletePost(p._id)}
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', borderRadius: '4px' }}
                                title="Delete post"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPostsPages > 1 && (
                    <div style={tablePaginationStyle}>
                      <button disabled={postsPage === 1} onClick={() => setPostsPage(prev => Math.max(1, prev - 1))} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Prev</button>
                      <span style={{ fontSize: '0.85rem' }}>Page {postsPage} of {totalPostsPages}</span>
                      <button disabled={postsPage === totalPostsPages} onClick={() => setPostsPage(prev => Math.min(totalPostsPages, prev + 1))} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// Styling components
const panelHeaderStyle = {
  textAlign: 'left',
  marginBottom: '1.5rem'
};

const adminGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '2rem',
  marginTop: '1.5rem',
  alignItems: 'start'
};

const contentPanelStyle = {
  minWidth: 0
};

const tabsRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  borderBottom: 'none',
  paddingBottom: 0
};

const tabBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: 'none',
  backgroundColor: 'transparent',
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap'
};

const activeTabBtnStyle = {
  ...tabBtnStyle,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-light)'
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem'
};

const metricsCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '1.5rem',
  textAlign: 'center'
};

const metricLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  marginTop: '0.5rem',
  marginBottom: '0.25rem'
};

const metricNumberStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  fontFamily: 'var(--font-heading)'
};

const recentsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem'
};

const widgetTitleStyle = {
  fontWeight: 700,
  fontSize: '1.1rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
  marginBottom: '1rem'
};

const listContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--border-color)',
  ':last-child': {
    borderBottom: 'none',
    paddingBottom: 0
  }
};

const listAvatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  objectFit: 'cover'
};

const listAvatarFallbackStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.8rem'
};

const dateBadgeStyle = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  marginLeft: 'auto'
};

const listPostLinkStyle = {
  fontWeight: 700,
  fontSize: '0.9rem',
  color: 'var(--text-main)',
  lineHeight: 1.3,
  display: 'block',
  ':hover': {
    color: 'var(--color-primary)'
  }
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem'
};

const tableHeaderRowStyle = {
  borderBottom: '2px solid var(--border-color)',
  backgroundColor: 'var(--bg-card-hover)'
};

const thStyle = {
  padding: '12px 16px',
  fontWeight: 700,
  color: 'var(--text-main)',
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.05em'
};

const tableRowStyle = {
  borderBottom: '1px solid var(--border-color)',
  transition: 'background-color 0.2s',
  ':hover': {
    backgroundColor: 'var(--bg-card-hover)'
  }
};

const tdStyle = {
  padding: '12px 16px',
  color: 'var(--text-main)',
  verticalAlign: 'middle'
};

const adminRoleStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-light)',
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
};

const userRoleStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  backgroundColor: 'var(--border-color)',
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
};

const roleBtnStyle = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem'
};

const tablePaginationStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.25rem 1.5rem 0'
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @media (min-width: 768px) {
      .admin-grid {
        grid-template-columns: 240px 1fr !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default AdminPanel;
