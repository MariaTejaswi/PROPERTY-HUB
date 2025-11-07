const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  subject: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  isRead: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['direct', 'group', 'system'],
    default: 'direct'
  },
  relatedTo: {
    type: String,
    enum: ['general', 'maintenance', 'payment', 'lease', 'property'],
    default: 'general'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipients: 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.isRead.some(read => read.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.isRead.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(userIds) {
  return userIds.sort().join('-');
};

module.exports = mongoose.model('Message', messageSchema);
