import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';
import { PlusIcon, MapPinIcon, HomeIcon } from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
            <p className="text-gray-600 mt-1">
              {isLandlord ? 'Manage your properties' : 'Your assigned properties'}
            </p>
          </div>
          {isLandlord && (
            <Button onClick={() => navigate('/properties/new')}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Property
            </Button>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="mb-4">
              <HomeIcon className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No properties yet</h2>
            <p className="text-gray-600 mb-6">
              {isLandlord 
                ? 'Add your first property to get started' 
                : 'No properties have been assigned to you yet'}
            </p>
            {isLandlord && (
              <Button onClick={() => navigate('/properties/new')}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Property
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={`http://localhost:5000${property.images[0]}`} 
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <HomeIcon className="h-20 w-20 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      property.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : property.status === 'occupied'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                </div>

                {/* Property Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
                  <div className="flex items-start gap-2 text-gray-600 mb-4">
                    <MapPinIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      {property.address.street}<br />
                      {property.address.city}, {property.address.state} {property.address.zipCode}
                    </p>
                  </div>

                  {/* Property Details */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>🛏️</span>
                      <span>{property.bedrooms} Bed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🚿</span>
                      <span>{property.bathrooms} Bath</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📏</span>
                      <span>{property.squareFeet || 'N/A'} sqft</span>
                    </div>
                  </div>

                  {/* Rent */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(property.rentAmount)}
                      <span className="text-sm text-gray-500 font-normal">/month</span>
                    </p>
                  </div>

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {property.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{property.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
