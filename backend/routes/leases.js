const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../config/multer');
const {
  getLeases,
  getLease,
  createLease,
  updateLease,
  deleteLease,
  signLease,
  terminateLease,
  getExpiringLeases,
  downloadLeaseDocument
} = require('../controllers/leaseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Validation rules
const leaseValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('tenantId').custom((value, { req }) => {
    if (req.user?.role === 'tenant') return true;
    if (!value) throw new Error('Tenant ID is required');
    return true;
  }),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('terms').notEmpty().trim().withMessage('Lease terms are required')
];

const signatureValidation = [
  body('signatureData').custom((value, { req }) => {
    if (req.file) return true;
    if (typeof value === 'string' && value.trim().length > 0) return true;
    throw new Error('Signature image is required');
  })
];

// All routes are protected
router.use(protect);

// Get expiring leases (landlord only)
router.get('/expiring', authorize('landlord'), getExpiringLeases);

// Get all leases
router.get('/', getLeases);

// Get single lease
router.get('/:id', getLease);

// Download lease document
router.get('/:id/document', downloadLeaseDocument);

// Create lease (landlord or tenant)
router.post(
  '/',
  authorize('landlord', 'tenant'),
  upload.single('document'),
  leaseValidation,
  validateRequest,
  createLease
);

// Update lease (landlord only)
router.put(
  '/:id',
  authorize('landlord'),
  upload.single('document'),
  updateLease
);

// Delete lease (landlord only)
router.delete('/:id', authorize('landlord'), deleteLease);

// Sign lease (landlord or tenant)
router.post(
  '/:id/sign',
  upload.single('signature'),
  signatureValidation,
  validateRequest,
  signLease
);

// Terminate lease (landlord only)
router.put('/:id/terminate', authorize('landlord'), terminateLease);

module.exports = router;
