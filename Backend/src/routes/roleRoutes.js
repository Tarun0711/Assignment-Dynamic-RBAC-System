import express from 'express';
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  addPermissionsToRole,
  removePermissionsFromRole,
  getRoleStats
} from '../controllers/roleController.js';
import { authenticate } from '../middleware/auth.js';
import { canManageRoles } from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes that any authenticated user can access
router.get('/', getRoles);
router.get('/stats', getRoleStats);
router.get('/:id', getRole);

// Routes that require role management permission
router.post('/', canManageRoles, createRole);
router.put('/:id', canManageRoles, updateRole);
router.delete('/:id', canManageRoles, deleteRole);
router.post('/:id/permissions', canManageRoles, addPermissionsToRole);
router.delete('/:id/permissions', canManageRoles, removePermissionsFromRole);

export default router;