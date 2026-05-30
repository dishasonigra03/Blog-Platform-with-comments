import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CommentSection from '../components/CommentSection';
import { parseMarkdown } from '../components/MarkdownEditor';
import { BlogDetailSkeleton } from '../components/LoadingSkeleton';
import { Heart, Share2, Calendar, Clock, User, ArrowLeft, Send } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const BlogDetails = () => {
  const { idOrSlug } = useParams();
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [likesState, setLikesState] = useState([]);
  const [commentsCountState, setCommentsCountState] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPopping, setIsPopping] = useState(false);

  // Monitor scroll depth for dynamic reading progress bar indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  const socket = useSocket();

  // Listen for real-time like toggles on this post
  useEffect(() => {
    if (!socket || !post?._id) return;

    socket.emit('join_post', post._id);

    socket.on('post_liked', (data) => {
      if (data.postId === post._id) {
        setLikesState(data.likes);
      }
    });

    return () => {
      socket.emit('leave_post', post._id);
      socket.off('post_liked');
    };
  }, [socket, post?._id]);

  // Fetch post details
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/posts/${idOrSlug}`);
      const data = await res.json();

      if (data.success) {
        setPost(data.post);
        setLikesState(data.post.likes || []);
        setCommentsCountState(data.post.commentsCount || 0);

        // Fetch related posts using post id
        fetchRelatedPosts(data.post._id);
      } else {
        addToast(data.message || 'Post not found', 'error');
        navigate('/404');
      }
    } catch (error) {
      addToast('Error fetching post details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/related`);
      const data = await res.json();
      if (data.success) {
        setRelatedPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [idOrSlug]);

  // Toggle Like Handler
  const handleLikeToggle = async () => {
    if (!user) {
      addToast('Please login to like this post', 'warning');
      return;
    }
    if (liking) return;

    // Trigger like button pop animation
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 350);

    try {
      setLiking(true);
      const res = await fetch(`${API_URL}/posts/${post._id}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        setLikesState(data.likes);
        addToast(
          data.likes.includes(user._id) ? 'Added to liked stories' : 'Removed from liked stories',
          'success'
        );
      }
    } catch (error) {
      addToast('Network error while toggling like', 'error');
    } finally {
      setLiking(false);
    }
  };

  // Share Article Link Handler
  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: `Read "${post.title}" on InkSphere!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        addToast('Link copied to clipboard! Share it with your friends.', 'success');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Format creation date
  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Estimate read time
  const estimateReadTime = (text) => {
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / 200);
    return minutes === 1 ? '1 minute read' : `${minutes} minutes read`;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <BlogDetailSkeleton />
      </div>
    );
  }

  if (!post) return null;

  const isLiked = user && likesState.includes(user._id);
  const coverUrl = post.coverImage
    ? (post.coverImage.startsWith('http') ? post.coverImage : `http://localhost:5000${post.coverImage}`)
    : null;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Dynamic Reading Scroll Progress Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${scrollProgress}%`,
          height: '4px',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
          zIndex: 1001,
          transition: 'width 0.1s ease-out'
        }}
      />
      {/* Article Navigation Bar */}
      <div className="container" style={topNavStyle}>
        <Link to="/" style={backLinkStyle}>
          <ArrowLeft size={16} /> Back to stories
        </Link>
      </div>

      <article className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Category & Metadata */}
        <div style={metaContainerStyle}>
          <span className="badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            {post.category}
          </span>
          <div style={metaRowStyle}>
            <span style={metaItemStyle}><Calendar size={14} /> {formatDate(post.createdAt)}</span>
            <span style={metaItemStyle}><Clock size={14} /> {estimateReadTime(post.content)}</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={titleStyle}>{post.title}</h1>

        {/* Author Bio Header Card */}
        <div style={authorCardStyle}>
          {post.author?.avatar ? (
            <img
              src={`http://localhost:5000${post.author.avatar}`}
              alt={post.author.name}
              style={authorAvatarStyle}
              onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }}
            />
          ) : (
            <div style={authorAvatarFallbackStyle}>
              {post.author?.name ? post.author.name[0].toUpperCase() : 'U'}
            </div>
          )}
          <div style={{ textAlign: 'left' }}>
            <span style={authorNameStyle}>{post.author?.name || 'Deleted Writer'}</span>
            <span style={authorBioStyle}>{post.author?.bio || 'Passionate story-teller on InkSphere.'}</span>
          </div>
        </div>

        {/* Cover Image */}
        {coverUrl && (
          <div style={imageContainerStyle}>
            <img src={coverUrl} alt={post.title} style={imageStyle} />
          </div>
        )}

        {/* Article Body HTML Content */}
        <div
          style={contentBodyStyle}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
        />

        {/* Tags Section */}
        {post.tags && post.tags.length > 0 && (
          <div style={tagsContainerStyle}>
            {post.tags.map((tag, idx) => (
              <Link key={idx} to={`/?tag=${tag}`} style={tagBadgeStyle}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Post Actions: Like & Share Bar */}
        <div style={actionsBarStyle}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleLikeToggle}
              style={isLiked ? activeLikeBtnStyle : likeBtnStyle}
              disabled={liking}
              title={isLiked ? 'Unlike' : 'Like'}
              className={isPopping ? 'animate-pop' : ''}
            >
              <Heart size={18} style={{ fill: isLiked ? 'white' : 'none' }} />
              <span>{likesState.length} likes</span>
            </button>
            <button onClick={handleShare} className="btn btn-secondary" style={actionBtnStyle}>
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comment Section System */}
        <CommentSection
          postId={post._id}
          onCommentsUpdated={() => {
            // Re-fetch comments counts or sync counts locally
            setCommentsCountState(prev => prev + 1);
          }}
        />

        {/* Related posts section widget */}
        {relatedPosts.length > 0 && (
          <section style={relatedPostsSectionStyle}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'left' }}>
              Related Stories
            </h3>
            <div style={relatedGridStyle}>
              {relatedPosts.map(rel => (
                <Link key={rel._id} to={`/posts/${rel.slug || rel._id}`} className="card" style={relatedCardStyle}>
                  <h4 style={relatedTitleStyle}>{rel.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    by {rel.author?.name || 'Writer'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

// Styling components
const topNavStyle = {
  display: 'flex',
  justifyContent: 'flex-start',
  paddingTop: '2rem',
  paddingBottom: '1rem'
};

const backLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--color-primary)'
};

const metaContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  flexWrap: 'wrap',
  gap: '12px'
};

const metaRowStyle = {
  display: 'flex',
  gap: '1rem',
  fontSize: '0.85rem',
  color: 'var(--text-muted)'
};

const metaItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem'
};

const titleStyle = {
  fontSize: '2.5rem',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
  marginBottom: '1.5rem',
  textAlign: 'left',
  fontFamily: 'var(--font-heading)'
};

const authorCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem 0',
  borderTop: '1px solid var(--border-color)',
  borderBottom: '1px solid var(--border-color)',
  marginBottom: '2rem'
};

const authorAvatarStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  objectFit: 'cover'
};

const authorAvatarFallbackStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800
};

const authorNameStyle = {
  fontWeight: 700,
  fontSize: '1rem',
  display: 'block',
  color: 'var(--text-main)'
};

const authorBioStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  marginTop: '2px',
  display: 'block'
};

const imageContainerStyle = {
  width: '100%',
  maxHeight: '450px',
  overflow: 'hidden',
  borderRadius: 'var(--radius-md)',
  marginBottom: '2.5rem',
  border: '1px solid var(--border-color)'
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const contentBodyStyle = {
  fontSize: '1.1rem',
  lineHeight: 1.8,
  color: 'var(--text-main)',
  textAlign: 'left',
  marginBottom: '2.5rem'
};

const tagsContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  paddingBottom: '1.5rem',
  borderBottom: '1px solid var(--border-color)',
  marginBottom: '2rem'
};

const tagBadgeStyle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-light)',
  padding: '4px 12px',
  borderRadius: '6px',
  transition: 'transform 0.2s',
  ':hover': {
    transform: 'translateY(-1px)'
  }
};

const actionsBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0'
};

const actionBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.55rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  borderRadius: '8px'
};

const likeBtnStyle = {
  ...actionBtnStyle,
  backgroundColor: 'var(--bg-card-hover)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-main)',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const activeLikeBtnStyle = {
  ...likeBtnStyle,
  backgroundColor: 'var(--color-danger)',
  borderColor: 'var(--color-danger)',
  color: 'white',
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
};

const relatedPostsSectionStyle = {
  marginTop: '3.5rem',
  paddingTop: '2.5rem',
  borderTop: '1px solid var(--border-color)'
};

const relatedGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.25rem'
};

const relatedCardStyle = {
  padding: '1.25rem',
  textAlign: 'left',
  textDecoration: 'none',
  transition: 'all 0.2s',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-md)'
};

const relatedTitleStyle = {
  fontSize: '0.95rem',
  fontWeight: 700,
  lineHeight: 1.3,
  color: 'var(--text-main)',
  marginBottom: '0.5rem',
  transition: 'color 0.2s'
};

// CSS styles to support title highlighting
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    a.card:hover h4 {
      color: var(--color-primary);
    }
  `;
  document.head.appendChild(styleSheet);
}

export default BlogDetails;
