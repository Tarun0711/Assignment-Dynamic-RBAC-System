import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate JWT token
 * @param {string} userId - User ID to encode in token
 * @param {Object} options - Additional options
 * @returns {string} JWT token
 */
export const generateToken = (userId, options = {}) => {
  const {
    expiresIn = process.env.JWT_EXPIRES_IN || '7d',
    secret = process.env.JWT_SECRET
  } = options;

  return jwt.sign(
    { userId },
    secret,
    { expiresIn }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret (optional)
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

/**
 * Generate secure random token
 * @param {number} length - Length of the token in bytes
 * @returns {string} Random hex token
 */
export const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a password or token
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
export const hashToken = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Create password reset token
 * @returns {Object} Token and hashed token with expiry
 */
export const createPasswordResetToken = () => {
  const resetToken = generateRandomToken();
  const hashedToken = hashToken(resetToken);
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return {
    token: resetToken,
    hashedToken,
    expires
  };
};

/**
 * Create email verification token
 * @returns {Object} Token and hashed token with expiry
 */
export const createEmailVerificationToken = () => {
  const verificationToken = generateRandomToken();
  const hashedToken = hashToken(verificationToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token: verificationToken,
    hashedToken,
    expires
  };
};