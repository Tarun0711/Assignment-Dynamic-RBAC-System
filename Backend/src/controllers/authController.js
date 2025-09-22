import User from '../models/User.js';
import Role from '../models/Role.js';
import { generateToken, createEmailVerificationToken, createPasswordResetToken, hashToken } from '../utils/tokenUtils.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../utils/responseUtils.js';
import { validatePassword, isValidEmail, sanitizeInput } from '../utils/validators.js';
import emailService from '../services/emailService.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendErrorResponse(res, 400, 'Name, email, and password are required');
  }

  if (!isValidEmail(email)) {
    return sendErrorResponse(res, 400, 'Please provide a valid email address');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return sendErrorResponse(res, 400, 'Password does not meet requirements', {
      passwordErrors: passwordValidation.errors
    });
  }

  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: sanitizedEmail });
  if (existingUser) {
    return sendErrorResponse(res, 400, 'User with this email already exists');
  }

  // For the first user, assign SuperAdmin role
  let defaultRole;
  const userCount = await User.countDocuments();
  
  if (userCount === 0) {
    // First user gets SuperAdmin role
    defaultRole = await Role.findOne({ name: 'SuperAdmin' });
    if (!defaultRole) {
      return sendErrorResponse(res, 500, 'SuperAdmin role not found. Please run database seeding first.');
    }
  } else {
    // Subsequent users get default role (User)
    defaultRole = await Role.findOne({ name: 'User' });
    if (!defaultRole) {
      return sendErrorResponse(res, 500, 'Default user role not found. Please check database configuration.');
    }
  }

  // Create email verification token
  const { token: verificationToken, hashedToken, expires } = createEmailVerificationToken();

  // Create user
  const user = await User.create({
    name: sanitizedName,
    email: sanitizedEmail,
    password,
    role: defaultRole._id,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expires
  });

  // Populate role information
  await user.populate('role', 'name description');

  // Generate JWT token
  const jwtToken = generateToken(user._id);

  // Set cookie
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('token', jwtToken, cookieOptions);

  // Send welcome email with verification token
  try {
    await emailService.sendWelcomeEmail(user, verificationToken);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  // Remove sensitive data from response
  user.password = undefined;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  sendSuccessResponse(res, 201, {
    user,
    token: jwtToken,
    isFirstUser: userCount === 0
  }, 'User registered successfully');
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return sendErrorResponse(res, 400, 'Email and password are required');
  }

  if (!isValidEmail(email)) {
    return sendErrorResponse(res, 400, 'Please provide a valid email address');
  }

  const sanitizedEmail = email.toLowerCase().trim();

  // Find user and include password for comparison
  const user = await User.findOne({ email: sanitizedEmail })
    .select('+password +loginAttempts +lockUntil')
    .populate('role', 'name description permissions');

  if (!user) {
    return sendErrorResponse(res, 401, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked) {
    return sendErrorResponse(res, 423, 'Account is temporarily locked due to too many failed login attempts. Please try again later.');
  }

  // Check if account is active
  if (!user.isActive) {
    return sendErrorResponse(res, 403, 'Account is deactivated. Please contact administrator.');
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    // Increment failed login attempts
    await user.incLoginAttempts();
    return sendErrorResponse(res, 401, 'Invalid email or password');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Populate role and permissions
  await user.populate({
    path: 'role',
    populate: {
      path: 'permissions',
      select: 'name description resource action'
    }
  });

  // Generate JWT token
  const jwtToken = generateToken(user._id);

  // Set cookie
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('token', jwtToken, cookieOptions);

  // Remove sensitive data from response
  user.password = undefined;
  user.loginAttempts = undefined;
  user.lockUntil = undefined;

  sendSuccessResponse(res, 200, {
    user,
    token: jwtToken
  }, 'Login successful');
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  sendSuccessResponse(res, 200, null, 'Logged out successfully');
});

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
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
    permissions: allPermissions
  }, 'Profile retrieved successfully');
});

/**
 * Update current user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return sendErrorResponse(res, 400, 'Name is required');
  }

  const sanitizedName = sanitizeInput(name);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: sanitizedName },
    { new: true, runValidators: true }
  ).populate('role', 'name description');

  sendSuccessResponse(res, 200, { user }, 'Profile updated successfully');
});

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return sendErrorResponse(res, 400, 'Please provide a valid email address');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    // Don't reveal whether user exists or not
    return sendSuccessResponse(res, 200, null, 'If an account with that email exists, a password reset link has been sent.');
  }

  // Generate password reset token
  const { token: resetToken, hashedToken, expires } = createPasswordResetToken();

  // Save reset token to user
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expires;
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
    sendSuccessResponse(res, 200, null, 'Password reset link has been sent to your email.');
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return sendErrorResponse(res, 500, 'Failed to send password reset email. Please try again.');
  }
});

/**
 * Reset password
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return sendErrorResponse(res, 400, 'Token and new password are required');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return sendErrorResponse(res, 400, 'Password does not meet requirements', {
      passwordErrors: passwordValidation.errors
    });
  }

  // Hash the token to compare with stored hash
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return sendErrorResponse(res, 400, 'Invalid or expired reset token');
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendSuccessResponse(res, 200, null, 'Password reset successful. You can now login with your new password.');
});

/**
 * Verify email address
 * @route POST /api/auth/verify-email
 * @access Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return sendErrorResponse(res, 400, 'Verification token is required');
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return sendErrorResponse(res, 400, 'Invalid or expired verification token');
  }

  // Mark email as verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  sendSuccessResponse(res, 200, null, 'Email verified successfully');
});

/**
 * Resend email verification
 * @route POST /api/auth/resend-verification
 * @access Private
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.emailVerified) {
    return sendErrorResponse(res, 400, 'Email is already verified');
  }

  // Generate new verification token
  const { token: verificationToken, hashedToken, expires } = createEmailVerificationToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expires;
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendEmailVerification(user, verificationToken);
    sendSuccessResponse(res, 200, null, 'Verification email has been sent');
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return sendErrorResponse(res, 500, 'Failed to send verification email. Please try again.');
  }
});