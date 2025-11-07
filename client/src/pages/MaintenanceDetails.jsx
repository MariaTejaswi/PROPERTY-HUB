import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatDateTime } from '../utils/formatters';
import styles from './MaintenanceDetails.module.css';

const MaintenanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLandlord } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/maintenance/${id}`);
      setRequest(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch maintenance request');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/maintenance/${id}`, { status: newStatus });
      fetchRequest();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/maintenance/${id}/comments`, {
        text: comment,
        author: user.id
      });
      setComment('');
      fetchRequest();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this maintenance request? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/maintenance/${id}`);
      navigate('/maintenance');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete request');
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error && !request) {
    return (
      <div className={styles.maintenanceDetails}>
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/maintenance')}>Back to Maintenance</Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className={styles.maintenanceDetails}>
        <h1>Request not found</h1>
        <Button onClick={() => navigate('/maintenance')}>Back to Maintenance</Button>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#6366F1';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#6366F1';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className={styles.maintenanceDetails}>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/maintenance')}>
          ← Back to Maintenance
        </Button>
        <div className={styles.actions}>
          {isLandlord && request.status !== 'completed' && request.status !== 'cancelled' && (
            <>
              {request.status === 'pending' && (
                <Button onClick={() => handleStatusChange('in_progress')}>
                  Start Work
                </Button>
              )}
              {request.status === 'in_progress' && (
                <Button onClick={() => handleStatusChange('completed')}>
                  Mark Complete
                </Button>
              )}
              <Button 
                variant="danger" 
                onClick={() => handleStatusChange('cancelled')}
              >
                Cancel Request
              </Button>
            </>
          )}
          {request.tenant?._id === user._id && request.status === 'pending' && (
            <>
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/maintenance/${id}/edit`)}
              >
                Edit Request
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainInfo}>
          <Card>
            <div className={styles.requestHeader}>
              <div>
                <h1 className={styles.title}>{request.title}</h1>
                <p className={styles.date}>Created {formatDateTime(request.createdAt)}</p>
              </div>
              <div className={styles.badges}>
                <span 
                  className={styles.badge}
                  style={{ backgroundColor: getPriorityColor(request.priority) }}
                >
                  {request.priority}
                </span>
                <span 
                  className={styles.badge}
                  style={{ backgroundColor: getStatusColor(request.status) }}
                >
                  {request.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Description">
            <p className={styles.description}>{request.description}</p>
          </Card>

          {request.images && request.images.length > 0 && (
            <Card title="Images">
              <div className={styles.images}>
                {request.images.map((image, index) => (
                  <img 
                    key={index}
                    src={`http://localhost:5000${image}`}
                    alt={`Maintenance ${index + 1}`}
                    className={styles.image}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card title="Property Information">
            <div className={styles.propertyInfo}>
              <h3>{request.property?.name || 'N/A'}</h3>
              <p>{request.property?.address?.street}</p>
              <p>
                {request.property?.address?.city}, {request.property?.address?.state} {request.property?.address?.zipCode}
              </p>
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/properties/${request.property._id}`)}
                style={{ marginTop: '1rem' }}
              >
                View Property Details
              </Button>
            </div>
          </Card>

          <Card title="Comments & Updates">
            <div className={styles.comments}>
              {request.comments && request.comments.length > 0 ? (
                request.comments.map((comment, index) => (
                  <div key={index} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>
                        {comment.author?.name || comment.user?.name || 'Unknown'}
                      </span>
                      <span className={styles.commentDate}>
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className={styles.noComments}>No comments yet</p>
              )}

              <form onSubmit={handleAddComment} className={styles.commentForm}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment or update..."
                  className={styles.textarea}
                  rows={3}
                  required
                />
                <Button type="submit" loading={submitting}>
                  Add Comment
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card title="Reported By">
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {request.tenant?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <p className={styles.userName}>{request.tenant?.name || 'N/A'}</p>
                <p className={styles.userEmail}>{request.tenant?.email || 'N/A'}</p>
                <p className={styles.userPhone}>{request.tenant?.phone || 'N/A'}</p>
              </div>
            </div>
            {request.tenant && (
              <Button 
                fullWidth 
                variant="secondary"
                onClick={() => navigate(`/messages?user=${request.tenant._id}`)}
                style={{ marginTop: '1rem' }}
              >
                Send Message
              </Button>
            )}
          </Card>

          {isLandlord && (
            <Card title="Assigned To">
              <div className={styles.userInfo}>
                <p>{request.assignedTo ? request.assignedTo.name : 'Not assigned'}</p>
                {request.assignedTo && (
                  <>
                    <p className={styles.userEmail}>{request.assignedTo.email}</p>
                    <p className={styles.userPhone}>{request.assignedTo.phone || 'N/A'}</p>
                  </>
                )}
              </div>
            </Card>
          )}

          <Card title="Timeline">
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} style={{ backgroundColor: '#F59E0B' }} />
                <div>
                  <p className={styles.timelineLabel}>Created</p>
                  <p className={styles.timelineDate}>
                    {formatDateTime(request.createdAt)}
                  </p>
                </div>
              </div>
              {request.completedAt && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} style={{ backgroundColor: '#10B981' }} />
                  <div>
                    <p className={styles.timelineLabel}>Completed</p>
                    <p className={styles.timelineDate}>
                      {formatDateTime(request.completedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetails;
