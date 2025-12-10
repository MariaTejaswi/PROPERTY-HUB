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
  <div className="min-h-screen bg-[#F3F4F6] py-10 px-4 sm:px-8">
    <div className="max-w-7xl mx-auto space-y-10">

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Welcome back, {user.name} 👋
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Here's what's happening across your properties
        </p>
      </div>

      {/* Stats Grid */}
      {isLandlord && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Total Properties */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-7 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Properties</p>
                <h2 className="text-4xl font-bold text-gray-900">{stats.totalProperties}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.occupiedProperties} occupied
                </p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-xl">
                <BuildingOfficeIcon className="h-10 w-10 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-7 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Revenue</p>
                <h2 className="text-4xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </h2>
                <p className="text-xs text-gray-500 mt-1">All-time collected</p>
              </div>
              <div className="bg-emerald-100 p-4 rounded-xl">
                <CurrencyDollarIcon className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-7 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Pending Payments</p>
                <h2 className="text-4xl font-bold text-gray-900">
                  {formatCurrency(stats.pendingPayments)}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Awaiting collection</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-xl">
                <CalendarIcon className="h-10 w-10 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Open Maintenance */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-7 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Open Maintenance</p>
                <h2 className="text-4xl font-bold text-gray-900">{stats.openMaintenance}</h2>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="bg-red-100 p-4 rounded-xl">
                <WrenchScrewdriverIcon className="h-10 w-10 text-red-600" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">

          <Link
            to="/properties/new"
            className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 text-center transition-all group"
          >
            <PlusCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-indigo-600" />
            <span className="font-medium text-gray-700 group-hover:text-indigo-700">
              Add Property
            </span>
          </Link>

          <Link
            to="/maintenance"
            className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 text-center transition-all group"
          >
            <WrenchScrewdriverIcon className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-indigo-600" />
            <span className="font-medium text-gray-700 group-hover:text-indigo-700">
              View Requests
            </span>
          </Link>

          <Link
            to="/payments"
            className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 text-center transition-all group"
          >
            <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-indigo-600" />
            <span className="font-medium text-gray-700 group-hover:text-indigo-700">
              Track Payments
            </span>
          </Link>

          <Link
            to="/messages"
            className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 text-center transition-all group"
          >
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-indigo-600" />
            <span className="font-medium text-gray-700 group-hover:text-indigo-700">
              Messages
            </span>
          </Link>

        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card title="Recent Activity">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                  {activity.type === "payment" ? "💳" : "🔧"}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
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
