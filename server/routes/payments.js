const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const {
  getPayments,
  getPayment,
  createPayment,
  processPaymentDemo,
  updatePayment,
  deletePayment,
  getReceipt,
  getPaymentStats
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Validation rules
const paymentValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('tenantId').notEmpty().withMessage('Tenant ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
];

const processPaymentValidation = [
  body('cardNumber').notEmpty().withMessage('Card number is required'),
  body('expiryMonth').isInt({ min: 1, max: 12 }).withMessage('Valid expiry month is required'),
  body('expiryYear').isInt({ min: 0 }).withMessage('Valid expiry year is required'),
  body('cvv').isLength({ min: 3, max: 4 }).withMessage('Valid CVV is required')
];

// All routes are protected
router.use(protect);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Get all payments
router.get('/', getPayments);

// Get single payment
router.get('/:id', getPayment);

// Get payment receipt
router.get('/:id/receipt', getReceipt);

// Create payment (landlord only)
router.post(
  '/',
  authorize('landlord'),
  paymentValidation,
  validateRequest,
  createPayment
);

// Process payment with demo gateway (tenant only)
router.post(
  '/:id/process',
  authorize('tenant'),
  processPaymentValidation,
  validateRequest,
  processPaymentDemo
);

// Update payment (landlord only)
router.put('/:id', authorize('landlord'), updatePayment);

// Delete payment (landlord only)
router.delete('/:id', authorize('landlord'), deletePayment);

module.exports = router;
