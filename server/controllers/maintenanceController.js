const MaintenanceRequest = require('../models/MaintenanceRequest');
const Property = require('../models/Property');
const User = require('../models/User');
const { sendMaintenanceNotification } = require('../utils/emailService');

// @desc    Get all maintenance requests
// @route   GET /api/maintenance
// @access  Private
exports.getMaintenanceRequests = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'landlord') {
      query.landlord = req.user._id;
    } else if (req.user.role === 'tenant') {
      query.tenant = req.user._id;
    } else if (req.user.role === 'manager') {
      query.$or = [
        { assignedTo: req.user._id },
        { landlord: req.user._id } // If manager also has landlord access
      ];
    }
    
    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    if (req.query.propertyId) {
      query.property = req.query.propertyId;
    }
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    const requests = await MaintenanceRequest.find(query)
      .populate('property', 'name address')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email')
      .populate('assignedTo', 'name email phone')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single maintenance request
// @route   GET /api/maintenance/:id
// @access  Private
exports.getMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('property', 'name address')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('comments.user', 'name avatar');
    
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }
    
    // Check authorization
    const isAuthorized = 
      request.tenant._id.toString() === req.user._id.toString() ||
      request.landlord._id.toString() === req.user._id.toString() ||
      (request.assignedTo && request.assignedTo._id.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create maintenance request
// @route   POST /api/maintenance
// @access  Private (Tenant only)
exports.createMaintenanceRequest = async (req, res) => {
  try {
    const { propertyId, title, description, category, priority } = req.body;
    
    // Get property and verify tenant
    const property = await Property.findById(propertyId)
      .populate('landlord', 'name email');
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Verify user is tenant of this property
    if (req.user.role === 'tenant' && 
        (!property.currentTenant || property.currentTenant.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not a tenant of this property' });
    }
    
    const requestData = {
      property: propertyId,
      tenant: req.user._id,
      landlord: property.landlord._id,
      title,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open'
    };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      requestData.images = req.files.map(file => file.path);
    }
    
    const request = await MaintenanceRequest.create(requestData);
    
    await request.populate('property tenant landlord', 'name email address');
    
    // Send notification to landlord (async, don't wait)
    sendMaintenanceNotification(request, property.landlord, req.user, property)
      .catch(err => console.error('Maintenance notification error:', err));
    
    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update maintenance request
// @route   PUT /api/maintenance/:id
// @access  Private
exports.updateMaintenanceRequest = async (req, res) => {
  try {
    let request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }
    
    // Check authorization
    const isLandlord = request.landlord.toString() === req.user._id.toString();
    const isAssignedManager = request.assignedTo && request.assignedTo.toString() === req.user._id.toString();
    const isTenant = request.tenant.toString() === req.user._id.toString();
    
    if (!isLandlord && !isAssignedManager && !isTenant) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Tenants can only update description and add images
    if (isTenant && !isLandlord && !isAssignedManager) {
      const allowedUpdates = ['description'];
      const updates = Object.keys(req.body);
      const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
      
      if (!isValidUpdate) {
        return res.status(400).json({ message: 'Tenants can only update description' });
      }
    }
    
    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      req.body.images = [...(request.images || []), ...newImages];
    }
    
    // Update completed date if status changed to resolved/closed
    if (req.body.status && ['resolved', 'closed'].includes(req.body.status) && !request.completedDate) {
      req.body.completedDate = new Date();
    }
    
    request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('property tenant landlord assignedTo', 'name email');
    
    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete maintenance request
// @route   DELETE /api/maintenance/:id
// @access  Private (Landlord only)
exports.deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }
    
    // Check authorization (landlord only)
    if (request.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }
    
    await request.deleteOne();
    
    res.json({
      success: true,
      message: 'Maintenance request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to maintenance request
// @route   POST /api/maintenance/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    const request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }
    
    // Check authorization
    const isAuthorized = 
      request.tenant.toString() === req.user._id.toString() ||
      request.landlord.toString() === req.user._id.toString() ||
      (request.assignedTo && request.assignedTo.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await request.addComment(req.user._id, text);
    
    await request.populate('comments.user', 'name avatar');
    
    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign maintenance request to manager
// @route   PUT /api/maintenance/:id/assign
// @access  Private (Landlord only)
exports.assignRequest = async (req, res) => {
  try {
    const { managerId } = req.body;
    
    const request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }
    
    // Check authorization (landlord only)
    if (request.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Verify manager exists
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid manager' });
    }
    
    request.assignedTo = managerId;
    request.status = 'in_progress';
    await request.save();
    
    await request.populate('assignedTo', 'name email phone');
    
    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get maintenance statistics
// @route   GET /api/maintenance/stats
// @access  Private
exports.getMaintenanceStats = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'landlord') {
      query.landlord = req.user._id;
    } else if (req.user.role === 'tenant') {
      query.tenant = req.user._id;
    } else if (req.user.role === 'manager') {
      query.assignedTo = req.user._id;
    }
    
    const stats = await MaintenanceRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const priorityStats = await MaintenanceRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byPriority: priorityStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
