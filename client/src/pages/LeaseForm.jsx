import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';
import styles from './LeaseForm.module.css';

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
    <div className={styles.leaseForm}>
      <div className={styles.header}>
        <div>
          <h1>{isEditMode ? 'Edit Lease' : 'Create New Lease'}</h1>
          <p className={styles.subtitle}>
            {isEditMode ? 'Update the lease agreement details' : 'Fill in the details to create a new lease agreement'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/leases')}>
          Cancel
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <Card>
          <div className={styles.formGrid}>
            {/* Property Selection */}
            <div className={styles.formGroup}>
              <label htmlFor="propertyId">Property *</label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                required
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
            <div className={styles.formGroup}>
              <label htmlFor="tenantId">Tenant *</label>
              <select
                id="tenantId"
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                required
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
            <div className={styles.formGroup}>
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* End Date */}
            <div className={styles.formGroup}>
              <label htmlFor="endDate">End Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Rent Amount */}
            <div className={styles.formGroup}>
              <label htmlFor="rentAmount">Monthly Rent *</label>
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
              />
              {selectedProperty && (
                <span className={styles.hint}>
                  Property rent: {formatCurrency(selectedProperty.rent)}
                </span>
              )}
            </div>

            {/* Security Deposit */}
            <div className={styles.formGroup}>
              <label htmlFor="securityDeposit">Security Deposit *</label>
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
              />
            </div>

            {/* Payment Due Day */}
            <div className={styles.formGroup}>
              <label htmlFor="paymentDueDay">Payment Due Day *</label>
              <input
                type="number"
                id="paymentDueDay"
                name="paymentDueDay"
                value={formData.paymentDueDay}
                onChange={handleChange}
                min="1"
                max="31"
                required
              />
              <span className={styles.hint}>Day of month rent is due (1-31)</span>
            </div>
          </div>

          {/* Terms */}
          <div className={styles.formGroup}>
            <label htmlFor="terms">Lease Terms & Conditions *</label>
            <textarea
              id="terms"
              name="terms"
              value={formData.terms}
              onChange={handleChange}
              rows="10"
              placeholder="Enter the complete terms and conditions of the lease agreement..."
              required
            />
            <span className={styles.hint}>
              Include all relevant terms, conditions, rules, and regulations
            </span>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => navigate('/leases')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Lease' : 'Create Lease')}
            </Button>
          </div>
        </Card>
      </form>

      {loading && <Loader fullScreen />}
    </div>
  );
};

export default LeaseForm;
