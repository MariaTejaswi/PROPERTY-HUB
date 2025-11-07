import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';
import styles from './PropertyDetails.module.css';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLandlord } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperty();
    // eslint-disable-next-line
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${id}`);
      setProperty(response.data.property || response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/properties/${id}`);
        navigate('/properties');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete property');
      }
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error) {
    return (
      <div className={styles.propertyDetails}>
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/properties')}>Back to Properties</Button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={styles.propertyDetails}>
        <h1>Property not found</h1>
        <Button onClick={() => navigate('/properties')}>Back to Properties</Button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'occupied': return '#6366F1';
      case 'maintenance': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <div className={styles.propertyDetails}>
      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/properties')}>
          ← Back to Properties
        </Button>
        {isLandlord && (
          <div className={styles.actions}>
            <Button onClick={() => navigate(`/properties/${id}/edit`)}>
              Edit Property
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Property
            </Button>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.mainInfo}>
          <Card className={styles.imageCard}>
            {property.images && property.images.length > 0 ? (
              <img 
                src={`http://localhost:5000${property.images[0]}`} 
                alt={property.name}
                className={styles.propertyImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <span className={styles.icon}>🏠</span>
                <p>No image available</p>
              </div>
            )}
          </Card>

          <Card title="Property Information">
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Property Name</span>
                <span className={styles.value}>{property.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Status</span>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(property.status) }}
                >
                  {property.status}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Type</span>
                <span className={styles.value}>{property.type}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Monthly Rent</span>
                <span className={styles.value} style={{ color: '#6366F1', fontWeight: '600' }}>
                  {formatCurrency(property.rent || property.rentAmount)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Bedrooms</span>
                <span className={styles.value}>{property.bedrooms} bed</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Bathrooms</span>
                <span className={styles.value}>{property.bathrooms} bath</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Square Feet</span>
                <span className={styles.value}>{property.squareFeet} sq ft</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Year Built</span>
                <span className={styles.value}>{property.yearBuilt || 'N/A'}</span>
              </div>
            </div>
          </Card>

          <Card title="Address">
            <div className={styles.address}>
              <p>{property.address.street}</p>
              <p>{property.address.city}, {property.address.state} {property.address.zipCode}</p>
              <p>{property.address.country}</p>
            </div>
          </Card>

          {property.description && (
            <Card title="Description">
              <p className={styles.description}>{property.description}</p>
            </Card>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <Card title="Amenities">
              <div className={styles.amenities}>
                {property.amenities.map((amenity, index) => (
                  <span key={index} className={styles.amenity}>
                    {amenity}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className={styles.sidebar}>
          {isLandlord && (
            <Card title="Landlord Information">
              <div className={styles.ownerInfo}>
                <p><strong>Owner:</strong> {property.landlord?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {property.landlord?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {property.landlord?.phone || 'N/A'}</p>
              </div>
            </Card>
          )}

          {(property.tenant || property.currentTenant) && (
            <Card title="Current Tenant">
              <div className={styles.tenantInfo}>
                <p><strong>Name:</strong> {(property.tenant || property.currentTenant).name}</p>
                <p><strong>Email:</strong> {(property.tenant || property.currentTenant).email}</p>
                <p><strong>Phone:</strong> {(property.tenant || property.currentTenant).phone || 'N/A'}</p>
              </div>
            </Card>
          )}

          <Card title="Property Manager">
            <div className={styles.managerInfo}>
              <p>{(property.manager || property.assignedManager) ? (property.manager || property.assignedManager).name : 'No manager assigned'}</p>
              {(property.manager || property.assignedManager) && (
                <>
                  <p>{(property.manager || property.assignedManager).email}</p>
                  <p>{(property.manager || property.assignedManager).phone || 'N/A'}</p>
                </>
              )}
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className={styles.quickActions}>
              <Button 
                fullWidth 
                onClick={() => navigate('/payments')}
                style={{ marginBottom: '0.5rem' }}
              >
                View Payments
              </Button>
              <Button 
                fullWidth 
                onClick={() => navigate('/maintenance')}
                variant="secondary"
                style={{ marginBottom: '0.5rem' }}
              >
                Maintenance Requests
              </Button>
              <Button 
                fullWidth 
                onClick={() => navigate('/leases')}
                variant="secondary"
              >
                View Lease
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
