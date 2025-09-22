import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'User role is required']
  },
  customPermissions: {
    granted: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission'
    }],
    revoked: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.twoFactorSecret;
      return ret;
    }
  }
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for faster queries
// Note: email index is automatically created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get all user permissions (role + custom)
userSchema.methods.getAllPermissions = async function() {
  await this.populate([
    {
      path: 'role',
      populate: {
        path: 'permissions',
        select: 'name description resource action'
      }
    },
    {
      path: 'customPermissions.granted',
      select: 'name description resource action'
    },
    {
      path: 'customPermissions.revoked',
      select: 'name description resource action'
    }
  ]);

  const rolePermissions = this.role?.permissions || [];
  const grantedPermissions = this.customPermissions?.granted || [];
  const revokedPermissions = this.customPermissions?.revoked || [];

  // Start with role permissions
  let allPermissions = [...rolePermissions];

  // Add custom granted permissions
  grantedPermissions.forEach(permission => {
    if (!allPermissions.some(p => p._id.toString() === permission._id.toString())) {
      allPermissions.push(permission);
    }
  });

  // Remove revoked permissions
  allPermissions = allPermissions.filter(permission =>
    !revokedPermissions.some(revoked => revoked._id.toString() === permission._id.toString())
  );

  return allPermissions;
};

// Instance method to check if user has specific permission
userSchema.methods.hasPermission = async function(permissionName) {
  const permissions = await this.getAllPermissions();
  return permissions.some(permission => permission.name === permissionName);
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // If we've reached max attempts and it's not locked already, lock account
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockTime = parseInt(process.env.LOCKOUT_TIME) || 15; // minutes

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + (lockTime * 60 * 1000) };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Static method to find user with role and permissions populated
userSchema.statics.findWithRoleAndPermissions = function(filter = {}) {
  return this.find(filter).populate({
    path: 'role',
    populate: {
      path: 'permissions',
      select: 'name description resource action'
    }
  }).populate('customPermissions.granted customPermissions.revoked', 'name description resource action');
};

export default mongoose.model('User', userSchema);