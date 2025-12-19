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

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Landlord creates payment records for their properties.
    if (req.user.role === 'landlord') {
      if (property.landlord.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }

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
      return res.status(201).json(payment);
    }

    // Tenant creates a payment record for themselves (to then process via demo gateway).
    if (req.user.role === 'tenant') {
      if (!property.landlord) {
        return res.status(400).json({ message: 'Property has no landlord assigned' });
      }

      // Only allow tenant to pay for the property they are currently assigned to.
      if (!property.currentTenant || property.currentTenant.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to pay for this property' });
      }

      const payment = await Payment.create({
        property: propertyId,
        tenant: req.user._id,
        landlord: property.landlord,
        lease: leaseId,
        amount,
        type: type || 'rent',
        description,
        dueDate,
        status: 'pending'
      });

      await payment.populate('property tenant landlord', 'name email');
      return res.status(201).json(payment);
    }

    return res.status(403).json({ message: 'Not authorized' });
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
      
      // Generate receipt number manually if not exists
      if (!payment.receiptNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        payment.receiptNumber = `RCP-${year}${month}-${random}`;
      }
      
      await payment.save();
      
      // Populate payment data before generating receipt
      await payment.populate(['tenant', 'landlord', 'property']);
      
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
    
    res.json(payment);
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
      // Generate receipt number if not exists
      if (!payment.receiptNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        payment.receiptNumber = `RCP-${year}${month}-${random}`;
        await payment.save();
      }
      
      const receiptPath = await generatePaymentReceipt(
        payment,
        payment.tenant,
        payment.landlord,
        payment.property
      );
      payment.receiptUrl = receiptPath;
      await payment.save();
    }
    
    // Convert URL path to file system path (handle leading slash safely)
    const path = require('path');
    const fs = require('fs');
    const relativeUrl = payment.receiptUrl.replace(/^\/+/, '');
    let filePath = path.join(__dirname, '..', relativeUrl);

    // If file missing but receiptUrl set, attempt regeneration once
    if (!fs.existsSync(filePath)) {
      // Ensure receipt number exists
      if (!payment.receiptNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        payment.receiptNumber = `RCP-${year}${month}-${random}`;
        await payment.save();
      }
      const regeneratedPath = await generatePaymentReceipt(
        payment,
        payment.tenant,
        payment.landlord,
        payment.property
      );
      payment.receiptUrl = regeneratedPath;
      await payment.save();
      const regeneratedRelative = regeneratedPath.replace(/^\/+/, '');
      filePath = path.join(__dirname, '..', regeneratedRelative);
    }

    // Send file
    res.download(filePath);
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

// @desc    Generate payment from lease
// @route   POST /api/payments/generate-from-lease
// @access  Private (Landlord only)
exports.generatePaymentFromLease = async (req, res) => {
  try {
    const { leaseId, month, year } = req.body;
    
    if (!leaseId) {
      return res.status(400).json({ message: 'Lease ID is required' });
    }
    
    const lease = await Lease.findById(leaseId)
      .populate('property')
      .populate('tenant')
      .populate('landlord');
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check if user is the landlord
    if (lease.landlord._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (lease.status !== 'active') {
      return res.status(400).json({ message: 'Lease must be active to generate payments' });
    }
    
    // Determine payment month/year
    const targetMonth = month !== undefined ? month : new Date().getMonth();
    const targetYear = year !== undefined ? year : new Date().getFullYear();
    
    // Check if payment already exists for this month
    const existingPayment = await Payment.findOne({
      lease: lease._id,
      dueDate: {
        $gte: new Date(targetYear, targetMonth, 1),
        $lt: new Date(targetYear, targetMonth + 1, 1)
      }
    });
    
    if (existingPayment) {
      return res.status(400).json({ 
        message: 'Payment already exists for this month',
        payment: existingPayment
      });
    }
    
    const dueDate = new Date(targetYear, targetMonth, lease.paymentDueDay);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const payment = new Payment({
      property: lease.property._id,
      tenant: lease.tenant._id,
      landlord: lease.landlord._id,
      lease: lease._id,
      amount: lease.rentAmount,
      type: 'rent',
      description: `Monthly rent for ${lease.property.name} - ${monthNames[targetMonth]} ${targetYear}`,
      dueDate: dueDate,
      status: 'pending'
    });
    
    await payment.save();
    
    const populatedPayment = await Payment.findById(payment._id)
      .populate('property', 'name address')
      .populate('tenant', 'name email')
      .populate('landlord', 'name email')
      .populate('lease');
    
    res.status(201).json({
      success: true,
      payment: populatedPayment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate payments for all active leases
// @route   POST /api/payments/generate-all
// @access  Private (Landlord only)
exports.generatePaymentsForAllLeases = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    const targetMonth = month !== undefined ? month : new Date().getMonth();
    const targetYear = year !== undefined ? year : new Date().getFullYear();
    
    // Find all active leases for this landlord
    const activeLeases = await Lease.find({
      landlord: req.user._id,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate('property tenant landlord');
    
    if (activeLeases.length === 0) {
      return res.status(404).json({ message: 'No active leases found' });
    }
    
    const results = {
      created: [],
      existing: [],
      errors: []
    };
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    for (const lease of activeLeases) {
      try {
        // Check if payment already exists
        const existingPayment = await Payment.findOne({
          lease: lease._id,
          dueDate: {
            $gte: new Date(targetYear, targetMonth, 1),
            $lt: new Date(targetYear, targetMonth + 1, 1)
          }
        });
        
        if (existingPayment) {
          results.existing.push({
            leaseId: lease._id,
            property: lease.property.name,
            payment: existingPayment
          });
          continue;
        }
        
        const dueDate = new Date(targetYear, targetMonth, lease.paymentDueDay);
        
        const payment = new Payment({
          property: lease.property._id,
          tenant: lease.tenant._id,
          landlord: lease.landlord._id,
          lease: lease._id,
          amount: lease.rentAmount,
          type: 'rent',
          description: `Monthly rent for ${lease.property.name} - ${monthNames[targetMonth]} ${targetYear}`,
          dueDate: dueDate,
          status: 'pending'
        });
        
        await payment.save();
        
        results.created.push({
          leaseId: lease._id,
          property: lease.property.name,
          payment: payment
        });
      } catch (error) {
        results.errors.push({
          leaseId: lease._id,
          property: lease.property.name,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Generated ${results.created.length} payments. ${results.existing.length} already existed. ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Run payment scheduler manually (admin/testing)
// @route   POST /api/payments/run-scheduler
// @access  Private (Landlord only)
exports.runPaymentScheduler = async (req, res) => {
  try {
    const { generateMonthlyPayments, updateOverduePayments } = require('../services/paymentScheduler');
    
    const generateResult = await generateMonthlyPayments();
    const overdueResult = await updateOverduePayments();
    
    res.json({
      success: true,
      results: {
        paymentsGenerated: generateResult,
        overdueUpdated: overdueResult
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
