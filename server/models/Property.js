const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a property name'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'USA'
    }
  },
  type: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'townhouse', 'other'],
    default: 'apartment'
  },
  description: {
    type: String,
    trim: true
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0
  },
  squareFeet: {
    type: Number,
    min: 0
  },
  yearBuilt: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  rentAmount: {
    type: Number,
    required: [true, 'Please add rent amount'],
    min: 0
  },
  depositAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for rent (alias for rentAmount)
propertySchema.virtual('rent').get(function() {
  return this.rentAmount;
});

// Virtual for tenant (alias for currentTenant)
propertySchema.virtual('tenant').get(function() {
  return this.currentTenant;
});

// Virtual for manager (alias for assignedManager)
propertySchema.virtual('manager').get(function() {
  return this.assignedManager;
});

// Index for search functionality
propertySchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });

module.exports = mongoose.model('Property', propertySchema);
