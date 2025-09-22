import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  grantCustomPermissions,
  revokeCustomPermissions,
  removeCustomPermissions,
  getUserStats
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { canManageUsers, requirePermissions } from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes accessible by any authenticated user
router.get('/stats', requirePermissions('user.read'), getUserStats);

// Routes that require user management permissions or self-access
router.get('/', requirePermissions('user.read'), getUsers);
router.get('/:id', getUser); // Controller handles permission check for self-access
router.put('/:id', updateUser); // Controller handles permission check for self-access

// Routes that require user management permissions
router.post('/', canManageUsers, createUser);
router.delete('/:id', canManageUsers, deleteUser);
router.put('/:id/role', canManageUsers, assignRole);
router.post('/:id/permissions/grant', canManageUsers, grantCustomPermissions);
router.post('/:id/permissions/revoke', canManageUsers, revokeCustomPermissions);
router.delete('/:id/permissions', canManageUsers, removeCustomPermissions);

export default router;