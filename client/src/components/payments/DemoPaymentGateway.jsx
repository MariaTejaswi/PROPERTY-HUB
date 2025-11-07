import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import { TEST_CARDS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import styles from './DemoPaymentGateway.module.css';

const DemoPaymentGateway = ({ paymentId, amount, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    zipCode: ''
  });
  const [processing, setProcessing] = useState(false);

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Format card number with spaces
    if (e.target.name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const response = await api.post(`/payments/${paymentId}/process`, {
        ...formData,
        cardNumber: formData.cardNumber.replace(/\s/g, '')
      });
      
      onSuccess(response.data);
    } catch (error) {
      onError(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const fillTestCard = (cardNumber) => {
    setFormData({
      cardNumber,
      expiryMonth: '12',
      expiryYear: '26',
      cvv: '123',
      zipCode: '12345'
    });
  };

  return (
    <div className={styles.gateway}>
      <div className={styles.amount}>
        <span className={styles.amountLabel}>Payment Amount</span>
        <span className={styles.amountValue}>{formatCurrency(amount)}</span>
      </div>

      <div className={styles.testCards}>
        <p className={styles.testCardsTitle}>🧪 Test Cards (Demo Mode)</p>
        <div className={styles.testCardButtons}>
          <button 
            type="button"
            className={styles.testCardBtn}
            onClick={() => fillTestCard(TEST_CARDS.SUCCESS)}
          >
            ✅ Success
          </button>
          <button 
            type="button"
            className={styles.testCardBtn}
            onClick={() => fillTestCard(TEST_CARDS.DECLINED)}
          >
            ❌ Declined
          </button>
          <button 
            type="button"
            className={styles.testCardBtn}
            onClick={() => fillTestCard(TEST_CARDS.INSUFFICIENT_FUNDS)}
          >
            💰 No Funds
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="cardNumber">Card Number</label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            maxLength="19"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label htmlFor="expiryMonth">Expiry Month</label>
            <input
              type="text"
              id="expiryMonth"
              name="expiryMonth"
              value={formData.expiryMonth}
              onChange={handleChange}
              placeholder="MM"
              maxLength="2"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="expiryYear">Expiry Year</label>
            <input
              type="text"
              id="expiryYear"
              name="expiryYear"
              value={formData.expiryYear}
              onChange={handleChange}
              placeholder="YY"
              maxLength="2"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="cvv">CVV</label>
            <input
              type="text"
              id="cvv"
              name="cvv"
              value={formData.cvv}
              onChange={handleChange}
              placeholder="123"
              maxLength="4"
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="zipCode">ZIP Code</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="12345"
            maxLength="10"
            required
            className={styles.input}
          />
        </div>

        <Button type="submit" fullWidth loading={processing}>
          {processing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
        </Button>
      </form>

      <div className={styles.secure}>
        <span>🔒</span>
        <span>Secure demo payment - No real transactions</span>
      </div>
    </div>
  );
};

export default DemoPaymentGateway;
