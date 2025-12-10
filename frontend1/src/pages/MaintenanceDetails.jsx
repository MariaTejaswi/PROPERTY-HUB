import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatDateTime } from '../utils/formatters';

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
      <div className="">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/maintenance')}>Back to Maintenance</Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="">
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
    <div className="">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="">
        <Button variant="secondary" onClick={() => navigate('/maintenance')}>
          ← Back to Maintenance
        </Button>
        <div className="">
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

      <div className="">
        <div className="">
          <Card>
            <div className="">
              <div>
                <h1 className="">{request.title}</h1>
                <p className="">Created {formatDateTime(request.createdAt)}</p>
              </div>
              <div className="">
                <span 
                  className=""
                  style={{ backgroundColor: getPriorityColor(request.priority) }}
                >
                  {request.priority}
                </span>
                <span 
                  className=""
                  style={{ backgroundColor: getStatusColor(request.status) }}
                >
                  {request.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Description">
            <p className="">{request.description}</p>
          </Card>

          {request.images && request.images.length > 0 && (
            <Card title="Images">
              <div className="">
                {request.images.map((image, index) => (
                  <img 
                    key={index}
                    src={`http://localhost:5000${image}`}
                    alt={`Maintenance ${index + 1}`}
                    className=""
                  />
                ))}
              </div>
            </Card>
          )}

          <Card title="Property Information">
            <div className="">
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
            <div className="">
              {request.comments && request.comments.length > 0 ? (
                request.comments.map((comment, index) => (
                  <div key={index} className="">
                    <div className="">
                      <span className="">
                        {comment.author?.name || comment.user?.name || 'Unknown'}
                      </span>
                      <span className="">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="">No comments yet</p>
              )}

              <form onSubmit={handleAddComment} className="">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment or update..."
                  className=""
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

        <div className="">
          <Card title="Reported By">
            <div className="">
              <div className="">
                {request.tenant?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <p className="">{request.tenant?.name || 'N/A'}</p>
                <p className="">{request.tenant?.email || 'N/A'}</p>
                <p className="">{request.tenant?.phone || 'N/A'}</p>
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
              <div className="">
                <p>{request.assignedTo ? request.assignedTo.name : 'Not assigned'}</p>
                {request.assignedTo && (
                  <>
                    <p className="">{request.assignedTo.email}</p>
                    <p className="">{request.assignedTo.phone || 'N/A'}</p>
                  </>
                )}
              </div>
            </Card>
          )}

          <Card title="Timeline">
            <div className="">
              <div className="">
                <div className="" style={{ backgroundColor: '#F59E0B' }} />
                <div>
                  <p className="">Created</p>
                  <p className="">
                    {formatDateTime(request.createdAt)}
                  </p>
                </div>
              </div>
              {request.completedAt && (
                <div className="">
                  <div className="" style={{ backgroundColor: '#10B981' }} />
                  <div>
                    <p className="">Completed</p>
                    <p className="">
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
