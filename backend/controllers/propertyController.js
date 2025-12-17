const Property = require('../models/Property');
const User = require('../models/User');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private
exports.getProperties = async (req, res) => {
  try {
    console.log('GET /api/properties - User:', req.user?._id, 'Role:', req.user?.role);
    
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'landlord') {
      query.landlord = req.user._id;
    } else if (req.user.role === 'tenant') {
      query.currentTenant = req.user._id;
    } else if (req.user.role === 'manager') {
      query.assignedManager = req.user._id;
    }
    
    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { 'address.city': { $regex: req.query.search, $options: 'i' } },
        { 'address.state': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    console.log('Property query:', JSON.stringify(query));
    
    const properties = await Property.find(query)
      .populate('landlord', 'name email phone')
      .populate('currentTenant', 'name email phone')
      .populate('assignedManager', 'name email phone')
      .sort({ createdAt: -1 });
    
    console.log('Properties found:', properties.length);
    
    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Get properties error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Private
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name email phone')
      .populate('currentTenant', 'name email phone')
      .populate('assignedManager', 'name email phone');
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check authorization - allow landlord, assigned tenant, and assigned manager
    const isAuthorized = 
      req.user.role === 'landlord' && property.landlord._id.toString() === req.user._id.toString() ||
      req.user.role === 'tenant' && property.currentTenant && property.currentTenant._id.toString() === req.user._id.toString() ||
      req.user.role === 'manager' && property.assignedManager && property.assignedManager._id.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this property' });
    }
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create property
// @route   POST /api/properties
// @access  Private (Landlord only)
exports.createProperty = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      landlord: req.user._id
    };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      propertyData.images = req.files.map(file => file.path);
    }
    
    const property = await Property.create(propertyData);
    
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Landlord only)
exports.updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }
    
    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      req.body.images = [...(property.images || []), ...newImages];
    }
    
    property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('landlord currentTenant assignedManager', 'name email phone');
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Landlord only)
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }
    
    // Check if property has active tenant
    if (property.currentTenant) {
      return res.status(400).json({ 
        message: 'Cannot delete property with active tenant. Please remove tenant first.' 
      });
    }
    
    await property.deleteOne();
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign tenant to property
// @route   PUT /api/properties/:id/tenant
// @access  Private (Landlord only)
exports.assignTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;
    
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if tenant exists and has correct role
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'Invalid tenant' });
    }
    
    property.currentTenant = tenantId;
    property.status = 'occupied';
    property.isAvailable = false;
    
    await property.save();
    
    await property.populate('currentTenant', 'name email phone');
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove tenant from property
// @route   DELETE /api/properties/:id/tenant
// @access  Private (Landlord only)
exports.removeTenant = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    property.currentTenant = null;
    property.status = 'available';
    property.isAvailable = true;
    
    await property.save();
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign manager to property
// @route   PUT /api/properties/:id/manager
// @access  Private (Landlord only)
exports.assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if manager exists and has correct role
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid manager' });
    }
    
    property.assignedManager = managerId;
    await property.save();
    
    await property.populate('assignedManager', 'name email phone');
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
