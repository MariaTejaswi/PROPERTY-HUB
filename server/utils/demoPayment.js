/**
 * Demo Payment Gateway
 * Simulates payment processing without actual payment integration
 */

// Test card numbers and their expected results
const TEST_CARDS = {
  '4242424242424242': { status: 'success', brand: 'Visa' },
  '4000000000000002': { status: 'declined', brand: 'Visa', error: 'Card declined' },
  '4000000000009995': { status: 'insufficient_funds', brand: 'Visa', error: 'Insufficient funds' },
  '4000000000000069': { status: 'expired', brand: 'Visa', error: 'Expired card' },
  '5555555555554444': { status: 'success', brand: 'Mastercard' },
  '378282246310005': { status: 'success', brand: 'Amex' },
  '6011111111111117': { status: 'success', brand: 'Discover' }
};

/**
 * Validate credit card number (Luhn algorithm)
 */
const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate expiry date
 */
const validateExpiryDate = (month, year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year, 10);
  
  // Handle 2-digit year
  const fullYear = expYear < 100 ? 2000 + expYear : expYear;
  
  if (expMonth < 1 || expMonth > 12) {
    return false;
  }
  
  if (fullYear < currentYear) {
    return false;
  }
  
  if (fullYear === currentYear && expMonth < currentMonth) {
    return false;
  }
  
  return true;
};

/**
 * Validate CVV
 */
const validateCVV = (cvv, cardBrand = 'Visa') => {
  const cvvLength = cardBrand === 'Amex' ? 4 : 3;
  return /^\d+$/.test(cvv) && cvv.length === cvvLength;
};

/**
 * Get card brand from card number
 */
const getCardBrand = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'Amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  
  return 'Unknown';
};

/**
 * Generate transaction ID
 */
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `TXN-${timestamp}-${random}`;
};

/**
 * Process demo payment
 */
const processPayment = async (paymentData) => {
  return new Promise((resolve, reject) => {
    const { cardNumber, expiryMonth, expiryYear, cvv, amount, zipCode } = paymentData;
    
    // Simulate processing delay (1-3 seconds)
    const processingTime = Math.floor(Math.random() * 2000) + 1000;
    
    setTimeout(() => {
      // Validate card number
      if (!validateCardNumber(cardNumber)) {
        return reject({
          status: 'failed',
          error: 'Invalid card number',
          processingTime
        });
      }
      
      // Validate expiry
      if (!validateExpiryDate(expiryMonth, expiryYear)) {
        return reject({
          status: 'failed',
          error: 'Invalid or expired card',
          processingTime
        });
      }
      
      // Validate CVV
      const cardBrand = getCardBrand(cardNumber);
      if (!validateCVV(cvv, cardBrand)) {
        return reject({
          status: 'failed',
          error: 'Invalid CVV',
          processingTime
        });
      }
      
      // Check test card outcomes
      const cleaned = cardNumber.replace(/\s/g, '');
      const testResult = TEST_CARDS[cleaned];
      
      if (testResult) {
        if (testResult.status === 'success') {
          return resolve({
            status: 'success',
            transactionId: generateTransactionId(),
            cardBrand: testResult.brand,
            cardLast4: cleaned.slice(-4),
            amount,
            processingTime,
            message: 'Payment processed successfully'
          });
        } else {
          return reject({
            status: testResult.status,
            error: testResult.error,
            cardBrand: testResult.brand,
            processingTime
          });
        }
      }
      
      // For unknown cards, randomly succeed or fail (80% success rate)
      const randomSuccess = Math.random() < 0.8;
      
      if (randomSuccess) {
        return resolve({
          status: 'success',
          transactionId: generateTransactionId(),
          cardBrand,
          cardLast4: cleaned.slice(-4),
          amount,
          processingTime,
          message: 'Payment processed successfully'
        });
      } else {
        return reject({
          status: 'failed',
          error: 'Payment declined',
          cardBrand,
          processingTime
        });
      }
    }, processingTime);
  });
};

/**
 * Process refund
 */
const processRefund = async (transactionId, amount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'success',
        refundId: `REF-${generateTransactionId()}`,
        transactionId,
        amount,
        message: 'Refund processed successfully'
      });
    }, 1000);
  });
};

module.exports = {
  processPayment,
  processRefund,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  getCardBrand,
  TEST_CARDS
};
