// Check if user has the required role(s)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }

    next();
  };
};

// Check if user is landlord
exports.isLandlord = (req, res, next) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Access denied. Landlord only.' });
  }
  next();
};

// Check if user is tenant
exports.isTenant = (req, res, next) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Access denied. Tenant only.' });
  }
  next();
};
