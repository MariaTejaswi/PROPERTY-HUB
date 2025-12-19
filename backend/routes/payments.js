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
  getPaymentStats,
  generatePaymentFromLease,
  generatePaymentsForAllLeases,
  runPaymentScheduler
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Validation rules
const paymentValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('tenantId').custom((value, { req }) => {
    // Tenants pay as themselves; tenantId is ignored/filled server-side.
    if (req.user?.role === 'tenant') return true;
    if (!value) {
      throw new Error('Tenant ID is required');
    }
    return true;
  }),
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

// Generate payment from lease (landlord only)
router.post('/generate-from-lease', authorize('landlord'), generatePaymentFromLease);

// Generate payments for all active leases (landlord only)
router.post('/generate-all', authorize('landlord'), generatePaymentsForAllLeases);

// Run payment scheduler manually (landlord only)
router.post('/run-scheduler', authorize('landlord'), runPaymentScheduler);

// Get all payments
router.get('/', getPayments);

// Get single payment
router.get('/:id', getPayment);

// Get payment receipt
router.get('/:id/receipt', getReceipt);

// Create payment (landlord or tenant)
router.post(
  '/',
  authorize('landlord', 'tenant'),
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
