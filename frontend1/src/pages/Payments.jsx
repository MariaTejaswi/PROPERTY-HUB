import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import DemoPaymentGateway from '../components/payments/DemoPaymentGateway';
import { formatCurrency, formatDate } from '../utils/formatters';

const Payments = () => {
  const { isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filter, setFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/payments', { params });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess('Payment processed successfully!');
    setSelectedPayment(null);
    fetchPayments();
  };

  const handlePaymentError = (errorMsg) => {
    setError(errorMsg);
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/payments/${paymentId}`);
      setSuccess('Payment record deleted successfully');
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      setError(error.response?.data?.message || 'Failed to delete payment');
    }
  };

  const handleGenerateAllPayments = async () => {
    if (!window.confirm('Generate rent payments for all active leases for this month?')) {
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const currentDate = new Date();
      const response = await api.post('/payments/generate-all', {
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      });

      const { created = [], existing = [], errors = [] } = response.data.results || {};
      
      let message = '';
      if (created.length > 0) {
        message += `✅ Generated ${created.length} new payment(s). `;
      }
      if (existing.length > 0) {
        message += `ℹ️ ${existing.length} payment(s) already exist. `;
      }
      if (errors.length > 0) {
        message += `⚠️ ${errors.length} error(s) occurred.`;
      }

      setSuccess(message || response.data.message);
      fetchPayments();
    } catch (error) {
      console.error('Error generating payments:', error);
      setError(error.response?.data?.message || 'Failed to generate payments');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setError('Failed to download receipt');
    }
  };

  const isOverdue = (payment) => {
    return payment.status === 'pending' && new Date(payment.dueDate) < new Date();
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              {isLandlord ? 'Track rent payments' : 'Manage your payments'}
            </p>
          </div>
          {isLandlord && (
            <div className="flex gap-3">
              <button 
                className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateAllPayments}
                disabled={generating}
              >
                {generating ? 'Generating...' : '🔄 Generate Monthly Payments'}
              </button>
              <button 
                className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                onClick={() => navigate('/payments/new')}
              >
                + Create Payment
              </button>
            </div>
          )}
        </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="flex gap-2 mb-6">
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'paid' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('paid')}
        >
          Paid
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'failed' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('failed')}
        >
          Failed
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">💳</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No payments found</h2>
          <p className="text-gray-600">No payment records match your filter criteria</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {payments.map((payment) => (
            <div key={payment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{payment.property?.name || 'Property'}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Due: {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                    isOverdue(payment) ? 'bg-red-100 text-red-800' :
                    payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {isOverdue(payment) ? 'Overdue' : payment.status}
                  </span>
                </div>
              </div>

              {payment.description && (
                <p className="text-gray-700 text-sm mb-4">{payment.description}</p>
              )}

              <div className="space-y-2 mb-4 text-sm">
                {payment.tenant && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tenant:</span>
                    <span className="font-medium text-gray-900">{payment.tenant.name}</span>
                  </div>
                )}
                {payment.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid on:</span>
                    <span className="font-medium text-gray-900">{formatDate(payment.paidDate)}</span>
                  </div>
                )}
                {payment.receiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receipt:</span>
                    <span className="font-medium text-gray-900">{payment.receiptNumber}</span>
                  </div>
                )}
              </div>

              {payment.status === 'pending' && isTenant && (
                <div className="pt-4 border-t border-gray-200">
                  <button 
                    className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    Pay Now
                  </button>
                </div>
              )}

              {isLandlord && payment.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button 
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => navigate(`/payments/${payment._id}/edit`)}
                  >
                    Edit
                  </button>
                  <button 
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                    onClick={() => handleDelete(payment._id)}
                  >
                    Delete
                  </button>
                </div>
              )}

              {payment.status === 'paid' && (
                <div className="pt-4 border-t border-gray-200">
                  <button 
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => handleDownloadReceipt(payment._id)}
                  >
                    Download Receipt
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Process Payment</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                onClick={() => setSelectedPayment(null)}
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <DemoPaymentGateway
                paymentId={selectedPayment._id}
                amount={selectedPayment.amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Payments;
