const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../config/multer');
const {
  getMaintenanceRequests,
  getMaintenanceRequest,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  addComment,
  assignRequest,
  getMaintenanceStats
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Validation rules
const maintenanceValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').notEmpty().trim().withMessage('Description is required')
];

const commentValidation = [
  body('text').notEmpty().trim().withMessage('Comment text is required')
];

// All routes are protected
router.use(protect);

// Get maintenance statistics
router.get('/stats', getMaintenanceStats);

// Get all maintenance requests
router.get('/', getMaintenanceRequests);

// Get single maintenance request
router.get('/:id', getMaintenanceRequest);

// Create maintenance request (tenant only)
router.post(
  '/',
  authorize('tenant'),
  upload.array('images', 5),
  maintenanceValidation,
  validateRequest,
  createMaintenanceRequest
);

// Update maintenance request
router.put(
  '/:id',
  upload.array('images', 5),
  updateMaintenanceRequest
);

// Delete maintenance request (landlord only)
router.delete('/:id', authorize('landlord'), deleteMaintenanceRequest);

// Add comment to maintenance request
router.post(
  '/:id/comments',
  commentValidation,
  validateRequest,
  addComment
);

// Assign maintenance request to manager (landlord only)
router.put('/:id/assign', authorize('landlord'), assignRequest);

module.exports = router;
