import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';

const LeaseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    securityDeposit: '',
    paymentDueDay: 1,
    terms: ''
  });

  useEffect(() => {
    fetchProperties();
    fetchTenants();
    if (isEditMode) {
      fetchLease();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchLease = async () => {
    try {
      const response = await api.get(`/leases/${id}`);
      const lease = response.data;
      setFormData({
        propertyId: lease.property._id || lease.property,
        tenantId: lease.tenant._id || lease.tenant,
        startDate: lease.startDate.split('T')[0],
        endDate: lease.endDate.split('T')[0],
        rentAmount: lease.rentAmount,
        securityDeposit: lease.securityDeposit,
        paymentDueDay: lease.paymentDueDay,
        terms: lease.terms
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lease details');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      console.log('Properties response:', response.data);
      // Filter for available properties on frontend
      const availableProps = (response.data.properties || []).filter(
        p => p.status === 'available' && p.isAvailable !== false
      );
      setProperties(availableProps);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get('/auth/users');
      console.log('Users response:', response.data);
      // Filter for tenants on frontend
      const tenantUsers = (response.data.users || []).filter(u => u.role === 'tenant');
      setTenants(tenantUsers);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/leases/${id}`, formData);
      } else {
        await api.post('/leases', formData);
      }
      navigate('/leases');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} lease`);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p._id === formData.propertyId);

  if (initialLoading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? 'Edit Lease' : 'Create New Lease'}</h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update the lease agreement details' : 'Fill in the details to create a new lease agreement'}
            </p>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            onClick={() => navigate('/leases')}
          >
            Cancel
          </button>
        </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Property Selection */}
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-2">Property *</label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property._id} value={property._id}>
                    {property.name} - {property.address?.street}, {property.address?.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenant Selection */}
            <div>
              <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 mb-2">Tenant *</label>
              <select
                id="tenantId"
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a tenant</option>
                {tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} - {tenant.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Rent Amount */}
            <div>
              <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="rentAmount"
                  name="rentAmount"
                  value={formData.rentAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {selectedProperty && (
                <span className="text-xs text-gray-500 mt-1 block">
                  Property rent: {formatCurrency(selectedProperty.rent)}
                </span>
              )}
            </div>

            {/* Security Deposit */}
            <div>
              <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700 mb-2">Security Deposit *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="securityDeposit"
                  name="securityDeposit"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Payment Due Day */}
            <div>
              <label htmlFor="paymentDueDay" className="block text-sm font-medium text-gray-700 mb-2">Payment Due Day *</label>
              <input
                type="number"
                id="paymentDueDay"
                name="paymentDueDay"
                value={formData.paymentDueDay}
                onChange={handleChange}
                min="1"
                max="31"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-xs text-gray-500 mt-1 block">Day of month rent is due (1-31)</span>
            </div>
          </div>

          {/* Terms */}
          <div className="mb-6">
            <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-2">Lease Terms & Conditions *</label>
            <textarea
              id="terms"
              name="terms"
              value={formData.terms}
              onChange={handleChange}
              rows="10"
              placeholder="Enter the complete terms and conditions of the lease agreement..."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            />
            <span className="text-xs text-gray-500 mt-1 block">
              ✓ Include all relevant terms, conditions, rules, and regulations
            </span>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button 
              type="button" 
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => navigate('/leases')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Lease' : 'Create Lease')}
            </button>
          </div>
        </div>
      </form>

      {loading && <Loader fullScreen />}
      </div>
    </div>
  );
};

export default LeaseForm;
