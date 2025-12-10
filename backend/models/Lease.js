const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
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
  paymentDueDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    default: 1
  },
  terms: {
    type: String,
    required: true
  },
  document: {
    type: String // URL to uploaded lease document
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'expired', 'terminated'],
    default: 'draft'
  },
  signatures: {
    landlord: {
      signed: {
        type: Boolean,
        default: false
      },
      signatureData: String, // Base64 image data for canvas signature
      signedAt: Date,
      ipAddress: String
    },
    tenant: {
      signed: {
        type: Boolean,
        default: false
      },
      signatureData: String,
      signedAt: Date,
      ipAddress: String
    }
  },
  // DocuSign integration fields (for future use)
  docusign: {
    envelopeId: String,
    status: String,
    sentAt: Date,
    completedAt: Date
  },
  renewalReminder: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }
}, {
  timestamps: true
});

// Virtual to check if lease is fully signed
leaseSchema.virtual('isFullySigned').get(function() {
  return this.signatures.landlord.signed && this.signatures.tenant.signed;
});

// Method to check if lease is expiring soon (within 60 days)
leaseSchema.methods.isExpiringSoon = function() {
  const today = new Date();
  const daysUntilExpiry = Math.ceil((this.endDate - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 60 && daysUntilExpiry > 0;
};

module.exports = mongoose.model('Lease', leaseSchema);
