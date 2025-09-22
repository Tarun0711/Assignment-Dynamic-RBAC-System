import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../utils/responseUtils.js';
import { sanitizeInput, validatePagination, validateSort, isValidObjectId, isValidEmail } from '../utils/validators.js';
import emailService from '../services/emailService.js';

/**
 * Get all users
 * @route GET /api/users
 * @access Private (requires user management permission)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, role, isActive } = req.query;

  // Validate pagination
  const { page: validPage, limit: validLimit, skip } = validatePagination(page, limit);

  // Validate sorting
  const sortOptions = validateSort(sortBy, sortOrder, ['name', 'email', 'createdAt', 'updatedAt', 'lastLogin']);

  // Build filter
  const filter = {};
  
  if (search) {
    const searchRegex = new RegExp(sanitizeInput(search), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex }
    ];
  }

  if (role && isValidObjectId(role)) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  // Get users with pagination
  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('role', 'name description')
      .populate('customPermissions.granted customPermissions.revoked', 'name description resource action')
      .sort(sortOptions)
      .skip(skip)
      .limit(validLimit),
    User.countDocuments(filter)
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

  sendSuccessResponse(res, 200, users, 'Users retrieved successfully', { pagination });
});

/**
 * Get single user by ID
 * @route GET /api/users/:id
 * @access Private (requires user management permission or own profile)
 */
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid user ID');
  }

  // Check if user is accessing their own profile or has user management permission
  const hasUserManagePermission = await req.user.hasPermission('user.read');
  const isOwnProfile = req.user._id.toString() === id;

  if (!hasUserManagePermission && !isOwnProfile) {
    return sendErrorResponse(res, 403, 'Access denied. Cannot view other user profiles without proper permissions.');
  }

  const user = await User.findById(id)
    .populate({
      path: 'role',
      populate: {
        path: 'permissions',
        select: 'name description resource action'
      }
    })
    .populate('customPermissions.granted customPermissions.revoked', 'name description resource action');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Get all effective permissions
  const allPermissions = await user.getAllPermissions();

  sendSuccessResponse(res, 200, {
    user,
    effectivePermissions: allPermissions
  }, 'User retrieved successfully');
});

/**
 * Create new user
 * @route POST /api/users
 * @access Private (requires user management permission)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId } = req.body;

  // Input validation
  if (!name || !email || !password || !roleId) {
    return sendErrorResponse(res, 400, 'Name, email, password, and role are required');
  }

  if (!isValidEmail(email)) {
    return sendErrorResponse(res, 400, 'Please provide a valid email address');
  }

  if (!isValidObjectId(roleId)) {
    return sendErrorResponse(res, 400, 'Invalid role ID');
  }

  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: sanitizedEmail });
  if (existingUser) {
    return sendErrorResponse(res, 400, 'User with this email already exists');
  }

  // Verify role exists
  const role = await Role.findById(roleId);
  if (!role) {
    return sendErrorResponse(res, 400, 'Role not found');
  }

  // Create user
  const user = await User.create({
    name: sanitizedName,
    email: sanitizedEmail,
    password,
    role: roleId
  });

  await user.populate('role', 'name description');

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  sendSuccessResponse(res, 201, user, 'User created successfully');
});

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (requires user management permission or own profile)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, isActive } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid user ID');
  }

  // Check permissions
  const hasUserManagePermission = await req.user.hasPermission('user.update');
  const isOwnProfile = req.user._id.toString() === id;

  if (!hasUserManagePermission && !isOwnProfile) {
    return sendErrorResponse(res, 403, 'Access denied. Cannot update other user profiles without proper permissions.');
  }

  const user = await User.findById(id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Update fields
  if (name) {
    user.name = sanitizeInput(name);
  }

  // Only users with management permission can change isActive status
  if (typeof isActive === 'boolean' && hasUserManagePermission) {
    user.isActive = isActive;
  }

  await user.save();
  await user.populate('role', 'name description');

  sendSuccessResponse(res, 200, user, 'User updated successfully');
});

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private (requires user management permission)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid user ID');
  }

  // Prevent users from deleting themselves
  if (req.user._id.toString() === id) {
    return sendErrorResponse(res, 400, 'You cannot delete your own account');
  }

  const user = await User.findById(id).populate('role', 'name');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Prevent deletion of SuperAdmin users (unless by another SuperAdmin)
  if (user.role.name === 'SuperAdmin' && req.user.role.name !== 'SuperAdmin') {
    return sendErrorResponse(res, 403, 'Only SuperAdmin can delete other SuperAdmin accounts');
  }

  await User.findByIdAndDelete(id);

  sendSuccessResponse(res, 200, null, 'User deleted successfully');
});

/**
 * Assign role to user
 * @route PUT /api/users/:id/role
 * @access Private (requires user management permission)
 */
export const assignRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roleId } = req.body;

  if (!isValidObjectId(id) || !isValidObjectId(roleId)) {
    return sendErrorResponse(res, 400, 'Invalid user ID or role ID');
  }

  const [user, role] = await Promise.all([
    User.findById(id).populate('role', 'name description'),
    Role.findById(roleId)
  ]);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  if (!role) {
    return sendErrorResponse(res, 400, 'Role not found');
  }

  // Check if role assignment would create security issues
  if (role.name === 'SuperAdmin' && req.user.role.name !== 'SuperAdmin') {
    return sendErrorResponse(res, 403, 'Only SuperAdmin can assign SuperAdmin role');
  }

  const oldRole = user.role;
  user.role = roleId;
  await user.save();

  await user.populate('role', 'name description');

  // Send role assignment notification
  try {
    await emailService.sendRoleAssignmentEmail(user, role, req.user);
  } catch (error) {
    console.error('Failed to send role assignment email:', error);
  }

  sendSuccessResponse(res, 200, user, `Role assigned successfully. Changed from ${oldRole.name} to ${role.name}`);
});

/**
 * Grant custom permissions to user
 * @route POST /api/users/:id/permissions/grant
 * @access Private (requires user management permission)
 */
export const grantCustomPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid user ID');
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendErrorResponse(res, 400, 'Permissions array is required');
  }

  // Validate permission IDs
  const invalidPermissions = permissions.filter(permId => !isValidObjectId(permId));
  if (invalidPermissions.length > 0) {
    return sendErrorResponse(res, 400, 'Invalid permission IDs provided');
  }

  const user = await User.findById(id).populate('role', 'name');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Verify all permissions exist
  const existingPermissions = await Permission.find({ _id: { $in: permissions } });
  if (existingPermissions.length !== permissions.length) {
    return sendErrorResponse(res, 400, 'Some permissions do not exist');
  }

  // Add permissions to granted list (avoiding duplicates)
  const newPermissions = permissions.filter(permId => 
    !user.customPermissions.granted.some(existingId => existingId.toString() === permId)
  );

  if (newPermissions.length === 0) {
    return sendErrorResponse(res, 400, 'All specified permissions are already granted to this user');
  }

  user.customPermissions.granted.push(...newPermissions);

  // Remove from revoked list if present
  user.customPermissions.revoked = user.customPermissions.revoked.filter(permId =>
    !permissions.includes(permId.toString())
  );

  await user.save();

  await user.populate('customPermissions.granted', 'name description resource action');

  sendSuccessResponse(res, 200, user, `${newPermissions.length} custom permissions granted successfully`);
});

/**
 * Revoke custom permissions from user
 * @route POST /api/users/:id/permissions/revoke
 * @access Private (requires user management permission)
 */
export const revokeCustomPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid user ID');
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendErrorResponse(res, 400, 'Permissions array is required');
  }

  const user = await User.findById(id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Add to revoked list (avoiding duplicates)
  const newRevokedPermissions = permissions.filter(permId => 
    !user.customPermissions.revoked.some(existingId => existingId.toString() === permId)
  );

  if (newRevokedPermissions.length > 0) {
    user.customPermissions.revoked.push(...newRevokedPermissions);
  }

  // Remove from granted list
  user.customPermissions.granted = user.customPermissions.granted.filter(permId =>
    !permissions.includes(permId.toString())
  );

  await user.save();

  await user.populate('customPermissions.revoked', 'name description resource action');

  sendSuccessResponse(res, 200, user, `${newRevokedPermissions.length} custom permissions revoked successfully`);
});

/**
 * Remove custom permissions from user (clear both granted and revoked)
 * @route DELETE /api/users/:id/permissions
 * @access Private (requires user management permission)
 */
export const removeCustomPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid user ID');
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendErrorResponse(res, 400, 'Permissions array is required');
  }

  const user = await User.findById(id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Remove from both granted and revoked lists
  user.customPermissions.granted = user.customPermissions.granted.filter(permId =>
    !permissions.includes(permId.toString())
  );

  user.customPermissions.revoked = user.customPermissions.revoked.filter(permId =>
    !permissions.includes(permId.toString())
  );

  await user.save();

  sendSuccessResponse(res, 200, user, 'Custom permissions removed successfully');
});

/**
 * Get user statistics
 * @route GET /api/users/stats
 * @access Private (requires user management permission)
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const verifiedUsers = await User.countDocuments({ emailVerified: true });

  // Get user distribution by role
  const roleDistribution = await User.aggregate([
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleInfo'
      }
    },
    {
      $group: {
        _id: '$role',
        roleName: { $first: { $arrayElemAt: ['$roleInfo.name', 0] } },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentRegistrations = await User.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });

  sendSuccessResponse(res, 200, {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    roleDistribution,
    recentRegistrations
  }, 'User statistics retrieved successfully');
});