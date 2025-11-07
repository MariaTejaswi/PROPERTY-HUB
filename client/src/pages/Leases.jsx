import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import SignaturePad from '../components/leases/SignaturePad';
import { formatCurrency, formatDate } from '../utils/formatters';
import styles from './Leases.module.css';

const Leases = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signingLease, setSigningLease] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchLeases = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/leases', { params });
      setLeases(response.data.leases || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
      setError('Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData) => {
    if (!signingLease) return;

    try {
      const role = isLandlord ? 'landlord' : 'tenant';
      await api.post(`/leases/${signingLease._id}/sign`, {
        signatureData,
        role
      });
      
      setSuccess('Lease signed successfully!');
      setSigningLease(null);
      fetchLeases();
    } catch (error) {
      console.error('Error signing lease:', error);
      setError('Failed to sign lease');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'draft':
        return styles.statusDraft;
      case 'expired':
        return styles.statusExpired;
      default:
        return '';
    }
  };

  const canSign = (lease) => {
    if (isLandlord) {
      return !lease.signatures.landlordSignature;
    } else if (isTenant) {
      return !lease.signatures.tenantSignature && lease.tenant?._id === user.id;
    }
    return false;
  };

  const isFullySigned = (lease) => {
    return lease.signatures.landlordSignature && lease.signatures.tenantSignature;
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={styles.leases}>
      <div className={styles.header}>
        <div>
          <h1>Lease Agreements</h1>
          <p className={styles.subtitle}>
            {isLandlord ? 'Manage lease agreements' : 'Your lease agreements'}
          </p>
        </div>
        {isLandlord && (
          <Button onClick={() => navigate('/leases/new')}>
            + Create Lease
          </Button>
        )}
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
          className={filter === 'draft' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('draft')}
        >
          Draft
        </button>
        <button 
          className={filter === 'active' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={filter === 'expired' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('expired')}
        >
          Expired
        </button>
      </div>

      {leases.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📄</div>
          <h2>No lease agreements</h2>
          <p>
            {isLandlord 
              ? 'Create a lease agreement to get started' 
              : 'No lease agreements have been created yet'}
          </p>
          {isLandlord && (
            <Button onClick={() => navigate('/leases/new')}>
              Create Your First Lease
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.leasesList}>
          {leases.map((lease) => (
            <Card key={lease._id} className={styles.leaseCard}>
              <div className={styles.leaseHeader}>
                <div>
                  <h3>{lease.property?.name || 'Property'}</h3>
                  <p className={styles.address}>
                    {lease.property?.address?.street}, {lease.property?.address?.city}
                  </p>
                </div>
                <span className={`${styles.status} ${getStatusColor(lease.status)}`}>
                  {lease.status}
                </span>
              </div>

              <div className={styles.leaseInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Tenant:</span>
                  <span>{lease.tenant?.name || 'Tenant'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Rent Amount:</span>
                  <span className={styles.amount}>{formatCurrency(lease.rentAmount)}/month</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Security Deposit:</span>
                  <span>{formatCurrency(lease.depositAmount)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Start Date:</span>
                  <span>{formatDate(lease.startDate)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>End Date:</span>
                  <span>{formatDate(lease.endDate)}</span>
                </div>
              </div>

              <div className={styles.signatures}>
                <h4>Signatures</h4>
                <div className={styles.signatureRow}>
                  <span className={styles.sigLabel}>Landlord:</span>
                  {lease.signatures.landlordSignature ? (
                    <span className={styles.signed}>✓ Signed on {formatDate(lease.signatures.landlordSignedAt)}</span>
                  ) : (
                    <span className={styles.pending}>Pending</span>
                  )}
                </div>
                <div className={styles.signatureRow}>
                  <span className={styles.sigLabel}>Tenant:</span>
                  {lease.signatures.tenantSignature ? (
                    <span className={styles.signed}>✓ Signed on {formatDate(lease.signatures.tenantSignedAt)}</span>
                  ) : (
                    <span className={styles.pending}>Pending</span>
                  )}
                </div>
              </div>

              {isFullySigned(lease) && (
                <div className={styles.fullySignedBanner}>
                  ✓ Fully Signed - Agreement Active
                </div>
              )}

              <div className={styles.actions}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/leases/${lease._id}`)}
                  fullWidth
                >
                  View Details
                </Button>
                
                {canSign(lease) && (
                  <Button 
                    size="sm"
                    onClick={() => setSigningLease(lease)}
                  >
                    Sign Lease
                  </Button>
                )}
                
                {isFullySigned(lease) && lease.pdfUrl && (
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`http://localhost:5000${lease.pdfUrl}`, '_blank')}
                  >
                    Download PDF
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {signingLease && (
        <div className={styles.modal} onClick={() => setSigningLease(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Sign Lease Agreement</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setSigningLease(null)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.signInstructions}>
                Please sign below using your mouse or touch screen. Your signature will be legally binding.
              </p>
              
              <SignaturePad 
                onSave={handleSign}
                onClear={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leases;
