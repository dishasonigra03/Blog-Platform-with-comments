const express = require('express');
const router = express.Router();
const {
  getPosts,
  getTrendingPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  getRelatedPosts
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public post routes
router.get('/', getPosts);
router.get('/trending', getTrendingPosts);
router.get('/:idOrSlug', getPost);
router.get('/:id/related', getRelatedPosts);

// Protected post routes
router.post('/', protect, upload.single('coverImage'), createPost);
router.put('/:id', protect, upload.single('coverImage'), updatePost);
router.delete('/:id', protect, deletePost);
router.put('/:id/like', protect, toggleLikePost);

module.exports = router;
