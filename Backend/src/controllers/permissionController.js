import Permission from '../models/Permission.js';
import User from '../models/User.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../utils/responseUtils.js';
import { sanitizeInput, isValidPermissionName, validatePagination, validateSort } from '../utils/validators.js';

/**
 * Get all permissions
 * @route GET /api/permissions
 * @access Private
 */
export const getPermissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, resource, action } = req.query;

  // Validate pagination
  const { page: validPage, limit: validLimit, skip } = validatePagination(page, limit);

  // Validate sorting
  const sortOptions = validateSort(sortBy, sortOrder, ['name', 'resource', 'action', 'createdAt', 'updatedAt']);

  // Build filter
  const filter = {};
  
  if (search) {
    const searchRegex = new RegExp(sanitizeInput(search), 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { resource: searchRegex },
      { action: searchRegex }
    ];
  }

  if (resource) {
    filter.resource = sanitizeInput(resource).toLowerCase();
  }

  if (action) {
    filter.action = sanitizeInput(action).toLowerCase();
  }

  // Get permissions with pagination
  const [permissions, total] = await Promise.all([
    Permission.find(filter)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(validLimit),
    Permission.countDocuments(filter)
  ]);

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

  sendSuccessResponse(res, 200, permissions, 'Permissions retrieved successfully', { pagination });
});

/**
 * Get single permission by ID
 * @route GET /api/permissions/:id
 * @access Private
 */
export const getPermission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const permission = await Permission.findById(id).populate('createdBy', 'name email');

  if (!permission) {
    return sendErrorResponse(res, 404, 'Permission not found');
  }

  sendSuccessResponse(res, 200, permission, 'Permission retrieved successfully');
});

/**
 * Create new permission (SuperAdmin only)
 * @route POST /api/permissions
 * @access Private (SuperAdmin)
 */
export const createPermission = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Input validation
  if (!name || !description) {
    return sendErrorResponse(res, 400, 'Permission name and description are required');
  }

  const sanitizedName = sanitizeInput(name).toLowerCase();
  const sanitizedDescription = sanitizeInput(description);

  // Validate permission name format (resource.action)
  if (!isValidPermissionName(sanitizedName)) {
    return sendErrorResponse(res, 400, 'Permission name must follow format: resource.action (e.g., post.create)');
  }

  // Check if permission already exists
  const existingPermission = await Permission.findOne({ name: sanitizedName });
  if (existingPermission) {
    return sendErrorResponse(res, 400, 'Permission with this name already exists');
  }

  // Create permission
  const permission = await Permission.create({
    name: sanitizedName,
    description: sanitizedDescription,
    createdBy: req.user._id
  });

  await permission.populate('createdBy', 'name email');

  sendSuccessResponse(res, 201, permission, 'Permission created successfully');
});

/**
 * Update permission (SuperAdmin only)
 * @route PUT /api/permissions/:id
 * @access Private (SuperAdmin)
 */
export const updatePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!description) {
    return sendErrorResponse(res, 400, 'Description is required');
  }

  const permission = await Permission.findById(id);

  if (!permission) {
    return sendErrorResponse(res, 404, 'Permission not found');
  }

  // Check if it's a system permission
  if (permission.isSystemPermission) {
    return sendErrorResponse(res, 403, 'System permissions cannot be modified');
  }

  // Update permission
  permission.description = sanitizeInput(description);
  await permission.save();

  await permission.populate('createdBy', 'name email');

  sendSuccessResponse(res, 200, permission, 'Permission updated successfully');
});

/**
 * Delete permission (SuperAdmin only)
 * @route DELETE /api/permissions/:id
 * @access Private (SuperAdmin)
 */
export const deletePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const permission = await Permission.findById(id);

  if (!permission) {
    return sendErrorResponse(res, 404, 'Permission not found');
  }

  // Check if it's a system permission
  if (permission.isSystemPermission) {
    return sendErrorResponse(res, 403, 'System permissions cannot be deleted');
  }

  // Check if permission is being used by any roles
  const Role = (await import('../models/Role.js')).default;
  const rolesUsingPermission = await Role.find({ permissions: id });

  if (rolesUsingPermission.length > 0) {
    return sendErrorResponse(res, 400, 'Cannot delete permission. It is being used by one or more roles.', {
      rolesUsing: rolesUsingPermission.map(role => ({ id: role._id, name: role.name }))
    });
  }

  // Check if permission is being used in custom user permissions
  const usersWithCustomPermission = await User.find({
    $or: [
      { 'customPermissions.granted': id },
      { 'customPermissions.revoked': id }
    ]
  });

  if (usersWithCustomPermission.length > 0) {
    return sendErrorResponse(res, 400, 'Cannot delete permission. It is being used in user custom permissions.', {
      usersUsing: usersWithCustomPermission.map(user => ({ id: user._id, name: user.name, email: user.email }))
    });
  }

  await Permission.findByIdAndDelete(id);

  sendSuccessResponse(res, 200, null, 'Permission deleted successfully');
});

/**
 * Get permission statistics
 * @route GET /api/permissions/stats
 * @access Private
 */
export const getPermissionStats = asyncHandler(async (req, res) => {
  const stats = await Permission.aggregate([
    {
      $group: {
        _id: '$resource',
        count: { $sum: 1 },
        actions: { $addToSet: '$action' }
      }
    },
    {
      $project: {
        resource: '$_id',
        permissionCount: '$count',
        actions: 1,
        _id: 0
      }
    },
    { $sort: { resource: 1 } }
  ]);

  const totalPermissions = await Permission.countDocuments();
  const systemPermissions = await Permission.countDocuments({ isSystemPermission: true });
  const customPermissions = totalPermissions - systemPermissions;

  sendSuccessResponse(res, 200, {
    totalPermissions,
    systemPermissions,
    customPermissions,
    resourceStats: stats
  }, 'Permission statistics retrieved successfully');
});

/**
 * Bulk create permissions (SuperAdmin only)
 * @route POST /api/permissions/bulk
 * @access Private (SuperAdmin)
 */
export const bulkCreatePermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendErrorResponse(res, 400, 'Permissions array is required');
  }

  if (permissions.length > 50) {
    return sendErrorResponse(res, 400, 'Maximum 50 permissions can be created at once');
  }

  const validPermissions = [];
  const errors = [];

  // Validate each permission
  for (let i = 0; i < permissions.length; i++) {
    const { name, description } = permissions[i];

    if (!name || !description) {
      errors.push(`Permission ${i + 1}: Name and description are required`);
      continue;
    }

    const sanitizedName = sanitizeInput(name).toLowerCase();
    const sanitizedDescription = sanitizeInput(description);

    if (!isValidPermissionName(sanitizedName)) {
      errors.push(`Permission ${i + 1}: Invalid name format. Use resource.action format`);
      continue;
    }

    // Check for duplicates in the array
    const duplicateInArray = validPermissions.some(p => p.name === sanitizedName);
    if (duplicateInArray) {
      errors.push(`Permission ${i + 1}: Duplicate name in the request`);
      continue;
    }

    // Check if permission already exists in database
    const existingPermission = await Permission.findOne({ name: sanitizedName });
    if (existingPermission) {
      errors.push(`Permission ${i + 1}: Permission '${sanitizedName}' already exists`);
      continue;
    }

    validPermissions.push({
      name: sanitizedName,
      description: sanitizedDescription,
      createdBy: req.user._id
    });
  }

  if (errors.length > 0) {
    return sendErrorResponse(res, 400, 'Validation errors occurred', { errors });
  }

  // Create all valid permissions
  const createdPermissions = await Permission.insertMany(validPermissions);

  // Populate createdBy field
  await Permission.populate(createdPermissions, { path: 'createdBy', select: 'name email' });

  sendSuccessResponse(res, 201, createdPermissions, `${createdPermissions.length} permissions created successfully`);
});