/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format datetime
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate days between dates
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if date is past
 */
export const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert snake_case to Title Case
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

/**
 * Truncate text
 */
export const truncate = (str, length = 50) => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate random color
 */
export const getRandomColor = () => {
  const colors = [
    'var(--primary)',
    'var(--secondary)',
    'var(--accent)',
    'var(--success)',
    'var(--warning)',
    'var(--info)'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone
 */
export const isValidPhone = (phone) => {
  const re = /^\d{10}$/;
  return re.test(phone.replace(/\D/g, ''));
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  const statusColors = {
    // Payment statuses
    paid: 'var(--success)',
    pending: 'var(--warning)',
    overdue: 'var(--error)',
    failed: 'var(--error)',
    processing: 'var(--info)',
    refunded: 'var(--text-secondary)',
    
    // Maintenance statuses
    open: 'var(--warning)',
    in_progress: 'var(--info)',
    on_hold: 'var(--text-secondary)',
    resolved: 'var(--success)',
    closed: 'var(--text-light)',
    
    // Lease statuses
    draft: 'var(--text-secondary)',
    active: 'var(--success)',
    expired: 'var(--error)',
    terminated: 'var(--text-light)',
    
    // Property statuses
    available: 'var(--success)',
    occupied: 'var(--info)',
    maintenance: 'var(--warning)',
    
    // Priorities
    low: 'var(--success)',
    medium: 'var(--warning)',
    high: 'var(--error)',
    urgent: 'var(--accent)'
  };
  
  return statusColors[status?.toLowerCase()] || 'var(--text-secondary)';
};
