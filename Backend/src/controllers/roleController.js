import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../utils/responseUtils.js';
import { sanitizeInput, validatePagination, validateSort, isValidObjectId } from '../utils/validators.js';

/**
 * Get all roles
 * @route GET /api/roles
 * @access Private
 */
export const getRoles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, isActive } = req.query;

  // Validate pagination
  const { page: validPage, limit: validLimit, skip } = validatePagination(page, limit);

  // Validate sorting
  const sortOptions = validateSort(sortBy, sortOrder, ['name', 'createdAt', 'updatedAt']);

  // Build filter
  const filter = {};
  
  if (search) {
    const searchRegex = new RegExp(sanitizeInput(search), 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex }
    ];
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  // Get roles with pagination and populate permissions
  const [roles, total] = await Promise.all([
    Role.find(filter)
      .populate('permissions', 'name description resource action')
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(validLimit),
    Role.countDocuments(filter)
  ]);

  // Add user count for each role
  const rolesWithUserCount = await Promise.all(
    roles.map(async (role) => {
      const userCount = await User.countDocuments({ role: role._id });
      return {
        ...role.toObject(),
        userCount
      };
    })
  );

  // Calculate pagination info
  const totalPages = Math.ceil(total / validLimit);

  const pagination = {
    page: validPage,
    totalPages,
    totalItems: total,
    limit: validLimit,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1
  };

  sendSuccessResponse(res, 200, rolesWithUserCount, 'Roles retrieved successfully', { pagination });
});

/**
 * Get single role by ID
 * @route GET /api/roles/:id
 * @access Private
 */
export const getRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid role ID');
  }

  const role = await Role.findById(id)
    .populate('permissions', 'name description resource action')
    .populate('createdBy', 'name email');

  if (!role) {
    return sendErrorResponse(res, 404, 'Role not found');
  }

  // Get users with this role
  const users = await User.find({ role: id }).select('name email isActive');
  const userCount = users.length;

  sendSuccessResponse(res, 200, {
    ...role.toObject(),
    userCount,
    users
  }, 'Role retrieved successfully');
});

/**
 * Create new role
 * @route POST /api/roles
 * @access Private (requires role management permission)
 */
export const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions = [] } = req.body;

  // Input validation
  if (!name || !description) {
    return sendErrorResponse(res, 400, 'Role name and description are required');
  }

  const sanitizedName = sanitizeInput(name);
  const sanitizedDescription = sanitizeInput(description);

  // Check if role already exists
  const existingRole = await Role.findOne({ name: sanitizedName });
  if (existingRole) {
    return sendErrorResponse(res, 400, 'Role with this name already exists');
  }

  // Validate permissions if provided
  if (permissions.length > 0) {
    const invalidPermissions = permissions.filter(id => !isValidObjectId(id));
    if (invalidPermissions.length > 0) {
      return sendErrorResponse(res, 400, 'Invalid permission IDs provided');
    }

    const existingPermissions = await Permission.find({ _id: { $in: permissions } });
    if (existingPermissions.length !== permissions.length) {
      return sendErrorResponse(res, 400, 'Some permissions do not exist');
    }
  }

  // Create role
  const role = await Role.create({
    name: sanitizedName,
    description: sanitizedDescription,
    permissions,
    createdBy: req.user._id
  });

  await role.populate([
    { path: 'permissions', select: 'name description resource action' },
    { path: 'createdBy', select: 'name email' }
  ]);

  sendSuccessResponse(res, 201, role, 'Role created successfully');
});

/**
 * Update role
 * @route PUT /api/roles/:id
 * @access Private (requires role management permission)
 */
export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive, permissions } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid role ID');
  }

  const role = await Role.findById(id);

  if (!role) {
    return sendErrorResponse(res, 404, 'Role not found');
  }

  // Check if it's a system role
  if (role.isSystemRole) {
    return sendErrorResponse(res, 403, 'System roles cannot be modified');
  }

  // Update fields if provided
  if (name) {
    const sanitizedName = sanitizeInput(name);
    
    // Check for name conflicts (excluding current role)
    const existingRole = await Role.findOne({ name: sanitizedName, _id: { $ne: id } });
    if (existingRole) {
      return sendErrorResponse(res, 400, 'Role with this name already exists');
    }
    
    role.name = sanitizedName;
  }

  if (description !== undefined) {
    role.description = sanitizeInput(description);
  }

  if (typeof isActive === 'boolean') {
    role.isActive = isActive;
  }

  // Handle permissions update if provided
  if (permissions && Array.isArray(permissions)) {
    // Validate permission IDs
    const invalidPermissions = permissions.filter(permId => !isValidObjectId(permId));
    if (invalidPermissions.length > 0) {
      return sendErrorResponse(res, 400, 'Invalid permission IDs provided');
    }

    // Verify all permissions exist
    if (permissions.length > 0) {
      const existingPermissions = await Permission.find({ _id: { $in: permissions } });
      if (existingPermissions.length !== permissions.length) {
        const foundIds = existingPermissions.map(p => p._id.toString());
        const notFound = permissions.filter(id => !foundIds.includes(id));
        return sendErrorResponse(res, 400, 'Some permissions do not exist', { notFound });
      }
    }

    // Update permissions
    role.permissions = permissions;
  }

  await role.save();

  await role.populate([
    { path: 'permissions', select: 'name description resource action' },
    { path: 'createdBy', select: 'name email' }
  ]);

  sendSuccessResponse(res, 200, role, 'Role updated successfully');
});

/**
 * Delete role
 * @route DELETE /api/roles/:id
 * @access Private (requires role management permission)
 */
export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid role ID');
  }

  const role = await Role.findById(id);

  if (!role) {
    return sendErrorResponse(res, 404, 'Role not found');
  }

  // Check if it's a system role
  if (role.isSystemRole) {
    return sendErrorResponse(res, 403, 'System roles cannot be deleted');
  }

  // Check if role is being used by users
  const usersWithRole = await User.find({ role: id });

  if (usersWithRole.length > 0) {
    return sendErrorResponse(res, 400, 'Cannot delete role. It is assigned to one or more users.', {
      usersWithRole: usersWithRole.map(user => ({ id: user._id, name: user.name, email: user.email }))
    });
  }

  await Role.findByIdAndDelete(id);

  sendSuccessResponse(res, 200, null, 'Role deleted successfully');
});

/**
 * Add permissions to role
 * @route POST /api/roles/:id/permissions
 * @access Private (requires role management permission)
 */
export const addPermissionsToRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid role ID');
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendErrorResponse(res, 400, 'Permissions array is required');
  }

  // Validate permission IDs
  const invalidPermissions = permissions.filter(permId => !isValidObjectId(permId));
  if (invalidPermissions.length > 0) {
    return sendErrorResponse(res, 400, 'Invalid permission IDs provided');
  }

  const role = await Role.findById(id);

  if (!role) {
    return sendErrorResponse(res, 404, 'Role not found');
  }

  // Check if it's a system role
  if (role.isSystemRole && req.user.role.name !== 'SuperAdmin') {
    return sendErrorResponse(res, 403, 'Only SuperAdmin can modify system roles');
  }

  // Verify all permissions exist
  const existingPermissions = await Permission.find({ _id: { $in: permissions } });
  if (existingPermissions.length !== permissions.length) {
    const foundIds = existingPermissions.map(p => p._id.toString());
    const notFound = permissions.filter(id => !foundIds.includes(id));
    return sendErrorResponse(res, 400, 'Some permissions do not exist', { notFound });
  }

  // Add permissions to role (avoiding duplicates)
  const newPermissions = permissions.filter(permId => 
    !role.permissions.some(existingId => existingId.toString() === permId)
  );

  if (newPermissions.length === 0) {
    return sendErrorResponse(res, 400, 'All specified permissions are already assigned to this role');
  }

  role.permissions.push(...newPermissions);
  await role.save();

  await role.populate('permissions', 'name description resource action');

  sendSuccessResponse(res, 200, role, `${newPermissions.length} permissions added to role successfully`);
});

/**
 * Remove permissions from role
 * @route DELETE /api/roles/:id/permissions
 * @access Private (requires role management permission)
 */
export const removePermissionsFromRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid role ID');
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendErrorResponse(res, 400, 'Permissions array is required');
  }

  const role = await Role.findById(id);

  if (!role) {
    return sendErrorResponse(res, 404, 'Role not found');
  }

  // Check if it's a system role
  if (role.isSystemRole && req.user.role.name !== 'SuperAdmin') {
    return sendErrorResponse(res, 403, 'Only SuperAdmin can modify system roles');
  }

  // Remove permissions from role
  const originalCount = role.permissions.length;
  role.permissions = role.permissions.filter(permId => 
    !permissions.includes(permId.toString())
  );

  const removedCount = originalCount - role.permissions.length;

  if (removedCount === 0) {
    return sendErrorResponse(res, 400, 'None of the specified permissions were found in this role');
  }

  await role.save();

  await role.populate('permissions', 'name description resource action');

  sendSuccessResponse(res, 200, role, `${removedCount} permissions removed from role successfully`);
});

/**
 * Get role statistics
 * @route GET /api/roles/stats
 * @access Private
 */
export const getRoleStats = asyncHandler(async (req, res) => {
  const totalRoles = await Role.countDocuments();
  const activeRoles = await Role.countDocuments({ isActive: true });
  const systemRoles = await Role.countDocuments({ isSystemRole: true });

  // Get roles with user counts
  const rolesWithUserCounts = await Role.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'role',
        as: 'users'
      }
    },
    {
      $project: {
        name: 1,
        userCount: { $size: '$users' },
        isActive: 1,
        isSystemRole: 1
      }
    },
    { $sort: { userCount: -1 } }
  ]);

  // Get permission distribution
  const permissionStats = await Role.aggregate([
    {
      $project: {
        name: 1,
        permissionCount: { $size: '$permissions' }
      }
    },
    { $sort: { permissionCount: -1 } }
  ]);

  sendSuccessResponse(res, 200, {
    totalRoles,
    activeRoles,
    inactiveRoles: totalRoles - activeRoles,
    systemRoles,
    customRoles: totalRoles - systemRoles,
    rolesWithUserCounts,
    permissionDistribution: permissionStats
  }, 'Role statistics retrieved successfully');
});