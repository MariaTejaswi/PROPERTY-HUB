const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    // Find all messages where user is sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { recipients: req.user._id }
      ]
    })
      .populate('sender', 'name avatar email role')
      .populate('recipients', 'name avatar email role')
      .sort({ createdAt: -1 });
    
    // Group by conversation and get latest message
    const conversationMap = new Map();
    
    messages.forEach(message => {
      if (!conversationMap.has(message.conversation)) {
        // Count unread messages
        const isUnread = !message.isRead.some(
          read => read.user.toString() === req.user._id.toString()
        );
        
        conversationMap.set(message.conversation, {
          conversationId: message.conversation,
          latestMessage: message,
          unreadCount: isUnread && message.sender._id.toString() !== req.user._id.toString() ? 1 : 0
        });
      } else if (message.sender._id.toString() !== req.user._id.toString()) {
        const isUnread = !message.isRead.some(
          read => read.user.toString() === req.user._id.toString()
        );
        if (isUnread) {
          conversationMap.get(message.conversation).unreadCount++;
        }
      }
    });
    
    const conversations = Array.from(conversationMap.values());
    
    res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch conversations'
    });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId, userId, limit = 50, skip = 0 } = req.query;
    
    let query = {
      $or: [
        { sender: req.user._id },
        { recipients: req.user._id }
      ]
    };
    
    // Filter by conversation ID or generate from user IDs
    if (conversationId) {
      query.conversation = conversationId;
    } else if (userId) {
      const conversation = Message.generateConversationId([req.user._id.toString(), userId]);
      query.conversation = conversation;
    }
    
    const messages = await Message.find(query)
      .populate('sender', 'name avatar email role')
      .populate('recipients', 'name avatar email role')
      .populate('property', 'name')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    let recipientIds, subject, content, propertyId, relatedTo, relatedId;
    
    // recipientIds should already be parsed by middleware
    ({ recipientIds, subject, content, propertyId, relatedTo, relatedId } = req.body);
    
    if (!recipientIds || recipientIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one recipient is required' 
      });
    }
    
    // Content is optional if files are attached
    if ((!content || content.trim() === '') && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ 
        success: false,
        message: 'Message content or attachments required' 
      });
    }
    
    // Verify recipients exist
    const recipients = await User.find({ _id: { $in: recipientIds } });
    if (recipients.length !== recipientIds.length) {
      return res.status(400).json({ 
        success: false,
        message: 'One or more recipients not found' 
      });
    }
    
    // Generate conversation ID
    const participantIds = [req.user._id.toString(), ...recipientIds].sort();
    const conversationId = Message.generateConversationId(participantIds);
    
    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      recipients: recipientIds,
      subject,
      content: content || '',
      type: recipientIds.length > 1 ? 'group' : 'direct',
      relatedTo: relatedTo || 'general',
      relatedId,
      property: propertyId
    };
    
    // Handle attachments
    if (req.files && req.files.length > 0) {
      messageData.attachments = req.files.map(file => ({
        filename: file.originalname,
        url: file.path,
        size: file.size,
        mimeType: file.mimetype
      }));
    }
    
    const message = await Message.create(messageData);
    
    await message.populate('sender recipients', 'name avatar email role');
    
    // TODO: Send push notifications or email notifications to recipients
    
    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    // Check if user is a recipient
    const isRecipient = message.recipients.some(
      recipient => recipient.toString() === req.user._id.toString()
    );
    
    if (!isRecipient) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized' 
      });
    }
    
    await message.markAsRead(req.user._id);
    
    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all messages in conversation as read
// @route   PUT /api/messages/conversation/:conversationId/read
// @access  Private
exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({
      conversation: conversationId,
      recipients: req.user._id,
      'isRead.user': { $ne: req.user._id }
    });
    
    // Mark all as read
    await Promise.all(
      messages.map(message => message.markAsRead(req.user._id))
    );
    
    res.json({
      success: true,
      message: `${messages.length} messages marked as read`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only sender can delete message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    
    await message.deleteOne();
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipients: req.user._id,
      'isRead.user': { $ne: req.user._id }
    });
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
exports.searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { recipients: req.user._id }
      ],
      $or: [
        { subject: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('sender recipients', 'name avatar email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/reaction
// @access  Private
exports.addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is sender or recipient
    const isSender = message.sender.toString() === req.user._id.toString();
    const isRecipient = message.recipients.some(
      r => r.toString() === req.user._id.toString()
    );
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to react to this message' });
    }
    
    // Initialize reactions array if not exists
    if (!message.reactions) {
      message.reactions = [];
    }
    
    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString()
    );
    
    if (existingReactionIndex !== -1) {
      // Update existing reaction
      message.reactions[existingReactionIndex].emoji = emoji;
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji
      });
    }
    
    await message.save();
    
    res.json({
      success: true,
      message: 'Reaction added successfully',
      reactions: message.reactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
