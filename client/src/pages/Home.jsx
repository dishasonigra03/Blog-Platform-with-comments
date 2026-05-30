import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';
import BlogCard from '../components/BlogCard';
import { BlogGridSkeleton } from '../components/LoadingSkeleton';
import { Search, ChevronLeft, ChevronRight, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';

const CATEGORIES = ['All', 'Technology', 'Design', 'Lifestyle', 'Travel', 'Business', 'Health', 'General'];

const Typewriter = ({ words }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setBlink((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorTimer);
  }, []);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 100);

    return () => clearTimeout(timeout);
  }, [subIndex, reverse, index, words]);

  return (
    <span>
      {words[index].substring(0, subIndex)}
      <span className="blink-cursor" style={{ opacity: blink ? 1 : 0, transition: 'opacity 0.1s' }}></span>
    </span>
  );
};

const Home = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search & Filter state synced with URLs
  const searchQ = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || 'All';
  const tagFilter = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'latest';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(searchQ);
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(0);

  // Sync search input with query changes
  useEffect(() => {
    setSearchInput(searchQ);
  }, [searchQ]);

  const socket = useSocket();

  // Listen for real-time post creation
  useEffect(() => {
    if (!socket) return;

    socket.on('post_created', (data) => {
      addToast(`New article posted: "${data.post.title}"!`, 'success');
      
      // Auto prepend the post if the user is on page 1 and no search/tag filter is active
      if (currentPage === 1 && !searchQ && categoryFilter === 'All' && !tagFilter) {
        setPosts(prev => {
          if (prev.some(p => p._id === data.post._id)) return prev;
          const newPosts = [data.post, ...prev];
          if (newPosts.length > 6) {
            newPosts.pop();
          }
          return newPosts;
        });
        setTotalPostsCount(prev => prev + 1);
      }
    });

    return () => {
      socket.off('post_created');
    };
  }, [socket, currentPage, searchQ, categoryFilter, tagFilter, addToast]);

  // Debounce search input to filter posts in real-time
  useEffect(() => {
    if (searchInput.trim() === searchQ.trim()) return;

    const delayDebounceFn = setTimeout(() => {
      setSearchParams(prev => {
        if (searchInput.trim()) {
          prev.set('q', searchInput.trim());
        } else {
          prev.delete('q');
        }
        prev.set('page', '1');
        return prev;
      });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, searchQ, setSearchParams]);

  // Fetch posts when dependencies change
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Build query string
        const params = new URLSearchParams();
        if (searchQ) params.append('q', searchQ);
        if (categoryFilter && categoryFilter !== 'All') params.append('category', categoryFilter);
        if (tagFilter) params.append('tag', tagFilter);
        params.append('sort', currentSort);
        params.append('page', currentPage.toString());
        params.append('limit', '6');

        const res = await fetch(`${API_URL}/posts?${params.toString()}`);
        const data = await res.json();
        
        if (data.success) {
          setPosts(data.posts);
          setTotalPages(data.pages);
          setTotalPostsCount(data.total);
        } else {
          addToast(data.message || 'Failed to load posts', 'error');
        }
      } catch (error) {
        addToast('Network error while loading posts', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchQ, categoryFilter, tagFilter, currentSort, currentPage]);

  // Fetch trending posts on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        const res = await fetch(`${API_URL}/posts/trending`);
        const data = await res.json();
        if (data.success) {
          setTrendingPosts(data.posts);
        }
      } catch (error) {
        console.error('Error fetching trending posts:', error);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchInput.trim()) {
        prev.set('q', searchInput.trim());
      } else {
        prev.delete('q');
      }
      prev.set('page', '1'); // reset page to 1 on search
      return prev;
    });
  };

  const selectCategory = (category) => {
    setSearchParams(prev => {
      if (category && category !== 'All') {
        prev.set('category', category);
      } else {
        prev.delete('category');
      }
      prev.set('page', '1'); // reset page
      return prev;
    });
  };

  const selectSort = (sortOption) => {
    setSearchParams(prev => {
      prev.set('sort', sortOption);
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 380, behavior: 'smooth' }); // Scroll to top of posts container
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Banner Section */}
      <section className="glass-panel" style={heroSectionStyle}>
        <div className="container" style={heroContainerStyle}>
          <div style={heroBadgeStyle}>
            <Sparkles size={14} /> Writing the future, one word at a time.
          </div>
          <h1 style={heroHeadingStyle}>Welcome to <Typewriter words={['InkSphere', 'New Perspectives', 'Creative Insights', 'Storytelling']} /></h1>
          <p style={heroSubheadingStyle}>
            Discover deep insights, thought-provoking stories, and expert viewpoints shared by a passionate community of creators.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={searchFormStyle}>
            <Search size={20} style={searchIconStyle} />
            <input
              type="text"
              placeholder="Search articles by title, tag, or author..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={searchInputStyle}
            />
            <button type="submit" className="btn btn-primary" style={searchBtnStyle}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container" style={mainLayoutGridStyle}>
        {/* Left Side: Filter & Posts List */}
        <main style={postsColumnStyle}>
          {/* Categories Horizontal Scroller */}
          <div style={categoriesRowStyle}>
            {CATEGORIES.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => selectCategory(cat)}
                className={`category-btn ${categoryFilter === cat ? 'active' : ''}`}
                style={categoryFilter === cat ? activeCategoryBtnStyle : categoryBtnStyle}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filtering Metadata Summary & Sorters */}
          <div style={filterSummaryRowStyle}>
            <div style={totalCountStyle}>
              {loading ? (
                'Loading posts...'
              ) : (
                <>
                  Showing <strong>{posts.length}</strong> of <strong>{totalPostsCount}</strong> posts
                  {(searchQ || categoryFilter !== 'All' || tagFilter) && (
                    <button onClick={clearFilters} style={clearFilterLinkStyle}>
                      (Clear filters)
                    </button>
                  )}
                </>
              )}
            </div>

            <div style={sortSelectorWrapperStyle}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                value={currentSort}
                onChange={(e) => selectSort(e.target.value)}
                style={sortSelectStyle}
              >
                <option value="latest">Latest Posts</option>
                <option value="popular">Popular (Most Discussed)</option>
                <option value="oldest">Oldest Posts</option>
              </select>
            </div>
          </div>

          {/* Tag Filter Banner */}
          {tagFilter && (
            <div className="glass-panel" style={tagFilterBannerStyle}>
              Filtering by tag: <strong>#{tagFilter}</strong>
              <button onClick={() => setSearchParams(prev => { prev.delete('tag'); return prev; })} style={clearTagBtnStyle}>
                Remove tag
              </button>
            </div>
          )}

          {/* Posts Grid */}
          {loading ? (
            <BlogGridSkeleton count={6} />
          ) : posts.length === 0 ? (
            <div className="card text-center" style={emptyStateStyle}>
              <h3>No Articles Found</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                We couldn't find any posts matching your criteria. Try adjusting your search query or filters.
              </p>
              <button onClick={clearFilters} className="btn btn-primary">
                Explore All Posts
              </button>
            </div>
          ) : (
            <>
              <div style={postsGridStyle}>
                {posts.map((post, idx) => (
                  <BlogCard key={post._id} post={post} index={idx} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={paginationStyle}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={pageBtnStyle}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  
                  <span style={pageIndicatorStyle}>
                    Page <strong>{currentPage}</strong> of {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={pageBtnStyle}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Side: Trending & Sidebar Widgets */}
        <aside style={sidebarColumnStyle}>
          {/* Trending posts widget */}
          <div className="glass-panel" style={sidebarWidgetStyle}>
            <h3 style={widgetTitleStyle}>
              <TrendingUp size={18} style={{ color: 'var(--color-secondary)' }} /> Trending Articles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {trendingLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div className="shimmer" style={{ height: '14px', width: '80%', borderRadius: '4px' }} />
                    <div className="shimmer" style={{ height: '10px', width: '40%', borderRadius: '4px' }} />
                  </div>
                ))
              ) : trendingPosts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No trending posts yet.</p>
              ) : (
                trendingPosts.map((post, idx) => (
                  <div key={post._id} style={trendingItemStyle}>
                    <div style={trendingNumberStyle}>0{idx + 1}</div>
                    <div>
                      <Link to={`/posts/${post.slug || post._id}`} style={trendingItemTitleStyle}>
                        {post.title}
                      </Link>
                      <div style={trendingMetaStyle}>
                        by {post.author ? post.author.name : 'Author'} in {post.category}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Newsletter Box */}
          <div className="card" style={{ ...sidebarWidgetStyle, background: 'linear-gradient(135deg, var(--bg-card), var(--color-primary-light))' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>Newsletter Signup</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Get weekly updates with curated stories, features, and platform activities straight to your inbox.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); addToast('Thank you for subscribing!', 'success'); }} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="email" required placeholder="name@email.com" className="form-control" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Join</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};

// Styling structures
const heroSectionStyle = {
  background: 'linear-gradient(135deg, rgba(var(--color-primary-hsl), 0.05), rgba(var(--color-secondary-hsl), 0.05))',
  border: 'none',
  borderRadius: 0,
  borderBottom: '1px solid var(--border-color)',
  padding: '4rem 0',
  textAlign: 'center',
  marginBottom: '2rem'
};

const heroContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '800px'
};

const heroBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-light)',
  padding: '6px 14px',
  borderRadius: '20px',
  marginBottom: '1.25rem'
};

const heroHeadingStyle = {
  fontSize: '3rem',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  marginBottom: '1rem',
  fontFamily: 'var(--font-heading)'
};

const heroSubheadingStyle = {
  fontSize: '1.15rem',
  color: 'var(--text-muted)',
  lineHeight: 1.6,
  marginBottom: '2rem',
  maxWidth: '620px'
};

const searchFormStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '600px',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 'var(--radius-xl)',
  backgroundColor: 'var(--bg-card)',
  border: '1.5px solid var(--border-color)',
  padding: '6px',
  boxShadow: 'var(--shadow-md)',
  transition: 'border-color var(--transition-fast)'
};

const searchIconStyle = {
  position: 'absolute',
  left: '16px',
  color: 'var(--text-muted)'
};

const searchInputStyle = {
  border: 'none',
  background: 'transparent',
  width: '100%',
  padding: '10px 10px 10px 44px',
  outline: 'none',
  fontSize: '0.95rem',
  color: 'var(--text-main)'
};

const searchBtnStyle = {
  borderRadius: 'calc(var(--radius-xl) - 4px)',
  padding: '10px 24px',
  fontSize: '0.9rem'
};

const mainLayoutGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '2.5rem',
  marginTop: '1rem'
};

const postsColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const categoriesRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  overflowX: 'auto',
  paddingBottom: '0.5rem',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch'
};

const categoryBtnStyle = {
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-muted)',
  padding: '0.5rem 1.1rem',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all var(--transition-fast)'
};

const activeCategoryBtnStyle = {
  ...categoryBtnStyle,
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  borderColor: 'var(--color-primary)'
};

const filterSummaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '0.5rem',
  flexWrap: 'wrap',
  gap: '12px'
};

const totalCountStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)'
};

const clearFilterLinkStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  marginLeft: '6px',
  fontSize: '0.85rem',
  fontWeight: 600
};

const sortSelectorWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const sortSelectStyle = {
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  padding: '0.4rem 0.8rem',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none'
};

const tagFilterBannerStyle = {
  padding: '10px 16px',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.9rem'
};

const clearTagBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-danger)',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.8rem'
};

const postsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '2rem'
};

const emptyStateStyle = {
  padding: '4rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const paginationStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '1.5rem',
  marginTop: '3rem'
};

const pageIndicatorStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)'
};

const pageBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.5rem 1rem'
};

const sidebarColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem'
};

const sidebarWidgetStyle = {
  padding: '1.5rem',
  borderRadius: 'var(--radius-md)',
  textAlign: 'left'
};

const widgetTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '1.15rem',
  fontWeight: 700,
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.75rem'
};

const trendingItemStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
  paddingBottom: '0.8rem',
  borderBottom: '1px solid var(--border-color)',
  ':last-child': {
    borderBottom: 'none',
    paddingBottom: 0
  }
};

const trendingNumberStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: 'var(--color-primary-light)',
  fontFamily: 'var(--font-heading)',
  lineHeight: 1
};

const trendingItemTitleStyle = {
  fontWeight: 700,
  fontSize: '0.95rem',
  color: 'var(--text-main)',
  lineHeight: 1.3,
  display: 'block',
  transition: 'color var(--transition-fast)',
  ':hover': {
    color: 'var(--color-primary)'
  }
};

const trendingMetaStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '4px'
};

// Add responsive layout styles tags
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @media (min-width: 992px) {
      .container {
        display: grid !important;
        grid-template-columns: 1fr 300px !important;
        align-items: start !important;
      }
      .container > main { grid-column: 1 / 2; }
      .container > aside { grid-column: 2 / 3; display: flex !important; }
      nav > div.container, section > div.container { display: flex !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Home;
