const Payment = require('../models/Payment');
const Property = require('../models/Property');
const User = require('../models/User');
const Lease = require('../models/Lease');
const { processPayment, processRefund } = require('../utils/demoPayment');
const { sendPaymentReceipt } = require('../utils/emailService');
const { generatePaymentReceipt } = require('../utils/pdfGenerator');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'landlord') {
      query.landlord = req.user._id;
    } else if (req.user.role === 'tenant') {
      query.tenant = req.user._id;
    }
    
    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.propertyId) {
      query.property = req.query.propertyId;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    const payments = await Payment.find(query)
      .populate('property', 'name address')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('property', 'name address')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('lease');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check authorization
    const isAuthorized = 
      payment.tenant._id.toString() === req.user._id.toString() ||
      payment.landlord._id.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create payment record
// @route   POST /api/payments
// @access  Private (Landlord only)
exports.createPayment = async (req, res) => {
  try {
    const { propertyId, tenantId, amount, type, description, dueDate, leaseId } = req.body;
    
    // Verify property belongs to landlord
    const property = await Property.findById(propertyId);
    if (!property || property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Verify tenant
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'Invalid tenant' });
    }
    
    const payment = await Payment.create({
      property: propertyId,
      tenant: tenantId,
      landlord: req.user._id,
      lease: leaseId,
      amount,
      type: type || 'rent',
      description,
      dueDate,
      status: 'pending'
    });
    
    await payment.populate('property tenant landlord', 'name email');
    
    res.status(201).json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process demo payment
// @route   POST /api/payments/:id/process
// @access  Private (Tenant only)
exports.processPaymentDemo = async (req, res) => {
  try {
    const { cardNumber, expiryMonth, expiryYear, cvv, zipCode } = req.body;
    
    const payment = await Payment.findById(req.params.id)
      .populate('property', 'name address')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check authorization
    if (payment.tenant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if already paid
    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment already processed' });
    }
    
    // Update status to processing
    payment.status = 'processing';
    await payment.save();
    
    try {
      // Process payment through demo gateway
      const result = await processPayment({
        cardNumber,
        expiryMonth,
        expiryYear,
        cvv,
        amount: payment.amount,
        zipCode
      });
      
      // Update payment record with success
      payment.status = 'paid';
      payment.paidDate = new Date();
      payment.paymentMethod = 'demo_card';
      payment.demoPayment = {
        cardLast4: result.cardLast4,
        cardBrand: result.cardBrand,
        transactionId: result.transactionId,
        processingTime: result.processingTime
      };
      
      await payment.save();
      
      // Generate receipt (async, don't wait)
      generatePaymentReceipt(payment, payment.tenant, payment.landlord, payment.property)
        .then(receiptPath => {
          payment.receiptUrl = receiptPath;
          return payment.save();
        })
        .catch(err => console.error('Receipt generation error:', err));
      
      // Send receipt email (async, don't wait)
      sendPaymentReceipt(payment, payment.tenant, payment.property)
        .catch(err => console.error('Receipt email error:', err));
      
      res.json({
        success: true,
        message: 'Payment processed successfully',
        payment,
        transactionDetails: {
          transactionId: result.transactionId,
          cardBrand: result.cardBrand,
          cardLast4: result.cardLast4,
          processingTime: result.processingTime
        }
      });
    } catch (paymentError) {
      // Payment failed
      payment.status = 'failed';
      await payment.save();
      
      return res.status(400).json({
        success: false,
        message: paymentError.error || 'Payment failed',
        payment,
        error: paymentError
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment status
// @route   PUT /api/payments/:id
// @access  Private (Landlord only)
exports.updatePayment = async (req, res) => {
  try {
    let payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check authorization (landlord only)
    if (payment.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('property tenant landlord', 'name email');
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private (Landlord only)
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check authorization
    if (payment.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Don't allow deletion of paid payments
    if (payment.status === 'paid') {
      return res.status(400).json({ 
        message: 'Cannot delete completed payment. Consider issuing a refund instead.' 
      });
    }
    
    await payment.deleteOne();
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment receipt
// @route   GET /api/payments/:id/receipt
// @access  Private
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('property', 'name address')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check authorization
    const isAuthorized = 
      payment.tenant._id.toString() === req.user._id.toString() ||
      payment.landlord._id.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (payment.status !== 'paid') {
      return res.status(400).json({ message: 'Receipt not available for unpaid payment' });
    }
    
    // Generate receipt if not exists
    if (!payment.receiptUrl) {
      const receiptPath = await generatePaymentReceipt(
        payment,
        payment.tenant,
        payment.landlord,
        payment.property
      );
      payment.receiptUrl = receiptPath;
      await payment.save();
    }
    
    // Send file
    res.download(payment.receiptUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
exports.getPaymentStats = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'landlord') {
      query.landlord = req.user._id;
    } else if (req.user.role === 'tenant') {
      query.tenant = req.user._id;
    }
    
    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalPaid = stats.find(s => s._id === 'paid')?.total || 0;
    const totalPending = stats.find(s => s._id === 'pending')?.total || 0;
    const totalOverdue = stats.find(s => s._id === 'overdue')?.total || 0;
    
    res.json({
      success: true,
      stats: {
        totalPaid,
        totalPending,
        totalOverdue,
        details: stats
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
