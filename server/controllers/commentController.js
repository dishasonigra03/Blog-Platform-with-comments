const supabase = require('../config/supabase');

// Helper to map comment fields
const mapComment = (c) => {
  if (!c) return null;
  return {
    _id: c.id,
    id: c.id,
    postId: c.post_id,
    comment: c.comment,
    parentComment: c.parent_comment,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    userId: c.user ? {
      _id: c.user.id,
      id: c.user.id,
      name: c.user.name,
      avatar: c.user.avatar,
      role: c.user.role
    } : null
  };
};

// Build tree structure
const buildCommentTree = (comments) => {
  const commentMap = {};
  const commentTree = [];

  comments.forEach(comment => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  comments.forEach(comment => {
    const commentObj = commentMap[comment.id];
    if (comment.parentComment) {
      const parent = commentMap[comment.parentComment];
      if (parent) {
        parent.replies.push(commentObj);
      } else {
        commentTree.push(commentObj);
      }
    } else {
      commentTree.push(commentObj);
    }
  });

  return commentTree;
};

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getCommentsByPost = async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, user:users(id, name, avatar, role)')
      .eq('post_id', req.params.postId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const mappedComments = comments.map(mapComment);
    const commentTree = buildCommentTree(mappedComments);

    res.status(200).json({
      success: true,
      count: comments.length,
      comments: commentTree
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a comment or nested reply
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { postId, comment, parentComment } = req.body;

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('comments_count')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: req.user.id,
        comment,
        parent_comment: parentComment || null
      })
      .select('*, user:users(id, name, avatar, role)')
      .single();

    if (insertError) {
      return res.status(400).json({ success: false, message: insertError.message });
    }

    // Update post comments count
    const updatedCount = (post.comments_count || 0) + 1;
    await supabase
      .from('posts')
      .update({ comments_count: updatedCount })
      .eq('id', postId);

    const mappedComment = mapComment(newComment);
    const io = req.app.get('socketio');
    if (io) {
      io.to(postId).emit('comment_added', { comment: mappedComment });
    }

    res.status(201).json({ success: true, comment: mappedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    // Get current comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError || !comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Verify ownership
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        comment: req.body.comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('*, user:users(id, name, avatar, role)')
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const mappedUpdatedComment = mapComment(updatedComment);
    const io = req.app.get('socketio');
    if (io) {
      io.to(updatedComment.post_id).emit('comment_edited', { comment: mappedUpdatedComment });
    }

    res.status(200).json({ success: true, comment: mappedUpdatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a comment and all its nested replies
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    // Get current comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError || !comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Verify ownership or admin privileges
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    // Count comments for this post BEFORE deletion
    const { count: countBefore } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', comment.post_id);

    // Delete comment (Postgres CASCADE will delete child comments automatically)
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return res.status(400).json({ success: false, message: deleteError.message });
    }

    // Count comments for this post AFTER deletion
    const { count: countAfter } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', comment.post_id);

    const deletedCount = countBefore - countAfter;

    // Fetch existing post comments_count
    const { data: post } = await supabase
      .from('posts')
      .select('comments_count')
      .eq('id', comment.post_id)
      .maybeSingle();

    if (post) {
      const newCount = Math.max(0, (post.comments_count || 0) - deletedCount);
      await supabase
        .from('posts')
        .update({ comments_count: newCount })
        .eq('id', comment.post_id);
    }

    const io = req.app.get('socketio');
    if (io) {
      io.to(comment.post_id).emit('comment_deleted', { commentId, postId: comment.post_id });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
