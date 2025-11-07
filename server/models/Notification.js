const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'payment_reminder',
      'payment_received',
      'payment_overdue',
      'maintenance_created',
      'maintenance_updated',
      'maintenance_completed',
      'lease_expiring',
      'lease_signed',
      'message_received',
      'property_assigned',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Property', 'Payment', 'MaintenanceRequest', 'Lease', 'Message'],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  return await this.create(data);
};

module.exports = mongoose.model('Notification', notificationSchema);
