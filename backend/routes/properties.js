const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../config/multer');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  assignTenant,
  removeTenant,
  assignManager
} = require('../controllers/propertyController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Validation rules
const propertyValidation = [
  body('name').notEmpty().trim().withMessage('Property name is required'),
  body('address.street').notEmpty().trim().withMessage('Street address is required'),
  body('address.city').notEmpty().trim().withMessage('City is required'),
  body('address.state').notEmpty().trim().withMessage('State is required'),
  body('address.zipCode').notEmpty().trim().withMessage('Zip code is required'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a positive number'),
  body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a positive number'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be a positive number')
];

// All routes are protected
router.use(protect);

// Get all properties (all roles)
router.get('/', getProperties);

// Get single property (all roles)
router.get('/:id', getProperty);

// Normalize multipart bracket fields to nested objects for validation
const normalizeMultipart = (req, _res, next) => {
  if (req.body) {
    const addr = {};
    for (const [k, v] of Object.entries(req.body)) {
      const m = k.match(/^address\[(.+)\]$/);
      if (m) addr[m[1]] = v;
    }
    if (Object.keys(addr).length) {
      req.body.address = { ...(req.body.address || {}), ...addr };
    }
  }
  next();
};

// Create property (landlord only)
router.post(
  '/',
  authorize('landlord'),
  upload.array('images', 10),
  normalizeMultipart,
  propertyValidation,
  validateRequest,
  createProperty
);

// Update property (landlord only)
router.put(
  '/:id',
  authorize('landlord'),
  upload.array('images', 10),
  updateProperty
);

// Delete property (landlord only)
router.delete('/:id', authorize('landlord'), deleteProperty);

// Assign tenant to property (landlord only)
router.put('/:id/tenant', authorize('landlord'), assignTenant);

// Remove tenant from property (landlord only)
router.delete('/:id/tenant', authorize('landlord'), removeTenant);

// Assign manager to property (landlord only)
router.put('/:id/manager', authorize('landlord'), assignManager);

module.exports = router;
