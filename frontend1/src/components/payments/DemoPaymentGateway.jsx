import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import { TEST_CARDS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline';

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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Amount Display */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-100 mb-1">Payment Amount</p>
            <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
          </div>
          <CreditCardIcon className="h-12 w-12 text-primary-200" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Test Cards */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <span>🧪</span>
            <span>Test Cards (Demo Mode)</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              className="px-3 py-2 bg-white hover:bg-green-50 text-green-700 border border-green-300 rounded-lg text-xs font-medium transition-colors"
              onClick={() => fillTestCard(TEST_CARDS.SUCCESS)}
            >
              ✅ Success
            </button>
            <button 
              type="button"
              className="px-3 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-lg text-xs font-medium transition-colors"
              onClick={() => fillTestCard(TEST_CARDS.DECLINED)}
            >
              ❌ Declined
            </button>
            <button 
              type="button"
              className="px-3 py-2 bg-white hover:bg-orange-50 text-orange-700 border border-orange-300 rounded-lg text-xs font-medium transition-colors"
              onClick={() => fillTestCard(TEST_CARDS.INSUFFICIENT_FUNDS)}
            >
              💰 No Funds
            </button>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <input
                type="text"
                id="expiryMonth"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={handleChange}
                placeholder="MM"
                maxLength="2"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="text"
                id="expiryYear"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={handleChange}
                placeholder="YY"
                maxLength="2"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                maxLength="4"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="12345"
              maxLength="10"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <Button type="submit" fullWidth loading={processing}>
            {processing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
          <LockClosedIcon className="h-4 w-4" />
          <span>Secure demo payment - No real transactions</span>
        </div>
      </div>
    </div>
  );
};

export default DemoPaymentGateway;
