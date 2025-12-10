import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

const PaymentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [leases, setLeases] = useState([]);

  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    leaseId: '',
    amount: '',
    type: 'rent',
    description: '',
    dueDate: ''
  });

  const paymentTypes = [
    { value: 'rent', label: 'Rent' },
    { value: 'deposit', label: 'Security Deposit' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance Fee' },
    { value: 'late_fee', label: 'Late Fee' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchProperties();
    if (isEditMode) {
      fetchPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (formData.propertyId) {
      fetchPropertyTenants(formData.propertyId);
      fetchPropertyLeases(formData.propertyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.propertyId]);

  useEffect(() => {
    if (formData.leaseId && !isEditMode) {
      handleLeaseSelection(formData.leaseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.leaseId]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      console.log('Properties API response:', response.data);
      // Backend returns { properties: [...] }
      const propertyList = response.data.properties || response.data;
      console.log('Property list:', propertyList);
      console.log('Current user:', user);
      // Filter properties owned by landlord
      const landlordProperties = propertyList.filter(
        prop => prop.landlord?._id === user._id || prop.landlord === user._id || prop.landlord?._id === user.id || prop.landlord === user.id
      );
      console.log('Landlord properties:', landlordProperties);
      setProperties(landlordProperties);
      
      if (landlordProperties.length === 0) {
        setError('No properties found. Please create a property first.');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error.response?.data?.message || 'Failed to load properties');
    }
  };

  const fetchPropertyTenants = async (propertyId) => {
    try {
      const response = await api.get(`/properties/${propertyId}`);
      const property = response.data;
      
      // Get current tenant
      if (property.currentTenant) {
        setTenants([property.currentTenant]);
        // Auto-select if only one tenant
        if (!formData.tenantId) {
          setFormData(prev => ({ ...prev, tenantId: property.currentTenant._id }));
        }
      } else {
        setTenants([]);
        setFormData(prev => ({ ...prev, tenantId: '' }));
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchPropertyLeases = async (propertyId) => {
    try {
      const response = await api.get('/leases', { params: { propertyId } });
      // Get active leases
      const activeLeases = response.data.leases?.filter(
        lease => lease.status === 'active'
      ) || [];
      setLeases(activeLeases);
      
      // Auto-select if only one lease
      if (activeLeases.length === 1 && !formData.leaseId) {
        setFormData(prev => ({ ...prev, leaseId: activeLeases[0]._id }));
      }
    } catch (error) {
      console.error('Error fetching leases:', error);
    }
  };

  const fetchPayment = async () => {
    try {
      const response = await api.get(`/payments/${id}`);
      const payment = response.data.payment || response.data;
      
      setFormData({
        propertyId: payment.property._id,
        tenantId: payment.tenant._id,
        leaseId: payment.lease?._id || '',
        amount: payment.amount,
        type: payment.type,
        description: payment.description || '',
        dueDate: payment.dueDate ? payment.dueDate.split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error fetching payment:', error);
      setError('Failed to load payment');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLeaseSelection = (leaseId) => {
    const selectedLease = leases.find(l => l._id === leaseId);
    if (selectedLease) {
      // Auto-fill amount and description from lease
      const currentDate = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      // Calculate due date based on payment due day
      const dueDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        selectedLease.paymentDueDay || 1
      );
      
      // If due date is in the past, move to next month
      if (dueDate < currentDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      
      setFormData(prev => ({
        ...prev,
        amount: selectedLease.rentAmount || '',
        type: 'rent',
        description: `Monthly rent for ${selectedLease.property?.name || 'property'} - ${monthNames[dueDate.getMonth()]} ${dueDate.getFullYear()}`,
        dueDate: dueDate.toISOString().split('T')[0],
        tenantId: selectedLease.tenant?._id || prev.tenantId,
        propertyId: selectedLease.property?._id || prev.propertyId
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEditMode) {
        await api.put(`/payments/${id}`, formData);
      } else {
        await api.post('/payments', formData);
      }

      setSuccess(isEditMode ? 'Payment updated successfully!' : 'Payment record created successfully!');
      
      setTimeout(() => {
        navigate('/payments');
      }, 1500);
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError(error.response?.data?.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/payments');
  };

  if (fetchLoading) return <Loader fullScreen />;

  return (
    <div className="">
      <div className="">
        <h2>{isEditMode ? 'Edit Payment Record' : 'Create Payment Record'}</h2>
        <p className="">
          {isEditMode ? 'Update payment details' : 'Create a new payment record for a tenant'}
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} />}

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="">
            {/* Property & Tenant Selection */}
            <div className="">
              <h3>Property & Tenant</h3>
              
              <div className="">
                <label htmlFor="propertyId">
                  Property <span className="">*</span>
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  required
                  disabled={isEditMode}
                  className=""
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.name} - {property.address?.street}, {property.address?.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="">
                <label htmlFor="tenantId">
                  Tenant <span className="">*</span>
                </label>
                <select
                  id="tenantId"
                  name="tenantId"
                  value={formData.tenantId}
                  onChange={handleChange}
                  required
                  disabled={isEditMode || tenants.length === 0}
                  className=""
                >
                  <option value="">Select a tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.name} - {tenant.email}
                    </option>
                  ))}
                </select>
                {formData.propertyId && tenants.length === 0 && (
                  <small className="">
                    No tenant assigned to this property
                  </small>
                )}
              </div>

              {leases.length > 0 && (
                <div className="">
                  <label htmlFor="leaseId">
                    Associated Lease (Optional)
                  </label>
                  <select
                    id="leaseId"
                    name="leaseId"
                    value={formData.leaseId}
                    onChange={handleChange}
                    className=""
                  >
                    <option value="">None</option>
                    {leases.map(lease => (
                      <option key={lease._id} value={lease._id}>
                        Lease: {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="">
              <h3>Payment Details</h3>
              
              <div className="">
                <div className="">
                  <label htmlFor="type">
                    Payment Type <span className="">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className=""
                  >
                    {paymentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="">
                  <label htmlFor="amount">
                    Amount <span className="">*</span>
                  </label>
                  <div className="">
                    <span className="">₹</span>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      className=""
                    />
                  </div>
                </div>
              </div>

              <div className="">
                <label htmlFor="dueDate">
                  Due Date <span className="">*</span>
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className=""
                />
              </div>

              <div className="">
                <label htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any notes or details about this payment..."
                  rows="4"
                  className=""
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Payment' : 'Create Payment')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
