import express from 'express';
import {
  getPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionStats,
  bulkCreatePermissions
} from '../controllers/permissionController.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes that any authenticated user can access
router.get('/', getPermissions);
router.get('/stats', getPermissionStats);
router.get('/:id', getPermission);

// Routes that require SuperAdmin privileges
router.post('/', requireSuperAdmin, createPermission);
router.post('/bulk', requireSuperAdmin, bulkCreatePermissions);
router.put('/:id', requireSuperAdmin, updatePermission);
router.delete('/:id', requireSuperAdmin, deletePermission);

export default router;