import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import DemoPaymentGateway from '../components/payments/DemoPaymentGateway';
import { formatCurrency, formatDate } from '../utils/formatters';
import styles from './Payments.module.css';

const Payments = () => {
  const { isLandlord, isTenant } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filter, setFilter] = useState('all');

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

  const handlePaymentSuccess = (data) => {
    setSuccess('Payment processed successfully!');
    setSelectedPayment(null);
    fetchPayments();
  };

  const handlePaymentError = (errorMsg) => {
    setError(errorMsg);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return styles.statusPaid;
      case 'pending':
        return styles.statusPending;
      case 'processing':
        return styles.statusProcessing;
      case 'failed':
        return styles.statusFailed;
      case 'overdue':
        return styles.statusOverdue;
      default:
        return '';
    }
  };

  const isOverdue = (payment) => {
    return payment.status === 'pending' && new Date(payment.dueDate) < new Date();
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={styles.payments}>
      <div className={styles.header}>
        <div>
          <h1>Payments</h1>
          <p className={styles.subtitle}>
            {isLandlord ? 'Track rent payments' : 'Manage your payments'}
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className={styles.filters}>
        <button 
          className={filter === 'all' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'paid' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('paid')}
        >
          Paid
        </button>
        <button 
          className={filter === 'failed' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('failed')}
        >
          Failed
        </button>
      </div>

      {payments.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💳</div>
          <h2>No payments found</h2>
          <p>No payment records match your filter criteria</p>
        </div>
      ) : (
        <div className={styles.paymentsList}>
          {payments.map((payment) => (
            <Card key={payment._id} className={styles.paymentCard}>
              <div className={styles.paymentHeader}>
                <div>
                  <h3>{payment.property?.name || 'Property'}</h3>
                  <p className={styles.paymentDate}>
                    Due: {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div className={styles.paymentAmount}>
                  <span className={styles.amount}>
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className={`${styles.status} ${getStatusColor(payment.status)}`}>
                    {isOverdue(payment) ? 'Overdue' : payment.status}
                  </span>
                </div>
              </div>

              {payment.description && (
                <p className={styles.description}>{payment.description}</p>
              )}

              <div className={styles.paymentDetails}>
                {payment.tenant && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Tenant:</span>
                    <span>{payment.tenant.name}</span>
                  </div>
                )}
                {payment.paidDate && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Paid on:</span>
                    <span>{formatDate(payment.paidDate)}</span>
                  </div>
                )}
                {payment.receiptNumber && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Receipt:</span>
                    <span>{payment.receiptNumber}</span>
                  </div>
                )}
              </div>

              {payment.status === 'pending' && isTenant && (
                <div className={styles.actions}>
                  <Button 
                    onClick={() => setSelectedPayment(payment)}
                    fullWidth
                  >
                    Pay Now
                  </Button>
                </div>
              )}

              {payment.status === 'paid' && payment.receiptUrl && (
                <div className={styles.actions}>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`http://localhost:5000${payment.receiptUrl}`, '_blank')}
                    fullWidth
                  >
                    Download Receipt
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedPayment && (
        <div className={styles.modal} onClick={() => setSelectedPayment(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Process Payment</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setSelectedPayment(null)}
              >
                ×
              </button>
            </div>
            <DemoPaymentGateway
              paymentId={selectedPayment._id}
              amount={selectedPayment.amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
