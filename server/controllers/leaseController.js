const Lease = require('../models/Lease');
const Property = require('../models/Property');
const User = require('../models/User');
const { sendLeaseExpiryReminder } = require('../utils/emailService');
const { generateLeaseDocument } = require('../utils/pdfGenerator');

// @desc    Get all leases
// @route   GET /api/leases
// @access  Private
exports.getLeases = async (req, res) => {
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
    
    const leases = await Lease.find(query)
      .populate('property', 'name address')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: leases.length,
      leases
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lease
// @route   GET /api/leases/:id
// @access  Private
exports.getLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'name address type bedrooms bathrooms')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone');
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check authorization
    const isAuthorized = 
      lease.tenant._id.toString() === req.user._id.toString() ||
      lease.landlord._id.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this lease' });
    }
    
    res.json(lease);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create lease
// @route   POST /api/leases
// @access  Private (Landlord only)
exports.createLease = async (req, res) => {
  try {
    const {
      propertyId,
      tenantId,
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      paymentDueDay,
      terms
    } = req.body;
    
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
    
    // Check for overlapping active leases
    const overlappingLease = await Lease.findOne({
      property: propertyId,
      status: { $in: ['active', 'pending'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });
    
    if (overlappingLease) {
      return res.status(400).json({ 
        message: 'Property already has an active or pending lease for this period' 
      });
    }
    
    const leaseData = {
      property: propertyId,
      landlord: req.user._id,
      tenant: tenantId,
      startDate,
      endDate,
      rentAmount,
      depositAmount: depositAmount || 0,
      paymentDueDay: paymentDueDay || 1,
      terms,
      status: 'draft'
    };
    
    // Handle uploaded document
    if (req.file) {
      leaseData.document = req.file.path;
    }
    
    const lease = await Lease.create(leaseData);
    await lease.populate('property tenant landlord', 'name email address');
    
    res.status(201).json({
      success: true,
      lease
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lease
// @route   PUT /api/leases/:id
// @access  Private (Landlord only)
exports.updateLease = async (req, res) => {
  try {
    let lease = await Lease.findById(req.params.id);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check authorization (landlord only)
    if (lease.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Don't allow updating active signed leases
    if (lease.status === 'active' && lease.isFullySigned) {
      return res.status(400).json({ 
        message: 'Cannot update active signed lease. Create a new lease instead.' 
      });
    }
    
    // Handle new document upload
    if (req.file) {
      req.body.document = req.file.path;
    }
    
    lease = await Lease.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('property tenant landlord', 'name email');
    
    res.json({
      success: true,
      lease
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete lease
// @route   DELETE /api/leases/:id
// @access  Private (Landlord only)
exports.deleteLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check authorization (landlord only)
    if (lease.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Don't allow deletion of active leases
    if (lease.status === 'active') {
      return res.status(400).json({ 
        message: 'Cannot delete active lease. Terminate it instead.' 
      });
    }
    
    await lease.deleteOne();
    
    res.json({
      success: true,
      message: 'Lease deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sign lease (Canvas signature)
// @route   POST /api/leases/:id/sign
// @access  Private
exports.signLease = async (req, res) => {
  try {
    const { signatureData } = req.body;
    
    if (!signatureData) {
      return res.status(400).json({ message: 'Signature data is required' });
    }
    
    const lease = await Lease.findById(req.params.id)
      .populate('property tenant landlord', 'name email');
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check authorization
    const isLandlord = lease.landlord._id.toString() === req.user._id.toString();
    const isTenant = lease.tenant._id.toString() === req.user._id.toString();
    
    if (!isLandlord && !isTenant) {
      return res.status(403).json({ message: 'Not authorized to sign this lease' });
    }
    
    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Sign lease
    if (isLandlord) {
      if (lease.signatures.landlord.signed) {
        return res.status(400).json({ message: 'Landlord has already signed this lease' });
      }
      lease.signatures.landlord = {
        signed: true,
        signatureData,
        signedAt: new Date(),
        ipAddress
      };
    }
    
    if (isTenant) {
      if (lease.signatures.tenant.signed) {
        return res.status(400).json({ message: 'Tenant has already signed this lease' });
      }
      lease.signatures.tenant = {
        signed: true,
        signatureData,
        signedAt: new Date(),
        ipAddress
      };
    }
    
    // Check if both parties have signed
    if (lease.signatures.landlord.signed && lease.signatures.tenant.signed) {
      lease.status = 'active';
      
      // Update property status
      const property = await Property.findById(lease.property);
      if (property) {
        property.currentTenant = lease.tenant._id;
        property.status = 'occupied';
        property.isAvailable = false;
        await property.save();
      }
      
      // Generate lease document (async, don't wait)
      generateLeaseDocument(lease, lease.landlord, lease.tenant, property)
        .then(docPath => {
          lease.document = docPath;
          return lease.save();
        })
        .catch(err => console.error('Lease document generation error:', err));
    } else {
      lease.status = 'pending';
    }
    
    await lease.save();
    
    res.json({
      success: true,
      message: 'Lease signed successfully',
      lease,
      fullySign: lease.isFullySigned
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Terminate lease
// @route   PUT /api/leases/:id/terminate
// @access  Private (Landlord only)
exports.terminateLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property');
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check authorization (landlord only)
    if (lease.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    lease.status = 'terminated';
    await lease.save();
    
    // Update property status
    if (lease.property) {
      lease.property.currentTenant = null;
      lease.property.status = 'available';
      lease.property.isAvailable = true;
      await lease.property.save();
    }
    
    res.json({
      success: true,
      message: 'Lease terminated successfully',
      lease
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expiring leases
// @route   GET /api/leases/expiring
// @access  Private (Landlord only)
exports.getExpiringLeases = async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 60;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const leases = await Lease.find({
      landlord: req.user._id,
      status: 'active',
      endDate: {
        $gte: new Date(),
        $lte: futureDate
      }
    })
      .populate('property', 'name address')
      .populate('tenant', 'name email phone')
      .sort({ endDate: 1 });
    
    res.json({
      success: true,
      count: leases.length,
      leases
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download lease document
// @route   GET /api/leases/:id/document
// @access  Private
exports.downloadLeaseDocument = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property tenant landlord');
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check authorization
    const isAuthorized = 
      lease.tenant._id.toString() === req.user._id.toString() ||
      lease.landlord._id.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (!lease.document) {
      // Generate document if not exists
      const docPath = await generateLeaseDocument(
        lease,
        lease.landlord,
        lease.tenant,
        lease.property
      );
      lease.document = docPath;
      await lease.save();
    }
    
    res.download(lease.document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
