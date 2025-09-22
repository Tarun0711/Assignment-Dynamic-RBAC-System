import User from '../models/User.js';

/**
 * Higher-order function that creates middleware to check specific permissions
 * @param {string|string[]} requiredPermissions - Permission(s) required to access the route
 * @param {Object} options - Additional options for permission checking
 * @returns {Function} Express middleware function
 */
export const requirePermissions = (requiredPermissions, options = {}) => {
  const {
    requireAll = false, // If true, user must have ALL permissions. If false, ANY permission is sufficient
    allowSuperAdmin = true, // If true, SuperAdmin bypasses permission checks
    customErrorMessage = null
  } = options;

  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access this resource.'
        });
      }

      // Convert single permission to array for consistent handling
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

      // SuperAdmin bypass (if enabled)
      if (allowSuperAdmin && req.user.role && req.user.role.name === 'SuperAdmin') {
        return next();
      }

      // Get user's all permissions (role + custom permissions)
      const userPermissions = await req.user.getAllPermissions();
      const userPermissionNames = userPermissions.map(p => p.name);

      let hasAccess = false;

      if (requireAll) {
        // User must have ALL required permissions
        hasAccess = permissions.every(permission => userPermissionNames.includes(permission));
      } else {
        // User must have at least ONE required permission
        hasAccess = permissions.some(permission => userPermissionNames.includes(permission));
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: customErrorMessage || `Access denied. Required permission${permissions.length > 1 ? 's' : ''}: ${permissions.join(', ')}`,
          requiredPermissions: permissions,
          userPermissions: userPermissionNames
        });
      }

      // Add permission info to request for logging/auditing
      req.permissionCheck = {
        requiredPermissions: permissions,
        userPermissions: userPermissionNames,
        accessGranted: true
      };

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission verification.'
      });
    }
  };
};

/**
 * Middleware to check if user can manage other users
 * Typically used for user management endpoints
 */
export const canManageUsers = requirePermissions(['user.create', 'user.update', 'user.delete'], {
  requireAll: false,
  customErrorMessage: 'Access denied. User management permissions required.'
});

/**
 * Middleware to check if user can manage roles
 */
export const canManageRoles = requirePermissions(['role.create', 'role.update', 'role.delete'], {
  requireAll: false,
  customErrorMessage: 'Access denied. Role management permissions required.'
});

/**
 * Middleware to check if user can manage permissions
 * Usually restricted to SuperAdmin only
 */
export const canManagePermissions = requirePermissions(['permission.create', 'permission.update', 'permission.delete'], {
  requireAll: false,
  customErrorMessage: 'Access denied. Permission management requires SuperAdmin privileges.'
});

/**
 * Middleware to check resource ownership or admin privileges
 * @param {string} resourceField - Field name that contains the user ID (e.g., 'author', 'createdBy')
 * @param {string[]} adminPermissions - Permissions that allow bypassing ownership check
 */
export const requireOwnershipOrPermission = (resourceField = 'author', adminPermissions = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // SuperAdmin bypass
      if (req.user.role && req.user.role.name === 'SuperAdmin') {
        return next();
      }

      // Check admin permissions
      if (adminPermissions.length > 0) {
        const userPermissions = await req.user.getAllPermissions();
        const userPermissionNames = userPermissions.map(p => p.name);
        
        const hasAdminPermission = adminPermissions.some(permission => 
          userPermissionNames.includes(permission)
        );
        
        if (hasAdminPermission) {
          return next();
        }
      }

      // Check ownership
      const resourceId = req.params.id || req.params.postId || req.body.id;
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required.'
        });
      }

      // The actual ownership check would depend on the resource type
      // This is a generic implementation that can be customized
      req.requireOwnershipCheck = {
        resourceField,
        userId: req.user._id,
        resourceId
      };

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during ownership verification.'
      });
    }
  };
};

/**
 * Middleware factory to create role-based access control
 * @param {string|string[]} allowedRoles - Role(s) allowed to access the route
 */
export const requireRoles = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. No role assigned.'
        });
      }

      if (!roles.includes(req.user.role.name)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${roles.join(', ')}`,
          userRole: req.user.role.name,
          allowedRoles: roles
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification.'
      });
    }
  };
};