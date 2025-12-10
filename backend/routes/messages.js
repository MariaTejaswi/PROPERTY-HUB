const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../config/multer');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  markConversationAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  addReaction
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Middleware to parse recipientIds from string to array if needed
const parseRecipientIds = (req, res, next) => {
  if (req.body.recipientIds && typeof req.body.recipientIds === 'string') {
    try {
      req.body.recipientIds = JSON.parse(req.body.recipientIds);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipientIds format'
      });
    }
  }
  next();
};

// Validation rules
const messageValidation = [
  body('recipientIds').isArray({ min: 1 }).withMessage('At least one recipient is required')
];

// All routes are protected
router.use(protect);

// Get unread message count
router.get('/unread/count', getUnreadCount);

// Search messages
router.get('/search', searchMessages);

// Get all conversations
router.get('/conversations', getConversations);

// Mark conversation as read
router.put('/conversation/:conversationId/read', markConversationAsRead);

// Get messages
router.get('/', getMessages);

// Send message
router.post(
  '/',
  upload.array('attachments', 3),
  parseRecipientIds,
  messageValidation,
  validateRequest,
  sendMessage
);

// Mark message as read
router.put('/:id/read', markAsRead);

// Add reaction to message
router.post('/:id/reaction', addReaction);

// Delete message
router.delete('/:id', deleteMessage);

module.exports = router;
