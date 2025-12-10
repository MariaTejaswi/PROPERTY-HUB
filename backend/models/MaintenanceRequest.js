const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Can be manager or contractor
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'on_hold', 'resolved', 'closed'],
    default: 'open'
  },
  images: [{
    type: String
  }],
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-set isUrgent based on priority
maintenanceRequestSchema.pre('save', function(next) {
  this.isUrgent = this.priority === 'urgent';
  next();
});

// Method to add comment
maintenanceRequestSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text: text,
    createdAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
