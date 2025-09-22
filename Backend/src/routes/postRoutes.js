import express from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  getMyPosts,
  restorePost,
  getPostStats
} from '../controllers/postController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePermissions } from '../middleware/rbac.js';

const router = express.Router();

// Public routes with optional authentication
router.get('/', optionalAuth, getPosts);
router.get('/stats', authenticate, requirePermissions('post.read'), getPostStats);
router.get('/:id', optionalAuth, getPost);

// Protected routes
router.use(authenticate); // All routes below require authentication

// User's own posts
router.get('/my/posts', getMyPosts);

// Routes that require specific permissions
router.post('/', requirePermissions('post.create'), createPost);
router.put('/:id', updatePost); // Controller handles ownership check
router.delete('/:id', deletePost); // Controller handles ownership check
router.post('/:id/restore', requirePermissions('post.delete'), restorePost);

// Like functionality (any authenticated user can like/unlike)
router.post('/:id/like', toggleLikePost);

export default router;