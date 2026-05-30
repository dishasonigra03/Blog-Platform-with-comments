import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageSquare, Edit2, Trash2, Reply, Send, X, CornerDownRight, Check, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const CommentSection = ({ postId, onCommentsUpdated }) => {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null); // ID of comment being replied to
  const [replyText, setReplyText] = useState('');
  const [activeEditId, setActiveEditId] = useState(null); // ID of comment being edited
  const [editText, setEditText] = useState('');

  const socket = useSocket();

  // Listen for real-time comment actions (add, edit, delete)
  useEffect(() => {
    if (!socket || !postId) return;

    // 1. Comment Added Event
    socket.on('comment_added', (data) => {
      setComments(prev => {
        const findComment = (list, id) => {
          for (let c of list) {
            if (c._id === id) return true;
            if (c.replies && findComment(c.replies, id)) return true;
          }
          return false;
        };

        if (findComment(prev, data.comment._id)) return prev;

        // Top level comment
        if (!data.comment.parentComment) {
          return [...prev, { ...data.comment, replies: [] }];
        }

        // Nested reply comment
        const injectReply = (list) => {
          return list.map(c => {
            if (c._id === data.comment.parentComment) {
              if (c.replies.some(r => r._id === data.comment._id)) return c;
              return { ...c, replies: [...c.replies, { ...data.comment, replies: [] }] };
            } else if (c.replies && c.replies.length > 0) {
              return { ...c, replies: injectReply(c.replies) };
            }
            return c;
          });
        };

        return injectReply(prev);
      });

      if (onCommentsUpdated) onCommentsUpdated();
    });

    // 2. Comment Edited Event
    socket.on('comment_edited', (data) => {
      const updateText = (list) => {
        return list.map(c => {
          if (c._id === data.comment._id) {
            return { ...c, comment: data.comment.comment };
          } else if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateText(c.replies) };
          }
          return c;
        });
      };
      setComments(prev => updateText(prev));
    });

    // 3. Comment Deleted Event
    socket.on('comment_deleted', (data) => {
      if (data.postId === postId) {
        const removeComment = (list) => {
          return list
            .filter(c => c._id !== data.commentId)
            .map(c => {
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: removeComment(c.replies) };
              }
              return c;
            });
        };
        setComments(prev => removeComment(prev));
        if (onCommentsUpdated) onCommentsUpdated();
      }
    });

    return () => {
      socket.off('comment_added');
      socket.off('comment_edited');
      socket.off('comment_deleted');
    };
  }, [socket, postId, onCommentsUpdated]);

  // Fetch comments on mount or post change
  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/comments/post/${postId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Submit a top-level comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please login to post a comment', 'warning');
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          comment: newCommentText.trim()
        })
      });
      const data = await res.json();

      if (data.success) {
        setNewCommentText('');
        addToast('Comment posted successfully', 'success');
        
        // Update local comments state immediately
        setComments(prev => [...prev, { ...data.comment, replies: [] }]);
        if (onCommentsUpdated) onCommentsUpdated(); // update count in details page
      } else {
        addToast(data.message || 'Failed to post comment', 'error');
      }
    } catch (error) {
      addToast('Network error while posting comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit a nested reply
  const handleAddReply = async (parentCommentId) => {
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          comment: replyText.trim(),
          parentComment: parentCommentId
        })
      });
      const data = await res.json();

      if (data.success) {
        setReplyText('');
        setActiveReplyId(null);
        addToast('Reply posted successfully', 'success');
        
        // Re-inject the reply locally to the parent
        const injectReply = (commentsList) => {
          return commentsList.map(c => {
            if (c._id === parentCommentId) {
              return { ...c, replies: [...c.replies, { ...data.comment, replies: [] }] };
            } else if (c.replies && c.replies.length > 0) {
              return { ...c, replies: injectReply(c.replies) };
            }
            return c;
          });
        };
        setComments(prev => injectReply(prev));
        if (onCommentsUpdated) onCommentsUpdated();
      } else {
        addToast(data.message || 'Failed to post reply', 'error');
      }
    } catch (error) {
      addToast('Network error while posting reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Update a comment
  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: editText.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setActiveEditId(null);
        addToast('Comment updated', 'success');

        // Update local text
        const updateText = (commentsList) => {
          return commentsList.map(c => {
            if (c._id === commentId) {
              return { ...c, comment: data.comment.comment };
            } else if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateText(c.replies) };
            }
            return c;
          });
        };
        setComments(prev => updateText(prev));
      } else {
        addToast(data.message || 'Failed to edit comment', 'error');
      }
    } catch (error) {
      addToast('Network error while editing comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment? All replies will also be deleted.')) return;

    try {
      const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        addToast('Comment deleted', 'success');

        // Remove from local comments state
        const removeComment = (commentsList) => {
          return commentsList
            .filter(c => c._id !== commentId)
            .map(c => {
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: removeComment(c.replies) };
              }
              return c;
            });
        };
        setComments(prev => removeComment(prev));
        if (onCommentsUpdated) onCommentsUpdated();
      } else {
        addToast(data.message || 'Failed to delete comment', 'error');
      }
    } catch (error) {
      addToast('Network error while deleting comment', 'error');
    }
  };

  // Chronological Date Formatter
  const formatCommentDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Recursive Comment Card Renderer
  const CommentCard = ({ commentItem, depth = 0 }) => {
    const isOwner = user && user._id === commentItem.userId?._id;
    const isAdmin = user && user.role === 'admin';
    const hasReplies = commentItem.replies && commentItem.replies.length > 0;
    
    // limit recursive margin depth to avoid running off screen on mobile
    const marginIndent = depth > 0 ? (depth > 2 ? '10px' : '24px') : '0px';

    return (
      <div style={{ marginLeft: marginIndent, marginTop: '1.25rem' }}>
        <div className="glass-panel animate-fade-in" style={commentCardStyle}>
          {/* Header */}
          <div style={cardHeaderStyle}>
            <div style={avatarWrapperStyle}>
              {commentItem.userId?.avatar ? (
                <img
                  src={`http://localhost:5000${commentItem.userId.avatar}`}
                  alt={commentItem.userId.name}
                  style={commentAvatarStyle}
                  onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                />
              ) : (
                <div style={commentAvatarFallbackStyle}>
                  {commentItem.userId?.name ? commentItem.userId.name[0].toUpperCase() : '?'}
                </div>
              )}
              <div>
                <span style={commentAuthorStyle}>
                  {commentItem.userId ? commentItem.userId.name : '[Deleted User]'}
                </span>
                {commentItem.userId?.role === 'admin' && (
                  <span className="badge" style={adminBadgeStyle}>Staff</span>
                )}
                <span style={commentDateStyle}>{formatCommentDate(commentItem.createdAt)}</span>
              </div>
            </div>

            {/* Actions Menu */}
            <div style={actionsGroupStyle}>
              {user && (
                <button
                  onClick={() => {
                    setActiveReplyId(activeReplyId === commentItem._id ? null : commentItem._id);
                    setReplyText('');
                    setActiveEditId(null);
                  }}
                  style={actionBtnStyle}
                  title="Reply"
                >
                  <Reply size={14} /> <span className="action-label">Reply</span>
                </button>
              )}

              {isOwner && (
                <button
                  onClick={() => {
                    setActiveEditId(activeEditId === commentItem._id ? null : commentItem._id);
                    setEditText(commentItem.comment);
                    setActiveReplyId(null);
                  }}
                  style={actionBtnStyle}
                  title="Edit"
                >
                  <Edit2 size={14} /> <span className="action-label">Edit</span>
                </button>
              )}

              {(isOwner || isAdmin) && (
                <button
                  onClick={() => handleDeleteComment(commentItem._id)}
                  style={{ ...actionBtnStyle, color: 'var(--color-danger)' }}
                  title="Delete"
                >
                  <Trash2 size={14} /> <span className="action-label">Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Comment Body */}
          <div style={{ marginTop: '0.75rem', paddingLeft: '0.25rem' }}>
            {activeEditId === commentItem._id ? (
              <div style={editorFormStyle}>
                <textarea
                  className="form-control"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setActiveEditId(null)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditComment(commentItem._id)}
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    disabled={submitting}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p style={commentBodyStyle}>{commentItem.comment}</p>
            )}
          </div>
        </div>

        {/* Nested Reply Form */}
        {activeReplyId === commentItem._id && (
          <div style={replyFormWrapperStyle}>
            <CornerDownRight size={16} style={{ color: 'var(--text-muted)', marginTop: '8px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <textarea
                  className="form-control"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Replying to ${commentItem.userId?.name || 'user'}...`}
                  style={{ minHeight: '60px', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                <button
                  onClick={() => setActiveReplyId(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddReply(commentItem._id)}
                  className="btn btn-primary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  disabled={submitting || !replyText.trim()}
                >
                  <Send size={10} /> Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nested replies list */}
        {hasReplies && (
          <div style={nestedRepliesWrapperStyle}>
            {commentItem.replies.map(reply => (
              <CommentCard key={reply._id} commentItem={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={wrapperStyle}>
      <h3 style={sectionHeadingStyle}>
        <MessageSquare size={20} /> Discussion ({comments.length > 0 ? comments.length : 0})
      </h3>

      {/* Main Comment Form */}
      {user ? (
        <form onSubmit={handleAddComment} style={formStyle}>
          <div style={formInputWrapperStyle}>
            {user.avatar ? (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt={user.name}
                style={formAvatarStyle}
                onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/?d=mp'; }}
              />
            ) : (
              <div style={formAvatarFallbackStyle}>{user.name[0].toUpperCase()}</div>
            )}
            <div style={{ flex: 1 }}>
              <textarea
                className="form-control"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Share your thoughts, raise questions, or give feedback..."
                style={mainTextareaStyle}
                rows={3}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !newCommentText.trim()}
            >
              <Send size={14} /> Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="card text-center" style={loginBannerStyle}>
          <AlertCircle size={24} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>You must be logged in to participate in the discussion.</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <a href="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Log In</a>
            <a href="/register" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Sign Up</a>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center" style={{ padding: '2rem' }}>
          <div className="shimmer" style={{ height: '80px', borderRadius: '8px', marginBottom: '1rem' }} />
          <div className="shimmer" style={{ height: '80px', borderRadius: '8px' }} />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center" style={noCommentsStyle}>
          <p>No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {comments.map(comment => (
            <CommentCard key={comment._id} commentItem={comment} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
};

// Styling components
const wrapperStyle = {
  marginTop: '3rem',
  paddingTop: '2rem',
  borderTop: '1px solid var(--border-color)',
  textAlign: 'left'
};

const sectionHeadingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '1.4rem',
  fontWeight: 700,
  marginBottom: '1.5rem'
};

const formStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '1.25rem',
  marginBottom: '2rem',
  boxShadow: 'var(--shadow-sm)'
};

const formInputWrapperStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start'
};

const formAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '1.5px solid var(--border-color)'
};

const formAvatarFallbackStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700
};

const mainTextareaStyle = {
  minHeight: '80px',
  width: '100%'
};

const loginBannerStyle = {
  padding: '1.5rem',
  backgroundColor: 'var(--bg-card-hover)',
  borderRadius: 'var(--radius-md)',
  marginBottom: '2rem',
  border: '1px dashed var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const noCommentsStyle = {
  padding: '3rem 1.5rem',
  color: 'var(--text-muted)',
  backgroundColor: 'var(--bg-card-hover)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  fontStyle: 'italic',
  marginTop: '1rem'
};

const commentCardStyle = {
  padding: '1rem 1.25rem',
  borderRadius: 'var(--radius-md)',
  transition: 'border-color 0.2s',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)'
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '8px'
};

const avatarWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const commentAvatarStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  objectFit: 'cover'
};

const commentAvatarFallbackStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'var(--border-color)',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.9rem'
};

const commentAuthorStyle = {
  fontWeight: 700,
  fontSize: '0.95rem',
  color: 'var(--text-main)'
};

const adminBadgeStyle = {
  fontSize: '0.65rem',
  marginLeft: '6px',
  padding: '2px 6px',
  verticalAlign: 'middle'
};

const commentDateStyle = {
  display: 'block',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '2px'
};

const actionsGroupStyle = {
  display: 'flex',
  gap: '0.5rem'
};

const actionBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  padding: '4px 8px',
  borderRadius: '4px',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: 'var(--border-color)',
    color: 'var(--text-main)'
  }
};

const commentBodyStyle = {
  fontSize: '0.95rem',
  lineHeight: 1.5,
  color: 'var(--text-main)',
  whiteSpace: 'pre-wrap'
};

const editorFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  marginTop: '0.5rem'
};

const replyFormWrapperStyle = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '0.75rem',
  marginLeft: '24px',
  padding: '1rem',
  backgroundColor: 'var(--bg-card-hover)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)'
};

const nestedRepliesWrapperStyle = {
  borderLeft: '1px dashed var(--border-color)',
  paddingLeft: '0.25rem',
  marginLeft: '12px'
};

// CSS tags injection for label hiding and hover styling
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .action-label { display: none; }
    @media (min-width: 576px) {
      .action-label { display: inline; }
    }
    nav button:hover, div button:hover {
      background-color: var(--border-color);
    }
  `;
  document.head.appendChild(styleSheet);
}

export default CommentSection;
