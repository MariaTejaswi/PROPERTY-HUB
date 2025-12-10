import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/formatters';
import { 
  BuildingOfficeIcon, 
  CurrencyDollarIcon, 
  WrenchScrewdriverIcon, 
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (isLandlord) {
        const [propertiesRes, paymentsRes, maintenanceRes] = await Promise.all([
          api.get('/properties'),
          api.get('/payments'),
          api.get('/maintenance')
        ]);
        
        const properties = propertiesRes.data.properties || [];
        const payments = paymentsRes.data.payments || [];
        const maintenance = maintenanceRes.data.requests || [];

        // Calculate stats
        const totalRevenue = payments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const pendingPayments = payments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);

        const openMaintenance = maintenance.filter(m => 
          m.status === 'pending' || m.status === 'in_progress'
        ).length;

        setStats({
          totalProperties: properties.length,
          occupiedProperties: properties.filter(p => p.status === 'occupied').length,
          totalRevenue,
          pendingPayments,
          openMaintenance
        });

        // Recent activity
        setRecentActivity([
          ...payments.slice(0, 3).map(p => ({
            type: 'payment',
            description: `Payment of ${formatCurrency(p.amount)} - ${p.status}`,
            date: p.dueDate
          })),
          ...maintenance.slice(0, 2).map(m => ({
            type: 'maintenance',
            description: `${m.title} - ${m.status}`,
            date: m.createdAt
          }))
        ]);

      } else if (isTenant) {
        const [paymentsRes, maintenanceRes, leasesRes] = await Promise.all([
          api.get('/payments'),
          api.get('/maintenance'),
          api.get('/leases')
        ]);
        
        const payments = paymentsRes.data.payments || [];
        const maintenance = maintenanceRes.data.requests || [];
        const leases = leasesRes.data.leases || [];

        const activeLease = leases.find(l => l.status === 'active');
        const nextPayment = payments.find(p => p.status === 'pending');

        setStats({
          nextPaymentAmount: nextPayment?.amount || 0,
          nextPaymentDate: nextPayment?.dueDate,
          openRequests: maintenance.filter(m => m.status !== 'completed').length,
          leaseExpiry: activeLease?.endDate
        });

        setRecentActivity([
          ...payments.slice(0, 5).map(p => ({
            type: 'payment',
            description: `Payment of ${formatCurrency(p.amount)} - ${p.status}`,
            date: p.dueDate
          }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your properties</p>
        </div>

        {isLandlord && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Properties */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Properties</p>
                    <h2 className="text-3xl font-bold text-gray-900">{stats.totalProperties}</h2>
                    <p className="text-xs text-gray-500 mt-2">{stats.occupiedProperties} occupied</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                    <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</h2>
                    <p className="text-xs text-gray-500 mt-2">All-time collected</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Pending Payments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Payments</p>
                    <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(stats.pendingPayments)}</h2>
                    <p className="text-xs text-gray-500 mt-2">Awaiting collection</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <CalendarIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Open Maintenance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Open Maintenance</p>
                    <h2 className="text-3xl font-bold text-gray-900">{stats.openMaintenance}</h2>
                    <p className="text-xs text-gray-500 mt-2">Requires attention</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <WrenchScrewdriverIcon className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link 
                  to="/properties/new" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <PlusCircleIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Add Property</span>
                </Link>
                <Link 
                  to="/maintenance" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <WrenchScrewdriverIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">View Requests</span>
                </Link>
                <Link 
                  to="/payments" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <CurrencyDollarIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Track Payments</span>
                </Link>
                <Link 
                  to="/messages" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Messages</span>
                </Link>
              </div>
            </div>
          </>
        )}

        {isTenant && (
          <>
            {/* Tenant Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Next Payment</p>
                    <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(stats.nextPaymentAmount)}</h2>
                    <p className="text-xs text-gray-500 mt-2">
                      Due: {stats.nextPaymentDate ? new Date(stats.nextPaymentDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Open Requests</p>
                    <h2 className="text-3xl font-bold text-gray-900">{stats.openRequests}</h2>
                    <p className="text-xs text-gray-500 mt-2">Maintenance requests</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Quick Actions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link 
                  to="/payments" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <CurrencyDollarIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Make Payment</span>
                </Link>
                <Link 
                  to="/maintenance/new" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <WrenchScrewdriverIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">New Request</span>
                </Link>
                <Link 
                  to="/leases" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <ClipboardDocumentCheckIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">View Lease</span>
                </Link>
                <Link 
                  to="/messages" 
                  className="bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl p-6 text-center transition-all group"
                >
                  <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Messages</span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card title="Recent Activity">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                    {activity.type === 'payment' ? '💳' : '🔧'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
