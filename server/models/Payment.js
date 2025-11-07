const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add payment amount'],
    min: 0
  },
  type: {
    type: String,
    enum: ['rent', 'deposit', 'late_fee', 'maintenance', 'other'],
    default: 'rent'
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'overdue', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['demo_card', 'cash', 'check', 'bank_transfer', 'other'],
    default: 'demo_card'
  },
  // Demo payment gateway fields
  demoPayment: {
    cardLast4: String,
    cardBrand: String,
    transactionId: String,
    processingTime: Number // milliseconds
  },
  // For future real payment gateway integration
  stripePaymentId: String,
  receiptUrl: String,
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: {
    type: String
  },
  lateFee: {
    amount: {
      type: Number,
      default: 0
    },
    applied: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Generate receipt number before saving
paymentSchema.pre('save', async function(next) {
  // Generate receipt number when status becomes 'paid' and no receipt number exists
  if (this.status === 'paid' && !this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.receiptNumber = `RCP-${year}${month}-${random}`;
  }
  next();
});

// Check if payment is overdue
paymentSchema.methods.isOverdue = function() {
  if (this.status === 'paid') return false;
  return new Date() > this.dueDate;
};

module.exports = mongoose.model('Payment', paymentSchema);
