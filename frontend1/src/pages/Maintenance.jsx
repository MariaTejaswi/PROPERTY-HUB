import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatDate } from '../utils/formatters';

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

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
            <p className="text-gray-600 mt-1">
              {isLandlord ? 'Manage property maintenance' : 'Your maintenance requests'}
            </p>
          </div>
          {isTenant && (
            <button
              onClick={() => navigate('/maintenance/new')}
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              + New Request
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex gap-2 mb-6">
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'in_progress' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No maintenance requests</h2>
          <p className="text-gray-600 mb-6">
            {isTenant 
              ? 'Submit a maintenance request when you need repairs' 
              : 'No maintenance requests have been submitted yet'}
          </p>
          {isTenant && (
            <button
              onClick={() => navigate('/maintenance/new')}
              className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Your First Request
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{request.title}</h3>
                  <p className="text-sm text-gray-600">
                    📍 {request.property?.name || 'Property'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.priority === 'high' ? 'bg-red-100 text-red-800' :
                    request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {request.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{request.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="space-y-1">
                  <span className="text-gray-500">Submitted by:</span>
                  <p className="font-medium text-gray-900">{request.tenant?.name || 'Tenant'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500">Date:</span>
                  <p className="font-medium text-gray-900">{formatDate(request.createdAt)}</p>
                </div>
                {request.assignedTo && (
                  <div className="space-y-1">
                    <span className="text-gray-500">Assigned to:</span>
                    <p className="font-medium text-gray-900">{request.assignedTo.name}</p>
                  </div>
                )}
              </div>

              {request.images && request.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {request.images.map((image, index) => (
                    <img 
                      key={index}
                      src={`http://localhost:5000${image}`}
                      alt={`Request ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ))}
                </div>
              )}

              {request.comments && request.comments.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Comments ({request.comments.length})</h4>
                  <div className="space-y-3">
                    {request.comments.slice(0, 2).map((comment) => (
                      <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <strong className="text-sm font-medium text-gray-900">{comment.user?.name || 'User'}</strong>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  {request.comments.length > 2 && (
                    <button 
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-3"
                      onClick={() => navigate(`/maintenance/${request._id}`)}
                    >
                      View all {request.comments.length} comments
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
                <button 
                  className="flex-1 min-w-[120px] px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  onClick={() => navigate(`/maintenance/${request._id}`)}
                >
                  View Details
                </button>
                
                {isTenant && request.tenant?._id === user._id && request.status === 'pending' && (
                  <>
                    <button 
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => navigate(`/maintenance/${request._id}/edit`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                      onClick={() => handleDelete(request._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
                
                {isLandlord && request.status !== 'completed' && (
                  <>
                    {request.status === 'pending' && (
                      <button 
                        className="px-4 py-2 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors"
                        onClick={() => updateStatus(request._id, 'in_progress')}
                      >
                        Start Work
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button 
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                        onClick={() => updateStatus(request._id, 'completed')}
                      >
                        Mark Complete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Maintenance;
