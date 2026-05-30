import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookOpen, Heart, MessageSquare, Edit, Trash2, User, BarChart2, PlusCircle, Settings, Camera, LogOut } from 'lucide-react';
import { BlogCardSkeleton } from '../components/LoadingSkeleton';

const Dashboard = () => {
  const { user, token, updateProfile, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('articles'); // 'articles' | 'profile' | 'analytics'
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Stats calculation
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  });

  const fetchUserPosts = async () => {
    if (!user) return;
    try {
      setLoadingPosts(true);
      const res = await fetch(`${API_URL}/posts?author=${user._id}`);
      const data = await res.json();
      if (data.success) {
        setUserPosts(data.posts);
        
        // Calculate stats
        const totalPosts = data.total;
        const totalLikes = data.posts.reduce((sum, post) => sum + (post.likes ? post.likes.length : 0), 0);
        const totalComments = data.posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
        
        setStats({
          totalPosts,
          totalLikes,
          totalComments
        });
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [user]);

  // Handle avatar selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Avatar image must be smaller than 2MB', 'warning');
        return;
      }
      setProfileAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile Edit Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      addToast('Name is required', 'warning');
      return;
    }

    try {
      setSubmittingProfile(true);
      
      const formData = new FormData();
      formData.append('name', profileName.trim());
      formData.append('bio', profileBio.trim());
      if (profilePassword) {
        formData.append('password', profilePassword);
      }
      if (profileAvatarFile) {
        formData.append('avatar', profileAvatarFile);
      }

      await updateProfile(formData);
      addToast('Profile updated successfully!', 'success');
      setProfilePassword('');
      setProfileAvatarFile(null);
    } catch (error) {
      addToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Post Deletion Handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this article? This action is permanent.')) return;

    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        addToast('Article deleted successfully', 'success');
        // Update state locally
        setUserPosts(prev => prev.filter(p => p._id !== postId));
        setStats(prev => ({
          ...prev,
          totalPosts: prev.totalPosts - 1
        }));
      } else {
        addToast(data.message || 'Failed to delete article', 'error');
      }
    } catch (error) {
      addToast('Network error while deleting article', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', minHeight: 'calc(100vh - 100px)' }}>
      {/* Dashboard Top Header Banner */}
      <header className="card glass-panel" style={headerBannerStyle}>
        <div style={userInfoWrapperStyle}>
          {user.avatar ? (
            <img src={`http://localhost:5000${user.avatar}`} alt={user.name} style={profileBannerAvatarStyle} onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }} />
          ) : (
            <div style={profileBannerAvatarFallbackStyle}>{user.name[0].toUpperCase()}</div>
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user.name}</h2>
              {user.role === 'admin' && <span className="badge">Admin</span>}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>{user.email}</p>
            {user.bio && <p style={bioTextStyle}>"{user.bio}"</p>}
          </div>
        </div>

        <Link to="/write" className="btn btn-primary animate-pulse" style={{ padding: '0.6rem 1.25rem' }}>
          <PlusCircle size={16} /> Write Article
        </Link>
      </header>

      {/* Tab Navigation Sidebar & Content Layout */}
      <div style={dashboardGridStyle}>
        {/* Left Side: Sidebar Tabs Navigation */}
        <aside style={sidebarStyle}>
          <button
            onClick={() => setActiveTab('articles')}
            style={activeTab === 'articles' ? activeTabBtnStyle : tabBtnStyle}
          >
            <BookOpen size={16} /> My Articles ({stats.totalPosts})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={activeTab === 'analytics' ? activeTabBtnStyle : tabBtnStyle}
          >
            <BarChart2 size={16} /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={activeTab === 'profile' ? activeTabBtnStyle : tabBtnStyle}
          >
            <Settings size={16} /> Edit Profile
          </button>
          <hr style={dividerStyle} />
          <button onClick={() => { logout(); navigate('/login'); }} style={logoutBtnStyle}>
            <LogOut size={16} /> Log Out
          </button>
        </aside>

        {/* Right Side: Tab Panel Content */}
        <main style={contentPanelStyle}>
          {/* Tab 1: Articles Management */}
          {activeTab === 'articles' && (
            <section className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={panelHeaderStyle}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Published Articles</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage your written stories</span>
              </div>

              {loadingPosts ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="card shimmer" style={{ height: '100px', borderRadius: '12px' }} />
                ))
              ) : userPosts.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem 1.5rem', borderStyle: 'dashed' }}>
                  <BookOpen size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <h4>No Stories Written Yet</h4>
                  <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
                    Share your experiences, ideas, and creations with the community!
                  </p>
                  <Link to="/write" className="btn btn-primary">Start Writing</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {userPosts.map(post => (
                    <div key={post._id} className="card" style={postItemStyle}>
                      <div style={postTextWrapperStyle}>
                        <div style={postMetaRowStyle}>
                          <span className="badge">{post.category}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 style={postTitleStyle}>
                          <Link to={`/posts/${post.slug || post._id}`}>{post.title}</Link>
                        </h4>
                        <div style={postStatsStyle}>
                          <span style={postStatStyle}><Heart size={12} /> {post.likes ? post.likes.length : 0} likes</span>
                          <span style={postStatStyle}><MessageSquare size={12} /> {post.commentsCount || 0} comments</span>
                        </div>
                      </div>

                      <div style={postActionsWrapperStyle}>
                        <Link to={`/write?edit=${post._id}`} className="btn btn-secondary btn-icon" title="Edit Article">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDeletePost(post._id)} className="btn btn-danger btn-icon" title="Delete Article">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Tab 2: Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <section className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={panelHeaderStyle}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Performance Metrics</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Insights into your story views & engagement</span>
              </div>

              {/* Stats Counters Grid */}
              <div style={metricsGridStyle}>
                <div className="card" style={metricsCardStyle}>
                  <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
                  <span style={metricLabelStyle}>Total Articles</span>
                  <span style={metricNumberStyle}>{stats.totalPosts}</span>
                </div>
                <div className="card" style={metricsCardStyle}>
                  <Heart size={24} style={{ color: 'var(--color-secondary)' }} />
                  <span style={metricLabelStyle}>Total Likes</span>
                  <span style={metricNumberStyle}>{stats.totalLikes}</span>
                </div>
                <div className="card" style={metricsCardStyle}>
                  <MessageSquare size={24} style={{ color: 'var(--color-success)' }} />
                  <span style={metricLabelStyle}>Total Comments</span>
                  <span style={metricNumberStyle}>{stats.totalComments}</span>
                </div>
              </div>

              {/* Recents activities list */}
              <div className="card" style={{ textAlign: 'left' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  Platform Engagement Advice
                </h4>
                <ul style={adviceListStyle}>
                  <li>✍️ Write consistently to keep your community followers engaged.</li>
                  <li>🏷️ Tag your posts carefully to raise visibility in search filters.</li>
                  <li>💬 Reply to comments on your articles to foster community dialogue.</li>
                  <li>🖼️ Pick high-contrast, professional cover images to maximize CTR.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Tab 3: Edit Profile Panel */}
          {activeTab === 'profile' && (
            <section className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={panelHeaderStyle}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Account Settings</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modify your author persona details</span>
              </div>

              <form onSubmit={handleProfileSubmit} encType="multipart/form-data" className="card" style={formCardStyle}>
                
                {/* Profile avatar editor with live preview */}
                <div style={avatarEditContainerStyle}>
                  <div style={avatarEditPreviewWrapperStyle}>
                    {profileAvatarPreview ? (
                      <img src={profileAvatarPreview} alt="Avatar preview" style={avatarEditPreviewStyle} />
                    ) : user.avatar ? (
                      <img src={`http://localhost:5000${user.avatar}`} alt={user.name} style={avatarEditPreviewStyle} onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }} />
                    ) : (
                      <div style={avatarEditPlaceholderStyle}>{user.name[0].toUpperCase()}</div>
                    )}
                    <label htmlFor="dashboard-avatar-upload" style={dashboardCameraLabelStyle}>
                      <Camera size={14} />
                      <input
                        id="dashboard-avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block' }}>Update Avatar Picture</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG or WEBP (Max 2MB)</span>
                  </div>
                </div>

                {/* Name */}
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="form-control"
                  />
                </div>

                {/* Bio */}
                <div className="form-group">
                  <label className="form-label">Biography</label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="form-control"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                {/* Password change */}
                <div className="form-group">
                  <label className="form-label">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    placeholder="New password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="form-control"
                  />
                </div>

                {/* Save button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingProfile}
                  >
                    {submittingProfile ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                </div>

              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

// Styling definitions
const headerBannerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 2rem',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '16px'
};

const userInfoWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem'
};

const profileBannerAvatarStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid var(--color-primary)'
};

const profileBannerAvatarFallbackStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '1.5rem'
};

const bioTextStyle = {
  fontSize: '0.85rem',
  fontStyle: 'italic',
  color: 'var(--text-muted)',
  marginTop: '4px',
  maxWidth: '450px'
};

const dashboardGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '2rem'
};

const sidebarStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  textAlign: 'left'
};

const tabBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  color: 'var(--text-muted)',
  transition: 'all 0.2s',
  textAlign: 'left',
  width: '100%'
};

const activeTabBtnStyle = {
  ...tabBtnStyle,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-light)',
  border: '1px solid rgba(var(--color-primary-hsl), 0.1)'
};

const logoutBtnStyle = {
  ...tabBtnStyle,
  color: 'var(--color-danger)',
  ':hover': {
    backgroundColor: 'rgba(239, 68, 68, 0.08)'
  }
};

const dividerStyle = {
  border: 'none',
  borderBottom: '1px solid var(--border-color)',
  margin: '1rem 0'
};

const contentPanelStyle = {
  flex: 1
};

const panelHeaderStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  marginBottom: '0.5rem'
};

const postItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.25rem',
  flexWrap: 'wrap',
  gap: '12px'
};

const postTextWrapperStyle = {
  textAlign: 'left',
  flex: 1,
  minWidth: '220px'
};

const postMetaRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.4rem'
};

const postTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  lineHeight: 1.3,
  color: 'var(--text-main)',
  marginBottom: '0.4rem',
  transition: 'color 0.2s',
  ':hover': {
    color: 'var(--color-primary)'
  }
};

const postStatsStyle = {
  display: 'flex',
  gap: '0.75rem',
  fontSize: '0.75rem',
  color: 'var(--text-muted)'
};

const postStatStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const postActionsWrapperStyle = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center'
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  marginTop: '0.75rem',
  marginBottom: '0.25rem'
};

const metricNumberStyle = {
  fontSize: '2rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  fontFamily: 'var(--font-heading)'
};

const adviceListStyle = {
  paddingLeft: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: 'var(--text-muted)',
  listStyleType: 'none'
};

const formCardStyle = {
  textAlign: 'left',
  padding: '2rem'
};

const avatarEditContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  marginBottom: '1.5rem'
};

const avatarEditPreviewWrapperStyle = {
  position: 'relative',
  width: '80px',
  height: '80px'
};

const avatarEditPreviewStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid var(--color-primary)'
};

const avatarEditPlaceholderStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: 'var(--border-color)',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '1.75rem'
};

const dashboardCameraLabelStyle = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  width: '26px',
  height: '26px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-md)'
};

// Add dashboard media queries tags
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @media (min-width: 768px) {
      div.container:has(header) {
        display: block !important;
      }
      div.container > div:has(aside) {
        grid-template-columns: 240px 1fr !important;
        align-items: start !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Dashboard;
