import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';

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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert type="error" message={error} />
          <button
            onClick={() => navigate('/properties')}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property not found</h1>
          <button
            onClick={() => navigate('/properties')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-primary-100 text-primary-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/properties')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Properties
          </button>
          {isLandlord && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/properties/${id}/edit`)}
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
              >
                Edit Property
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Delete Property
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <img 
                  src={`http://localhost:5000${property.images[0]}`} 
                  alt={property.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-100 flex flex-col items-center justify-center">
                  <span className="text-6xl mb-2">🏠</span>
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Property Name</span>
                  <p className="font-medium text-gray-900">{property.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Type</span>
                  <p className="font-medium text-gray-900 capitalize">{property.type}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Monthly Rent</span>
                  <p className="font-semibold text-primary-600 text-lg">
                    {formatCurrency(property.rent || property.rentAmount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Bedrooms</span>
                  <p className="font-medium text-gray-900">{property.bedrooms} bed</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Bathrooms</span>
                  <p className="font-medium text-gray-900">{property.bathrooms} bath</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Square Feet</span>
                  <p className="font-medium text-gray-900">{property.squareFeet} sq ft</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Year Built</span>
                  <p className="font-medium text-gray-900">{property.yearBuilt || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>
              <div className="text-gray-700 space-y-1">
                <p className="font-medium">{property.address.street}</p>
                <p>{property.address.city}, {property.address.state} {property.address.zipCode}</p>
                <p>{property.address.country}</p>
              </div>
            </div>

            {property.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <span key={index} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isLandlord && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Landlord Information</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Owner:</span>
                    <p className="font-medium text-gray-900">{property.landlord?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-gray-900">{property.landlord?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium text-gray-900">{property.landlord?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {(property.tenant || property.currentTenant) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Tenant</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium text-gray-900">{(property.tenant || property.currentTenant).name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-gray-900">{(property.tenant || property.currentTenant).email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium text-gray-900">{(property.tenant || property.currentTenant).phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Manager</h2>
              <div className="space-y-3 text-sm">
                <p className="font-medium text-gray-900">
                  {(property.manager || property.assignedManager) ? (property.manager || property.assignedManager).name : 'No manager assigned'}
                </p>
                {(property.manager || property.assignedManager) && (
                  <>
                    <p className="text-gray-700">{(property.manager || property.assignedManager).email}</p>
                    <p className="text-gray-700">{(property.manager || property.assignedManager).phone || 'N/A'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/payments')}
                  className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View Payments
                </button>
                <button 
                  onClick={() => navigate('/maintenance')}
                  className="w-full px-4 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Maintenance Requests
                </button>
                <button 
                  onClick={() => navigate('/leases')}
                  className="w-full px-4 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  View Lease
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
