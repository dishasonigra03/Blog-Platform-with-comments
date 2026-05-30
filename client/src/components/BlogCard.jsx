import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Clock, User, ArrowRight } from 'lucide-react';

const BlogCard = ({ post, index = 0 }) => {
  const {
    _id,
    title,
    slug,
    content,
    coverImage,
    tags,
    category,
    author,
    likes,
    commentsCount,
    createdAt
  } = post;

  // Format creation date
  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Estimate read time (assuming 200 words per minute reading speed)
  const estimateReadTime = (text) => {
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / 200);
    return minutes === 1 ? '1 min read' : `${minutes} mins read`;
  };

  // Clean Markdown headers/stars/links for a plain text excerpt
  const getExcerpt = (mdText, length = 120) => {
    if (!mdText) return '';
    const cleanText = mdText
      .replace(/[#*`_\[\]()\-]/g, '') // strip markdown symbols
      .replace(/\s+/g, ' ')
      .trim();
    return cleanText.length > length ? cleanText.substring(0, length) + '...' : cleanText;
  };

  const coverUrl = coverImage
    ? (coverImage.startsWith('http') ? coverImage : `http://localhost:5000${coverImage}`)
    : null;

  return (
    <article
      className="card animate-fade-in"
      style={{
        ...cardWrapperStyle,
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'both'
      }}
    >
      {/* Cover Image or Fallback Gradient */}
      <Link to={`/posts/${slug || _id}`} style={imageContainerStyle}>
        {coverUrl ? (
          <img src={coverUrl} alt={title} style={imageStyle} onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={fallbackGradientStyle}>
            <span style={fallbackIconStyle}>✍️</span>
          </div>
        )}
        <div style={categoryBadgeStyle}>{category}</div>
      </Link>

      <div style={contentBodyStyle}>
        {/* Date and Read Time */}
        <div style={metaRowStyle}>
          <span style={metaItemStyle}>
            <Clock size={14} /> {estimateReadTime(content)}
          </span>
          <span style={metaItemStyle}>{formatDate(createdAt)}</span>
        </div>

        {/* Post Title */}
        <h3 style={titleStyle}>
          <Link to={`/posts/${slug || _id}`} style={titleLinkStyle}>
            {title}
          </Link>
        </h3>

        {/* Plain Excerpt */}
        <p style={excerptStyle}>{getExcerpt(content)}</p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div style={tagsContainerStyle}>
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} style={tagStyle}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Author and Stats */}
        <div style={cardFooterStyle}>
          <div style={authorWrapperStyle}>
            {author && author.avatar ? (
              <img src={`http://localhost:5000${author.avatar}`} alt={author.name} style={authorAvatarStyle} onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }} />
            ) : (
              <div style={authorAvatarFallbackStyle}>
                <User size={14} />
              </div>
            )}
            <span style={authorNameStyle}>{author ? author.name : 'Unknown'}</span>
          </div>

          <div style={statsWrapperStyle}>
            <span style={statStyle}>
              <Heart size={14} style={{ fill: 'none' }} /> {likes ? likes.length : 0}
            </span>
            <span style={statStyle}>
              <MessageSquare size={14} /> {commentsCount || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

// Layout style objects
const cardWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: 0,
  overflow: 'hidden'
};

const imageContainerStyle = {
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '200px',
  overflow: 'hidden',
  background: 'var(--border-color)'
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform var(--transition-normal)'
};

const fallbackGradientStyle = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.85
};

const fallbackIconStyle = {
  fontSize: '3rem',
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
};

const categoryBadgeStyle = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  backgroundColor: 'var(--bg-card)',
  color: 'var(--color-primary)',
  fontWeight: 700,
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  padding: '4px 10px',
  borderRadius: '20px',
  boxShadow: 'var(--shadow-sm)',
  letterSpacing: '0.05em'
};

const contentBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.25rem',
  flex: 1
};

const metaRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  marginBottom: '0.5rem'
};

const metaItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
};

const titleStyle = {
  fontSize: '1.2rem',
  fontWeight: 700,
  marginBottom: '0.6rem',
  lineHeight: 1.4
};

const titleLinkStyle = {
  color: 'var(--text-main)',
  transition: 'color var(--transition-fast)'
};

const excerptStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
  marginBottom: '1rem',
  lineHeight: 1.5,
  flex: 1
};

const tagsContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  marginBottom: '1.25rem'
};

const tagStyle = {
  fontSize: '0.75rem',
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-light)',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 500
};

const cardFooterStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '0.8rem',
  borderTop: '1px solid var(--border-color)',
  marginTop: 'auto'
};

const authorWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const authorAvatarStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  objectFit: 'cover'
};

const authorAvatarFallbackStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'var(--border-color)',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const authorNameStyle = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-main)'
};

const statsWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  color: 'var(--text-muted)',
  fontSize: '0.8rem'
};

const statStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
};

// CSS styles to support image hover scaling effect
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    article.card:hover img {
      transform: scale(1.05);
    }
    article.card:hover h3 a {
      color: var(--color-primary);
    }
  `;
  document.head.appendChild(styleSheet);
}

export default BlogCard;
