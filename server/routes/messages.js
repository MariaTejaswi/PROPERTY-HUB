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
  searchMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Validation rules
const messageValidation = [
  body('recipientIds').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('content').notEmpty().trim().withMessage('Message content is required')
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
  messageValidation,
  validateRequest,
  sendMessage
);

// Mark message as read
router.put('/:id/read', markAsRead);

// Delete message
router.delete('/:id', deleteMessage);

module.exports = router;
