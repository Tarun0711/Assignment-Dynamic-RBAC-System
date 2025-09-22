import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Role name must be at least 2 characters long'],
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isSystemRole: {
    type: Boolean,
    default: false // System roles like SuperAdmin cannot be deleted
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual to get users with this role
roleSchema.virtual('usersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
  count: true
});

// Index for faster queries
// Note: name index is automatically created by unique: true
roleSchema.index({ isActive: 1 });

// Static method to find role with permissions populated
roleSchema.statics.findWithPermissions = function(filter = {}) {
  return this.find(filter).populate('permissions', 'name description resource action');
};

// Instance method to check if role has specific permission
roleSchema.methods.hasPermission = function(permissionName) {
  return this.permissions.some(permission => 
    permission.name === permissionName || permission._id.toString() === permissionName
  );
};

// Instance method to add permissions
roleSchema.methods.addPermissions = function(permissionIds) {
  const newPermissions = permissionIds.filter(id => 
    !this.permissions.some(existingId => existingId.toString() === id.toString())
  );
  this.permissions.push(...newPermissions);
  return this.save();
};

// Instance method to remove permissions
roleSchema.methods.removePermissions = function(permissionIds) {
  this.permissions = this.permissions.filter(id => 
    !permissionIds.some(removeId => removeId.toString() === id.toString())
  );
  return this.save();
};

export default mongoose.model('Role', roleSchema);