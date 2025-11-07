import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import SignaturePad from '../components/leases/SignaturePad';
import { formatCurrency, formatDate } from '../utils/formatters';
import styles from './LeaseDetails.module.css';

const LeaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLandlord, isTenant } = useAuth();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchLease();
    // eslint-disable-next-line
  }, [id]);

  const fetchLease = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leases/${id}`);
      setLease(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lease details');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData) => {
    try {
      setSigning(true);
      const role = isLandlord ? 'landlord' : 'tenant';
      await api.post(`/leases/${id}/sign`, {
        signatureData,
        role
      });
      setShowSignModal(false);
      fetchLease();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save signature');
    } finally {
      setSigning(false);
    }
  };

  const canSign = () => {
    if (!lease || !lease.signatures) return false;
    if (isLandlord && !lease.signatures?.landlord?.signed) return true;
    if (isTenant && !lease.signatures?.tenant?.signed && lease.tenant._id === user.id) return true;
    return false;
  };

  const isFullySigned = () => {
    return lease?.signatures?.landlord?.signed && lease?.signatures?.tenant?.signed;
  };

  const downloadPDF = async () => {
    try {
      const response = await api.get(`/leases/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lease-${lease.property.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lease? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/leases/${id}`);
      navigate('/leases');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lease');
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error && !lease) {
    return (
      <div className={styles.leaseDetails}>
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/leases')}>Back to Leases</Button>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className={styles.leaseDetails}>
        <h1>Lease not found</h1>
        <Button onClick={() => navigate('/leases')}>Back to Leases</Button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className={styles.leaseDetails}>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/leases')}>
          ← Back to Leases
        </Button>
        <div className={styles.actions}>
          {isLandlord && lease.status === 'draft' && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/leases/${id}/edit`)}>
                Edit Lease
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
          {canSign() && (
            <Button onClick={() => setShowSignModal(true)}>
              Sign Lease
            </Button>
          )}
          <Button variant="secondary" onClick={downloadPDF}>
            Download PDF
          </Button>
        </div>
      </div>

      {isFullySigned() && (
        <div className={styles.fullySignedBanner}>
          <span className={styles.checkmark}>✓</span>
          This lease has been fully signed by both parties
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.mainInfo}>
          <Card>
            <div className={styles.leaseHeader}>
              <div>
                <h1 className={styles.title}>Lease Agreement</h1>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(lease.status) }}
                >
                  {lease.status}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Property Information">
            <div className={styles.propertyInfo}>
              <h3>{lease.property.name}</h3>
              <p>{lease.property.address.street}</p>
              <p>
                {lease.property.address.city}, {lease.property.address.state} {lease.property.address.zipCode}
              </p>
              <div className={styles.propertyDetails}>
                <span>{lease.property.bedrooms} bed</span>
                <span>•</span>
                <span>{lease.property.bathrooms} bath</span>
                <span>•</span>
                <span>{lease.property.squareFeet} sq ft</span>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/properties/${lease.property._id}`)}
                style={{ marginTop: '1rem' }}
              >
                View Property Details
              </Button>
            </div>
          </Card>

          <Card title="Lease Terms">
            <div className={styles.termsGrid}>
              <div className={styles.termItem}>
                <span className={styles.termLabel}>Monthly Rent</span>
                <span className={styles.termValue} style={{ color: '#6366F1', fontWeight: '600' }}>
                  {formatCurrency(lease.rentAmount)}
                </span>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termLabel}>Security Deposit</span>
                <span className={styles.termValue}>
                  {formatCurrency(lease.securityDeposit)}
                </span>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termLabel}>Start Date</span>
                <span className={styles.termValue}>{formatDate(lease.startDate)}</span>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termLabel}>End Date</span>
                <span className={styles.termValue}>{formatDate(lease.endDate)}</span>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termLabel}>Payment Due Day</span>
                <span className={styles.termValue}>Day {lease.paymentDueDay} of each month</span>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termLabel}>Late Fee</span>
                <span className={styles.termValue}>
                  {formatCurrency(lease.lateFee)} after {lease.gracePeriodDays} days
                </span>
              </div>
            </div>
          </Card>

          {lease.terms && (
            <Card title="Additional Terms & Conditions">
              <p className={styles.terms}>{lease.terms}</p>
            </Card>
          )}

          <Card title="Digital Signatures">
            <div className={styles.signatures}>
              <div className={styles.signatureSection}>
                <h4>Landlord Signature</h4>
                {lease.signatures?.landlord?.signed ? (
                  <div className={styles.signatureContainer}>
                    <img 
                      src={lease.signatures.landlord.signatureData} 
                      alt="Landlord Signature"
                      className={styles.signatureImage}
                    />
                    <p className={styles.signatureDate}>
                      Signed on {formatDate(lease.signatures.landlord.signedAt)}
                    </p>
                    <p className={styles.signedBy}>
                      {lease.landlord.name}
                    </p>
                  </div>
                ) : (
                  <div className={styles.unsignedBox}>
                    <p>Awaiting landlord signature</p>
                  </div>
                )}
              </div>

              <div className={styles.signatureSection}>
                <h4>Tenant Signature</h4>
                {lease.signatures?.tenant?.signed ? (
                  <div className={styles.signatureContainer}>
                    <img 
                      src={lease.signatures.tenant.signatureData} 
                      alt="Tenant Signature"
                      className={styles.signatureImage}
                    />
                    <p className={styles.signatureDate}>
                      Signed on {formatDate(lease.signatures.tenant.signedAt)}
                    </p>
                    <p className={styles.signedBy}>
                      {lease.tenant.name}
                    </p>
                  </div>
                ) : (
                  <div className={styles.unsignedBox}>
                    <p>Awaiting tenant signature</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card title="Landlord">
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {lease.landlord.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.userName}>{lease.landlord.name}</p>
                <p className={styles.userEmail}>{lease.landlord.email}</p>
                <p className={styles.userPhone}>{lease.landlord.phone || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card title="Tenant">
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {lease.tenant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.userName}>{lease.tenant.name}</p>
                <p className={styles.userEmail}>{lease.tenant.email}</p>
                <p className={styles.userPhone}>{lease.tenant.phone || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card title="Lease Duration">
            <div className={styles.duration}>
              <p>
                <strong>Start:</strong> {formatDate(lease.startDate)}
              </p>
              <p>
                <strong>End:</strong> {formatDate(lease.endDate)}
              </p>
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                {Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSignModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Sign Lease Agreement</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSignModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.signatureInstructions}>
                Please sign below using your mouse or touchscreen
              </p>
              <SignaturePad
                onSave={handleSign}
                loading={signing}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaseDetails;
