import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to authenticate user using JWT token
 * Adds user object to req.user if valid token is provided
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId)
        .select('+password') // Include password for certain operations
        .populate({
          path: 'role',
          populate: {
            path: 'permissions',
            select: 'name description resource action'
          }
        })
        .populate('customPermissions.granted customPermissions.revoked', 'name description resource action');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Account is deactivated.'
        });
      }

      if (user.isLocked) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Account is temporarily locked due to too many failed login attempts.'
        });
      }

      // Remove password from user object before adding to request
      user.password = undefined;
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired.'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Middleware to check if user has SuperAdmin role
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!req.user.role || req.user.role.name !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('SuperAdmin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization.'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to req.user if valid token is provided, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
          .populate({
            path: 'role',
            populate: {
              path: 'permissions',
              select: 'name description resource action'
            }
          })
          .populate('customPermissions.granted customPermissions.revoked', 'name description resource action');

        if (user && user.isActive && !user.isLocked) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
        console.log('Optional auth token error:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
};