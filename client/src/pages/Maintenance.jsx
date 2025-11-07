import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatDate } from '../utils/formatters';
import styles from './Maintenance.module.css';

const Maintenance = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/maintenance', { params });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      setError('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/maintenance/${id}`, { status });
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance request?')) {
      return;
    }

    try {
      await api.delete(`/maintenance/${id}`);
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      setError('Failed to delete request');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return styles.priorityUrgent;
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'in_progress':
        return styles.statusInProgress;
      case 'pending':
        return styles.statusPending;
      default:
        return '';
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={styles.maintenance}>
      <div className={styles.header}>
        <div>
          <h1>Maintenance Requests</h1>
          <p className={styles.subtitle}>
            {isLandlord ? 'Manage property maintenance' : 'Your maintenance requests'}
          </p>
        </div>
        {isTenant && (
          <Button onClick={() => navigate('/maintenance/new')}>
            + New Request
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className={styles.filters}>
        <button 
          className={filter === 'all' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'in_progress' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </button>
        <button 
          className={filter === 'completed' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {requests.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔧</div>
          <h2>No maintenance requests</h2>
          <p>
            {isTenant 
              ? 'Submit a maintenance request when you need repairs' 
              : 'No maintenance requests have been submitted yet'}
          </p>
          {isTenant && (
            <Button onClick={() => navigate('/maintenance/new')}>
              Create Your First Request
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map((request) => (
            <Card key={request._id} className={styles.requestCard}>
              <div className={styles.requestHeader}>
                <div>
                  <h3>{request.title}</h3>
                  <p className={styles.property}>
                    📍 {request.property?.name || 'Property'}
                  </p>
                </div>
                <div className={styles.badges}>
                  <span className={`${styles.priority} ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                  <span className={`${styles.status} ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className={styles.description}>{request.description}</p>

              <div className={styles.requestDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Submitted by:</span>
                  <span>{request.tenant?.name || 'Tenant'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Date:</span>
                  <span>{formatDate(request.createdAt)}</span>
                </div>
                {request.assignedTo && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Assigned to:</span>
                    <span>{request.assignedTo.name}</span>
                  </div>
                )}
              </div>

              {request.images && request.images.length > 0 && (
                <div className={styles.images}>
                  {request.images.map((image, index) => (
                    <img 
                      key={index}
                      src={`http://localhost:5000${image}`}
                      alt={`Request ${index + 1}`}
                      className={styles.image}
                    />
                  ))}
                </div>
              )}

              {request.comments && request.comments.length > 0 && (
                <div className={styles.comments}>
                  <h4>Comments ({request.comments.length})</h4>
                  {request.comments.slice(0, 2).map((comment) => (
                    <div key={comment._id} className={styles.comment}>
                      <div className={styles.commentHeader}>
                        <strong>{comment.user?.name || 'User'}</strong>
                        <span className={styles.commentDate}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className={styles.commentText}>{comment.text}</p>
                    </div>
                  ))}
                  {request.comments.length > 2 && (
                    <button 
                      className={styles.viewMore}
                      onClick={() => navigate(`/maintenance/${request._id}`)}
                    >
                      View all {request.comments.length} comments
                    </button>
                  )}
                </div>
              )}

              <div className={styles.actions}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/maintenance/${request._id}`)}
                  fullWidth
                >
                  View Details
                </Button>
                
                {isTenant && request.tenant?._id === user._id && request.status === 'pending' && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => navigate(`/maintenance/${request._id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDelete(request._id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
                
                {isLandlord && request.status !== 'completed' && (
                  <>
                    {request.status === 'pending' && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => updateStatus(request._id, 'in_progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <Button 
                        size="sm"
                        onClick={() => updateStatus(request._id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Maintenance;
