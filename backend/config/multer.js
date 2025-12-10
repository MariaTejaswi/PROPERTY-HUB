const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['properties', 'leases', 'maintenance', 'messages'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on route
    if (req.baseUrl.includes('/properties')) {
      uploadPath += 'properties/';
    } else if (req.baseUrl.includes('/leases')) {
      uploadPath += 'leases/';
    } else if (req.baseUrl.includes('/maintenance')) {
      uploadPath += 'maintenance/';
    } else if (req.baseUrl.includes('/messages')) {
      uploadPath += 'messages/';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 524288000 // 500MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;
