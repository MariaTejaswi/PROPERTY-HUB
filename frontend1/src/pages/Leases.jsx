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
      console.log('Signing lease:', signingLease._id);
      console.log('Signature data length:', signatureData?.length);
      
      const role = isLandlord ? 'landlord' : 'tenant';
      const response = await api.post(`/leases/${signingLease._id}/sign`, {
        signatureData,
        role
      });
      
      console.log('Sign response:', response.data);
      setSuccess('Lease signed successfully!');
      setSigningLease(null);
      fetchLeases();
    } catch (error) {
      console.error('Error signing lease:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to sign lease');
    }
  };

  const handleDelete = async (leaseId) => {
    if (!window.confirm('Are you sure you want to delete this lease? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/leases/${leaseId}`);
      setSuccess('Lease deleted successfully');
      fetchLeases();
    } catch (error) {
      console.error('Error deleting lease:', error);
      setError(error.response?.data?.message || 'Failed to delete lease');
    }
  };

  const canSign = (lease) => {
    if (!lease.signatures) return false;
    
    if (isLandlord) {
      return !lease.signatures?.landlord?.signed;
    } else if (isTenant) {
      return !lease.signatures?.tenant?.signed && lease.tenant?._id === user.id;
    }
    return false;
  };

  const isFullySigned = (lease) => {
    return lease.signatures?.landlord?.signed && lease.signatures?.tenant?.signed;
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lease Agreements</h1>
            <p className="text-gray-600 mt-1">
              {isLandlord ? 'Manage lease agreements' : 'Your lease agreements'}
            </p>
          </div>
          {isLandlord && (
            <button 
              className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              onClick={() => navigate('/leases/new')}
            >
              + Create Lease
            </button>
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
            filter === 'draft' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('draft')}
        >
          Draft
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'expired' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('expired')}
        >
          Expired
        </button>
      </div>

      {leases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No lease agreements</h2>
          <p className="text-gray-600 mb-6">
            {isLandlord 
              ? 'Create a lease agreement to get started' 
              : 'No lease agreements have been created yet'}
          </p>
          {isLandlord && (
            <button 
              className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              onClick={() => navigate('/leases/new')}
            >
              Create Your First Lease
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {leases.map((lease) => (
            <div key={lease._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{lease.property?.name || 'Property'}</h3>
                  <p className="text-sm text-gray-600">
                    📍 {lease.property?.address?.street}, {lease.property?.address?.city}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  lease.status === 'active' ? 'bg-green-100 text-green-800' :
                  lease.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  lease.status === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lease.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Tenant:</span>
                  <p className="font-medium text-gray-900">{lease.tenant?.name || 'Tenant'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Rent Amount:</span>
                  <p className="font-semibold text-gray-900">{formatCurrency(lease.rentAmount)}<span className="text-sm font-normal text-gray-600">/month</span></p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Security Deposit:</span>
                  <p className="font-medium text-gray-900">{formatCurrency(lease.depositAmount)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Start Date:</span>
                  <p className="font-medium text-gray-900">{formatDate(lease.startDate)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">End Date:</span>
                  <p className="font-medium text-gray-900">{formatDate(lease.endDate)}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Signatures</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Landlord:</span>
                    {lease.signatures?.landlord?.signed ? (
                      <span className="text-sm text-green-700 font-medium">✓ Signed on {formatDate(lease.signatures.landlord.signedAt)}</span>
                    ) : (
                      <span className="text-sm text-yellow-700 font-medium">⏳ Pending</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Tenant:</span>
                    {lease.signatures?.tenant?.signed ? (
                      <span className="text-sm text-green-700 font-medium">✓ Signed on {formatDate(lease.signatures.tenant.signedAt)}</span>
                    ) : (
                      <span className="text-sm text-yellow-700 font-medium">⏳ Pending</span>
                    )}
                  </div>
                </div>
              </div>

              {isFullySigned(lease) && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <span className="text-green-700 font-medium text-sm">✓ Fully Signed - Agreement Active</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button 
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => navigate(`/leases/${lease._id}`)}
                >
                  View Details
                </button>
                
                {canSign(lease) && (
                  <button 
                    className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    onClick={() => setSigningLease(lease)}
                  >
                    Sign Lease
                  </button>
                )}
                
                {isLandlord && lease.status === 'draft' && (
                  <>
                    <button 
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => navigate(`/leases/${lease._id}/edit`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                      onClick={() => handleDelete(lease._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
                
                {isFullySigned(lease) && lease.pdfUrl && (
                  <button 
                    className="px-4 py-2 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors"
                    onClick={() => window.open(`http://localhost:5000${lease.pdfUrl}`, '_blank')}
                  >
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {signingLease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSigningLease(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Sign Lease Agreement</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                onClick={() => setSigningLease(null)}
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6">
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
    </div>
  );
};

export default Leases;
