import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z]+\.[a-z]+$/, 'Permission name must follow format: resource.action (e.g., post.create)']
  },
  description: {
    type: String,
    required: [true, 'Permission description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true,
    lowercase: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    lowercase: true
  },
  isSystemPermission: {
    type: Boolean,
    default: false // System permissions cannot be deleted
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

// Pre-save middleware to extract resource and action from name
permissionSchema.pre('save', function(next) {
  if (this.name && this.name.includes('.')) {
    const [resource, action] = this.name.split('.');
    this.resource = resource;
    this.action = action;
  }
  next();
});

// Index for faster queries
// Note: name index is automatically created by unique: true
permissionSchema.index({ resource: 1, action: 1 });

export default mongoose.model('Permission', permissionSchema);