import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MarkdownEditor from '../components/MarkdownEditor';
import { FileText, Image, Tag, FolderOpen, Send, ArrowLeft, Eye } from 'lucide-react';

const CATEGORIES = ['Technology', 'Design', 'Lifestyle', 'Travel', 'Business', 'Health', 'General'];

const CreateEditPost = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editPostId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [imageMode, setImageMode] = useState('url'); // 'file' | 'url'
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch post details if in Edit Mode
  useEffect(() => {
    if (!editPostId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/posts/${editPostId}`);
        const data = await res.json();

        if (data.success) {
          const post = data.post;
          
          // Safety authorization lock (only owner or admin can edit)
          if (user && post.author?._id !== user._id && user.role !== 'admin') {
            addToast('Not authorized to edit this story', 'error');
            navigate('/dashboard');
            return;
          }

          setTitle(post.title);
          setContent(post.content);
          setCategory(post.category);
          setTagsInput(post.tags ? post.tags.join(', ') : '');

          if (post.coverImage) {
            if (post.coverImage.startsWith('/uploads')) {
              setImageMode('file');
              setCoverImagePreview(`http://localhost:5000${post.coverImage}`);
            } else {
              setImageMode('url');
              setCoverImageUrl(post.coverImage);
            }
          }
        } else {
          addToast('Article not found', 'error');
          navigate('/dashboard');
        }
      } catch (error) {
        addToast('Error fetching article details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [editPostId, user]);

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image size must be smaller than 5MB', 'warning');
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast('Please provide a title', 'warning');
      return;
    }
    if (!content.trim()) {
      addToast('Please write some content', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('category', category);
      formData.append('tags', tagsInput);

      if (imageMode === 'file') {
        if (coverImageFile) {
          formData.append('coverImage', coverImageFile);
        } else if (coverImagePreview && editPostId) {
          // Keep existing uploaded image
          // Mongoose controller preserves it if not overwritten
        }
      } else {
        formData.append('coverImage', coverImageUrl.trim());
      }

      const url = editPostId ? `${API_URL}/posts/${editPostId}` : `${API_URL}/posts`;
      const method = editPostId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData // multipart/form-data
      });
      const data = await res.json();

      if (data.success) {
        addToast(editPostId ? 'Article updated successfully!' : 'Article published!', 'success');
        navigate(`/posts/${data.post.slug || data.post._id}`);
      } else {
        addToast(data.message || 'Failed to submit article', 'error');
      }
    } catch (error) {
      addToast('Network error while saving article', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: '4rem 2rem' }}>
        <div className="shimmer" style={{ height: '40px', width: '200px', margin: '0 auto 1.5rem', borderRadius: '4px' }} />
        <div className="shimmer" style={{ height: '300px', width: '100%', borderRadius: '12px' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '900px' }}>
      {/* Header Navigation */}
      <div style={headerNavStyle}>
        <button onClick={() => navigate(-1)} style={backButtonStyle}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          {editPostId ? 'Edit Article' : 'Write New Article'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {/* Title */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Article Title</label>
          <div style={inputContainerStyle}>
            <FileText size={18} style={inputIconStyle} />
            <input
              type="text"
              placeholder="Enter a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
              style={titleInputStyle}
              maxLength={100}
              required
            />
          </div>
        </div>

        {/* Category & Tags Row */}
        <div style={rowGridStyle}>
          {/* Category Select */}
          <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
            <label className="form-label">Category</label>
            <div style={inputContainerStyle}>
              <FolderOpen size={18} style={inputIconStyle} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              >
                {CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags (comma separated) */}
          <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
            <label className="form-label">Tags (comma-separated)</label>
            <div style={inputContainerStyle}>
              <Tag size={18} style={inputIconStyle} />
              <input
                type="text"
                placeholder="tech, research, tutorials"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
        </div>

        {/* Cover Image Handler */}
        <div className="card" style={coverImageCardStyle}>
          <div style={imageToggleHeaderStyle}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700 }}>
              <Image size={16} /> Cover Image
            </h4>
            <div style={toggleButtonsWrapperStyle}>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                style={imageMode === 'url' ? activeToggleBtnStyle : toggleBtnStyle}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('file')}
                style={imageMode === 'file' ? activeToggleBtnStyle : toggleBtnStyle}
              >
                Upload File
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            {imageMode === 'url' ? (
              <div className="form-group">
                <input
                  type="url"
                  placeholder="Paste cover image link (e.g. https://images.unsplash.com/...)"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="form-control"
                />
                {coverImageUrl && (
                  <div style={coverPreviewContainerStyle}>
                    <img src={coverImageUrl} alt="Url cover preview" style={coverPreviewStyle} onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>
            ) : (
              <div style={fileUploadSectionStyle}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    Choose Local File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {coverImageFile ? coverImageFile.name : 'No file selected (Max 5MB)'}
                  </span>
                </div>
                {coverImagePreview && (
                  <div style={coverPreviewContainerStyle}>
                    <img src={coverImagePreview} alt="Uploaded cover preview" style={coverPreviewStyle} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content rich text split-preview editor */}
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">Article Story (Markdown Supported)</label>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>

        {/* Publish/Update Button */}
        <div style={formFooterActionsStyle}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            disabled={submitting}
          >
            <Send size={16} /> {submitting ? 'Saving Story...' : (editPostId ? 'Update Article' : 'Publish Article')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Styling structures
const headerNavStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '1rem',
  textAlign: 'left'
};

const backButtonStyle = {
  border: 'none',
  background: 'var(--bg-card-hover)',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
  color: 'var(--text-main)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const inputContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const inputIconStyle = {
  position: 'absolute',
  left: '12px',
  color: 'var(--text-muted)'
};

const titleInputStyle = {
  paddingLeft: '2.5rem',
  fontSize: '1.2rem',
  fontWeight: 700,
  fontFamily: 'var(--font-heading)'
};

const rowGridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5rem',
  marginBottom: '1.5rem'
};

const coverImageCardStyle = {
  padding: '1.25rem',
  marginBottom: '1.5rem',
  textAlign: 'left'
};

const imageToggleHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px'
};

const toggleButtonsWrapperStyle = {
  display: 'flex',
  backgroundColor: 'var(--border-color)',
  borderRadius: '20px',
  padding: '2px'
};

const toggleBtnStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  padding: '4px 14px',
  borderRadius: '18px',
  fontSize: '0.75rem',
  fontWeight: 700,
  cursor: 'pointer',
  color: 'var(--text-muted)',
  transition: 'all 0.2s'
};

const activeToggleBtnStyle = {
  ...toggleBtnStyle,
  backgroundColor: 'var(--bg-card)',
  color: 'var(--color-primary)',
  boxShadow: 'var(--shadow-sm)'
};

const coverPreviewContainerStyle = {
  marginTop: '1rem',
  width: '100%',
  maxHeight: '220px',
  overflow: 'hidden',
  borderRadius: '6px',
  border: '1px solid var(--border-color)'
};

const coverPreviewStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const fileUploadSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const formFooterActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '1.5rem'
};

export default CreateEditPost;
