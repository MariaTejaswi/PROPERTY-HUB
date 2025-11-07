import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';
import styles from './Properties.module.css';

const Properties = () => {
  const { isLandlord } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await api.delete(`/properties/${id}`);
      setProperties(properties.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error deleting property:', error);
      setError('Failed to delete property');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={styles.properties}>
      <div className={styles.header}>
        <div>
          <h1>Properties</h1>
          <p className={styles.subtitle}>
            {isLandlord ? 'Manage your properties' : 'Your assigned properties'}
          </p>
        </div>
        {isLandlord && (
          <Button onClick={() => navigate('/properties/new')}>
            + Add Property
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {properties.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏠</div>
          <h2>No properties yet</h2>
          <p>
            {isLandlord 
              ? 'Add your first property to get started' 
              : 'No properties have been assigned to you yet'}
          </p>
          {isLandlord && (
            <Button onClick={() => navigate('/properties/new')}>
              Add Your First Property
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {properties.map((property) => (
            <Card key={property._id} className={styles.propertyCard}>
              <div className={styles.propertyImage}>
                {property.images && property.images.length > 0 ? (
                  <img 
                    src={`http://localhost:5000${property.images[0]}`} 
                    alt={property.name}
                  />
                ) : (
                  <div className={styles.noImage}>
                    <span>🏠</span>
                  </div>
                )}
                <div className={`${styles.statusBadge} ${styles[property.status]}`}>
                  {property.status}
                </div>
              </div>

              <div className={styles.propertyContent}>
                <h3>{property.name}</h3>
                <p className={styles.address}>
                  {property.address.street}<br />
                  {property.address.city}, {property.address.state} {property.address.zipCode}
                </p>

                <div className={styles.propertyDetails}>
                  <div className={styles.detail}>
                    <span className={styles.icon}>🛏️</span>
                    <span>{property.bedrooms} Bed</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.icon}>🚿</span>
                    <span>{property.bathrooms} Bath</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.icon}>📏</span>
                    <span>{property.squareFeet || 'N/A'} sqft</span>
                  </div>
                </div>

                <div className={styles.rent}>
                  <span className={styles.rentLabel}>Rent</span>
                  <span className={styles.rentAmount}>
                    {formatCurrency(property.rentAmount)}/mo
                  </span>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className={styles.amenities}>
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className={styles.amenity}>
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className={styles.amenity}>
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className={styles.actions}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/properties/${property._id}`)}
                    fullWidth
                  >
                    View Details
                  </Button>
                  {isLandlord && (
                    <>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => navigate(`/properties/${property._id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(property._id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;
