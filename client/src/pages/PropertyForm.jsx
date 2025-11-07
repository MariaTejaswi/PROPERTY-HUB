import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import styles from './PropertyForm.module.css';

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'apartment',
    description: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    yearBuilt: '',
    rentAmount: '',
    depositAmount: '',
    status: 'available',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    amenities: []
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const commonAmenities = [
    'Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony',
    'Air Conditioning', 'Heating', 'Washer/Dryer', 'Dishwasher',
    'Pet Friendly', 'Security System', 'Elevator'
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchProperty();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${id}`);
      const property = response.data.property || response.data;
      
      setFormData({
        name: property.name || '',
        type: property.type || 'apartment',
        description: property.description || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        squareFeet: property.squareFeet || '',
        yearBuilt: property.yearBuilt || '',
        rentAmount: property.rentAmount || property.rent || '',
        depositAmount: property.depositAmount || '',
        status: property.status || 'available',
        address: {
          street: property.address?.street || '',
          city: property.address?.city || '',
          state: property.address?.state || '',
          zipCode: property.address?.zipCode || '',
          country: property.address?.country || 'USA'
        },
        amenities: property.amenities || []
      });

      if (property.images && property.images.length > 0) {
        setExistingImages(property.images);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch property');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const handleAddAmenity = (amenity) => {
    if (!formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      });
    }
  };

  const handleRemoveAmenity = (amenityToRemove) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenityToRemove)
    });
  };

  const handleAddCustomAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()]
      });
      setAmenityInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Append form fields
      submitData.append('name', formData.name);
      submitData.append('type', formData.type);
      submitData.append('description', formData.description);
      submitData.append('bedrooms', formData.bedrooms);
      submitData.append('bathrooms', formData.bathrooms);
      submitData.append('squareFeet', formData.squareFeet || 0);
      submitData.append('yearBuilt', formData.yearBuilt || '');
      submitData.append('rentAmount', formData.rentAmount);
      submitData.append('depositAmount', formData.depositAmount || 0);
      submitData.append('status', formData.status);
      
      // Append address
      submitData.append('address[street]', formData.address.street);
      submitData.append('address[city]', formData.address.city);
      submitData.append('address[state]', formData.address.state);
      submitData.append('address[zipCode]', formData.address.zipCode);
      submitData.append('address[country]', formData.address.country);
      
      // Append amenities
      formData.amenities.forEach((amenity, index) => {
        submitData.append(`amenities[${index}]`, amenity);
      });
      
      // Append images
      images.forEach(image => {
        submitData.append('images', image);
      });

      if (isEditMode) {
        await api.put(`/properties/${id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Property updated successfully!');
        setTimeout(() => navigate(`/properties/${id}`), 1500);
      } else {
        const response = await api.post('/properties', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const propertyId = response.data._id;
        setSuccess('Property created successfully!');
        setTimeout(() => navigate(`/properties/${propertyId}`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} property`);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={styles.propertyForm}>
      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/properties')}>
          ← Back to Properties
        </Button>
        <h1>{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} />}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Basic Information */}
          <Card title="Basic Information" className={styles.section}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Property Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Sunset Apartments Unit 101"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="type">Property Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the property, its features, and location..."
                rows={4}
                className={styles.textarea}
              />
            </div>
          </Card>

          {/* Property Details */}
          <Card title="Property Details" className={styles.section}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="bedrooms">Bedrooms *</label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bathrooms">Bathrooms *</label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  required
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="squareFeet">Square Feet</label>
                <input
                  type="number"
                  id="squareFeet"
                  name="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 1200"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="yearBuilt">Year Built</label>
                <input
                  type="number"
                  id="yearBuilt"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 2020"
                  className={styles.input}
                />
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card title="Address" className={styles.section}>
            <div className={styles.formGroup}>
              <label htmlFor="address.street">Street Address *</label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="123 Main Street"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="address.city">City *</label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="Los Angeles"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address.state">State *</label>
                <input
                  type="text"
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="CA"
                  required
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="address.zipCode">Zip Code *</label>
                <input
                  type="text"
                  id="address.zipCode"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  placeholder="90001"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address.country">Country *</label>
                <input
                  type="text"
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>
            </div>
          </Card>

          {/* Financial Information */}
          <Card title="Financial Information" className={styles.section}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="rentAmount">Monthly Rent *</label>
                <input
                  type="number"
                  id="rentAmount"
                  name="rentAmount"
                  value={formData.rentAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="2500"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="depositAmount">Security Deposit</label>
                <input
                  type="number"
                  id="depositAmount"
                  name="depositAmount"
                  value={formData.depositAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="2500"
                  className={styles.input}
                />
              </div>
            </div>
          </Card>

          {/* Amenities */}
          <Card title="Amenities" className={styles.section}>
            <div className={styles.amenitiesGrid}>
              {commonAmenities.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  className={`${styles.amenityButton} ${
                    formData.amenities.includes(amenity) ? styles.selected : ''
                  }`}
                  onClick={() => 
                    formData.amenities.includes(amenity)
                      ? handleRemoveAmenity(amenity)
                      : handleAddAmenity(amenity)
                  }
                >
                  {amenity}
                </button>
              ))}
            </div>

            <div className={styles.customAmenity}>
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                placeholder="Add custom amenity"
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomAmenity())}
              />
              <Button type="button" onClick={handleAddCustomAmenity}>
                Add
              </Button>
            </div>

            {formData.amenities.filter(a => !commonAmenities.includes(a)).length > 0 && (
              <div className={styles.customAmenitiesList}>
                <p className={styles.label}>Custom Amenities:</p>
                <div className={styles.amenitiesGrid}>
                  {formData.amenities
                    .filter(a => !commonAmenities.includes(a))
                    .map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        className={`${styles.amenityButton} ${styles.selected}`}
                        onClick={() => handleRemoveAmenity(amenity)}
                      >
                        {amenity}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </Card>

          {/* Images */}
          <Card title="Property Images" className={styles.section}>
            {existingImages.length > 0 && (
              <div className={styles.existingImages}>
                <p className={styles.label}>Current Images:</p>
                <div className={styles.imageGrid}>
                  {existingImages.map((image, index) => (
                    <img
                      key={index}
                      src={`http://localhost:5000${image}`}
                      alt={`Property ${index + 1}`}
                      className={styles.thumbnail}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="images">
                {isEditMode ? 'Upload New Images (will replace existing)' : 'Upload Images'}
              </label>
              <input
                type="file"
                id="images"
                name="images"
                onChange={handleImageChange}
                accept="image/*"
                multiple
                className={styles.fileInput}
              />
              <p className={styles.hint}>You can select multiple images (JPG, PNG)</p>
            </div>

            {images.length > 0 && (
              <p className={styles.hint}>
                {images.length} image{images.length > 1 ? 's' : ''} selected
              </p>
            )}
          </Card>
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/properties')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Update Property' : 'Create Property'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
