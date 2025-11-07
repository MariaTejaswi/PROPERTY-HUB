import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import styles from './MaintenanceForm.module.css';

const MaintenanceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [properties, setProperties] = useState([]);

  const [formData, setFormData] = useState({
    propertyId: '',
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    images: []
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const categories = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'appliance', label: 'Appliance' },
    { value: 'structural', label: 'Structural' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'security', label: 'Security' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', description: 'Non-urgent, can wait' },
    { value: 'medium', label: 'Medium', description: 'Should be addressed soon' },
    { value: 'high', label: 'High', description: 'Needs attention quickly' },
    { value: 'urgent', label: 'Urgent', description: 'Emergency, immediate attention' }
  ];

  useEffect(() => {
    fetchProperties();
    if (isEditMode) {
      fetchMaintenanceRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      // Filter properties where user is tenant
      const userProperties = response.data.filter(
        prop => prop.currentTenant?._id === user._id || prop.tenant?._id === user._id
      );
      setProperties(userProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties');
    }
  };

  const fetchMaintenanceRequest = async () => {
    try {
      const response = await api.get(`/maintenance/${id}`);
      const request = response.data;
      
      setFormData({
        propertyId: request.property._id,
        title: request.title,
        description: request.description,
        category: request.category,
        priority: request.priority
      });
      
      setExistingImages(request.images || []);
    } catch (error) {
      console.error('Error fetching maintenance request:', error);
      setError('Failed to load maintenance request');
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('propertyId', formData.propertyId);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('priority', formData.priority);

      // Append images
      selectedFiles.forEach(file => {
        data.append('images', file);
      });

      let response;
      if (isEditMode) {
        response = await api.put(`/maintenance/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/maintenance', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSuccess(isEditMode ? 'Request updated successfully!' : 'Request submitted successfully!');
      
      setTimeout(() => {
        navigate(`/maintenance/${response.data._id || id}`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      setError(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/maintenance');
  };

  if (fetchLoading) return <Loader fullScreen />;

  return (
    <div className={styles.maintenanceForm}>
      <div className={styles.header}>
        <h2>{isEditMode ? 'Edit Maintenance Request' : 'New Maintenance Request'}</h2>
        <p className={styles.subtitle}>
          {isEditMode ? 'Update your maintenance request details' : 'Submit a maintenance request for your property'}
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} />}

      <form onSubmit={handleSubmit}>
        <Card>
          <div className={styles.formGrid}>
            {/* Property Selection */}
            <div className={styles.formSection}>
              <h3>Property Information</h3>
              <div className={styles.formGroup}>
                <label htmlFor="propertyId">
                  Property <span className={styles.required}>*</span>
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  required
                  disabled={isEditMode}
                  className={styles.select}
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.name} - {property.address?.street}, {property.address?.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Request Details */}
            <div className={styles.formSection}>
              <h3>Request Details</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="title">
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Brief description of the issue"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="category">
                    Category <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className={styles.select}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="priority">
                    Priority <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    className={styles.select}
                  >
                    {priorities.map(pri => (
                      <option key={pri.value} value={pri.value}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                  <small className={styles.helpText}>
                    {priorities.find(p => p.value === formData.priority)?.description}
                  </small>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about the issue..."
                  rows="6"
                  required
                  className={styles.textarea}
                />
                <small className={styles.helpText}>
                  Include as much detail as possible to help us resolve the issue quickly
                </small>
              </div>
            </div>

            {/* Images */}
            <div className={styles.formSection}>
              <h3>Images (Optional)</h3>
              <p className={styles.sectionDescription}>
                Upload photos of the issue to help us better understand the problem
              </p>

              {existingImages.length > 0 && (
                <div className={styles.existingImages}>
                  <h4>Current Images:</h4>
                  <div className={styles.imageGrid}>
                    {existingImages.map((image, index) => (
                      <div key={index} className={styles.imagePreview}>
                        <img 
                          src={`http://localhost:5000${image}`} 
                          alt={`Existing ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="images" className={styles.fileInputLabel}>
                  {isEditMode ? 'Add More Images' : 'Upload Images'}
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                {selectedFiles.length > 0 && (
                  <p className={styles.fileInfo}>
                    {selectedFiles.length} new image(s) selected
                  </p>
                )}
                <small className={styles.helpText}>
                  Accepted formats: JPG, PNG. Max 5MB per image.
                </small>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className={styles.formActions}>
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
            {loading ? 'Submitting...' : (isEditMode ? 'Update Request' : 'Submit Request')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
