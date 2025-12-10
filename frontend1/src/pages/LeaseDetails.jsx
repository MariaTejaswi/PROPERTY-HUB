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
      console.error('Error downloading PDF:', err);
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
      <div className="">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/leases')}>Back to Leases</Button>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="">
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
    <div className="">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="">
        <Button variant="secondary" onClick={() => navigate('/leases')}>
          ← Back to Leases
        </Button>
        <div className="">
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
        <div className="">
          <span className="">✓</span>
          This lease has been fully signed by both parties
        </div>
      )}

      <div className="">
        <div className="">
          <Card>
            <div className="">
              <div>
                <h1 className="">Lease Agreement</h1>
                <span 
                  className=""
                  style={{ backgroundColor: getStatusColor(lease.status) }}
                >
                  {lease.status}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Property Information">
            <div className="">
              <h3>{lease.property.name}</h3>
              <p>{lease.property.address.street}</p>
              <p>
                {lease.property.address.city}, {lease.property.address.state} {lease.property.address.zipCode}
              </p>
              <div className="">
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
            <div className="">
              <div className="">
                <span className="">Monthly Rent</span>
                <span className="" style={{ color: '#6366F1', fontWeight: '600' }}>
                  {formatCurrency(lease.rentAmount)}
                </span>
              </div>
              <div className="">
                <span className="">Security Deposit</span>
                <span className="">
                  {formatCurrency(lease.securityDeposit)}
                </span>
              </div>
              <div className="">
                <span className="">Start Date</span>
                <span className="">{formatDate(lease.startDate)}</span>
              </div>
              <div className="">
                <span className="">End Date</span>
                <span className="">{formatDate(lease.endDate)}</span>
              </div>
              <div className="">
                <span className="">Payment Due Day</span>
                <span className="">Day {lease.paymentDueDay} of each month</span>
              </div>
              <div className="">
                <span className="">Late Fee</span>
                <span className="">
                  {formatCurrency(lease.lateFee)} after {lease.gracePeriodDays} days
                </span>
              </div>
            </div>
          </Card>

          {lease.terms && (
            <Card title="Additional Terms & Conditions">
              <p className="">{lease.terms}</p>
            </Card>
          )}

          <Card title="Digital Signatures">
            <div className="">
              <div className="">
                <h4>Landlord Signature</h4>
                {lease.signatures?.landlord?.signed ? (
                  <div className="">
                    <img 
                      src={lease.signatures.landlord.signatureData} 
                      alt="Landlord Signature"
                      className=""
                    />
                    <p className="">
                      Signed on {formatDate(lease.signatures.landlord.signedAt)}
                    </p>
                    <p className="">
                      {lease.landlord.name}
                    </p>
                  </div>
                ) : (
                  <div className="">
                    <p>Awaiting landlord signature</p>
                  </div>
                )}
              </div>

              <div className="">
                <h4>Tenant Signature</h4>
                {lease.signatures?.tenant?.signed ? (
                  <div className="">
                    <img 
                      src={lease.signatures.tenant.signatureData} 
                      alt="Tenant Signature"
                      className=""
                    />
                    <p className="">
                      Signed on {formatDate(lease.signatures.tenant.signedAt)}
                    </p>
                    <p className="">
                      {lease.tenant.name}
                    </p>
                  </div>
                ) : (
                  <div className="">
                    <p>Awaiting tenant signature</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="">
          <Card title="Landlord">
            <div className="">
              <div className="">
                {lease.landlord.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="">{lease.landlord.name}</p>
                <p className="">{lease.landlord.email}</p>
                <p className="">{lease.landlord.phone || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card title="Tenant">
            <div className="">
              <div className="">
                {lease.tenant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="">{lease.tenant.name}</p>
                <p className="">{lease.tenant.email}</p>
                <p className="">{lease.tenant.phone || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card title="Lease Duration">
            <div className="">
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
        <div className="" onClick={() => setShowSignModal(false)}>
          <div className="" onClick={(e) => e.stopPropagation()}>
            <div className="">
              <h2>Sign Lease Agreement</h2>
              <button 
                className=""
                onClick={() => setShowSignModal(false)}
              >
                ×
              </button>
            </div>
            <div className="">
              <p className="">
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
