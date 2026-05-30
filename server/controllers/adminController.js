const supabase = require('../config/supabase');

// Helper to map user fields
const mapUser = (u) => {
  if (!u) return null;
  return {
    _id: u.id,
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    bio: u.bio,
    role: u.role,
    createdAt: u.created_at,
    updatedAt: u.updated_at
  };
};

// @desc    Get dashboard analytics (metrics + recent activities)
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    // 1. Get counts
    const { count: totalUsers, error: errU } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { count: totalPosts, error: errP } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true });

    const { count: totalComments, error: errC } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true });

    // 2. Sum likes from all posts
    const { data: posts } = await supabase
      .from('posts')
      .select('likes');

    const totalLikes = posts
      ? posts.reduce((sum, post) => sum + (post.likes ? post.likes.length : 0), 0)
      : 0;

    // 3. Get recent users
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, name, email, avatar, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Get recent posts
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, title, category, created_at, author:users(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalLikes,
        recentUsers: recentUsers ? recentUsers.map(u => ({
          _id: u.id,
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          createdAt: u.created_at
        })) : [],
        recentPosts: recentPosts ? recentPosts.map(p => ({
          _id: p.id,
          id: p.id,
          title: p.title,
          category: p.category,
          createdAt: p.created_at,
          author: { name: p.author ? p.author.name : 'Unknown' }
        })) : []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data: users, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      total: count,
      pages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      users: users.map(mapUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role (e.g. user to admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid role (user/admin)' });
    }

    // Safety lock
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own admin role' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: mapUser(updatedUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user (and clean up their posts and comments)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Safety lock
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    // Verify user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find all post IDs this user commented on to sync counts later
    const { data: userComments } = await supabase
      .from('comments')
      .select('post_id')
      .eq('user_id', userId);

    const affectedPostIds = userComments
      ? [...new Set(userComments.map(c => c.post_id))]
      : [];

    // Delete user from Supabase.
    // PostgreSQL CASCADE deletes all posts they wrote and comments they made!
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      return res.status(400).json({ success: false, message: deleteError.message });
    }

    // Sync comments_count for posts the deleted user had commented on
    for (const postId of affectedPostIds) {
      const { count } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);

      await supabase
        .from('posts')
        .update({ comments_count: count || 0 })
        .eq('id', postId);
    }

    res.status(200).json({ success: true, message: 'User and all associated content deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
