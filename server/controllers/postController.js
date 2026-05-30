const supabase = require('../config/supabase');

// Helper to map Supabase post schema to frontend format
const mapPost = (p) => {
  if (!p) return null;
  return {
    _id: p.id,
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    coverImage: p.cover_image,
    tags: p.tags || [],
    category: p.category,
    likes: p.likes || [],
    commentsCount: p.comments_count || 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    author: p.author ? {
      _id: p.author.id,
      id: p.author.id,
      name: p.author.name,
      avatar: p.author.avatar,
      bio: p.author.bio,
      role: p.author.role
    } : null
  };
};

// Helper function to slugify titles
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '') 
    + '-' + Math.random().toString(36).substring(2, 6);
};

// @desc    Get all posts (with search, filter, sorting, pagination)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    const { q, tag, category, author, sort, page = 1, limit = 6 } = req.query;

    let query = supabase
      .from('posts')
      .select('*, author:users(id, name, avatar, bio, role)', { count: 'exact' });

    // 1. Filter by category
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // 2. Filter by tag
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // 3. Filter by Author ID
    if (author) {
      query = query.eq('author_id', author);
    }

    // 4. Search text (Title, tags, or author name)
    if (q) {
      // Find matching authors first
      const { data: matchingAuthors } = await supabase
        .from('users')
        .select('id')
        .ilike('name', `%${q}%`);
      
      const authorIds = matchingAuthors ? matchingAuthors.map(u => u.id) : [];

      if (authorIds.length > 0) {
        query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%,author_id.in.(${authorIds.join(',')})`);
      } else {
        query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%`);
      }
    }

    // Sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'popular') {
      // Sort by comments_count descending, then created_at
      query = query.order('comments_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      // Default: latest
      query = query.order('created_at', { ascending: false });
    }

    // Pagination calculations
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data: posts, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      total: count,
      pages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      posts: posts ? posts.map(mapPost) : []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
exports.getTrendingPosts = async (req, res) => {
  try {
    // Get all posts to calculate engagement score in memory
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, author:users(id, name, avatar)')
      .limit(30); // Grab top 30 active posts to filter

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Sort in memory by likes array length + comment counts
    const postsData = posts || [];
    const trending = postsData
      .map(post => ({
        ...post,
        score: (post.likes ? post.likes.length : 0) * 2 + (post.comments_count || 0) * 3
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    res.status(200).json({
      success: true,
      posts: trending.map(mapPost)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get post by ID or Slug
// @route   GET /api/posts/:idOrSlug
// @access  Public
exports.getPost = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let query = supabase.from('posts').select('*, author:users(id, name, avatar, bio, role)');

    // Verify if UUID format (ObjectId format is different, but UUID is 36 chars with hyphens)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data: post, error } = await query.maybeSingle();

    if (error || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, post: mapPost(post) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    let coverImage = '';
    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
    } else if (req.body.coverImage) {
      coverImage = req.body.coverImage;
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = Array.isArray(tags)
        ? tags
        : tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    }

    const generatedSlug = slugify(title);

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        slug: generatedSlug,
        content,
        category: category || 'General',
        tags: parsedTags,
        cover_image: coverImage,
        author_id: req.user.id
      })
      .select('*, author:users(id, name, avatar, bio, role)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const mappedPost = mapPost(post);
    const io = req.app.get('socketio');
    if (io) {
      io.emit('post_created', { post: mappedPost });
    }

    res.status(201).json({ success: true, post: mappedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // Fetch existing post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id, title')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Verify ownership
    if (post.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    const updates = {};
    if (req.body.title) {
      updates.title = req.body.title;
      // Re-generate slug if title changes
      if (req.body.title !== post.title) {
        updates.slug = slugify(req.body.title);
      }
    }
    if (req.body.content) updates.content = req.body.content;
    if (req.body.category) updates.category = req.body.category;

    if (req.body.tags) {
      updates.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    }

    if (req.file) {
      updates.cover_image = `/uploads/${req.file.filename}`;
    } else if (req.body.coverImage !== undefined) {
      updates.cover_image = req.body.coverImage;
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select('*, author:users(id, name, avatar, bio, role)')
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    res.status(200).json({ success: true, post: mapPost(updatedPost) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // Fetch existing post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Verify ownership
    if (post.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    // Delete post. Cascading deletes on PostgreSQL will automatically wipe comments!
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      return res.status(400).json({ success: false, message: deleteError.message });
    }

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Like on a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let likes = post.likes || [];
    const userId = req.user.id;

    const hasLiked = likes.includes(userId);
    if (hasLiked) {
      // Unlike
      likes = likes.filter(id => id !== userId);
    } else {
      // Like
      likes.push(userId);
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ likes })
      .eq('id', postId)
      .select('likes')
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.to(postId).emit('post_liked', { postId, likes: updatedPost.likes });
    }

    res.status(200).json({
      success: true,
      likes: updatedPost.likes,
      likesCount: updatedPost.likes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get related posts
// @route   GET /api/posts/:id/related
// @access  Public
exports.getRelatedPosts = async (req, res) => {
  try {
    const postId = req.params.id;

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('category, tags')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Fetch posts in same category, excluding current post
    const { data: related, error: relatedError } = await supabase
      .from('posts')
      .select('*, author:users(id, name, avatar)')
      .eq('category', post.category)
      .neq('id', postId)
      .limit(3);

    if (relatedError) {
      return res.status(400).json({ success: false, message: relatedError.message });
    }

    res.status(200).json({ success: true, posts: related ? related.map(mapPost) : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
