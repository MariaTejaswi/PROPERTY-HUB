import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/formatters';
import styles from './Dashboard.module.css';

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
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>Welcome back, {user.name}!</h1>
          <p className={styles.subtitle}>Here's what's happening with your properties</p>
        </div>
      </div>

      {isLandlord && (
        <>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#EEF2FF' }}>
                <span style={{ color: '#6366F1' }}>🏠</span>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Properties</p>
                <h2 className={styles.statValue}>{stats.totalProperties}</h2>
                <p className={styles.statDetail}>
                  {stats.occupiedProperties} occupied
                </p>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#D1FAE5' }}>
                <span style={{ color: '#10B981' }}>💰</span>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Revenue</p>
                <h2 className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</h2>
                <p className={styles.statDetail}>All-time collected</p>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#FEF3C7' }}>
                <span style={{ color: '#F59E0B' }}>⏳</span>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Pending Payments</p>
                <h2 className={styles.statValue}>{formatCurrency(stats.pendingPayments)}</h2>
                <p className={styles.statDetail}>Awaiting collection</p>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#FEE2E2' }}>
                <span style={{ color: '#EF4444' }}>🔧</span>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Open Maintenance</p>
                <h2 className={styles.statValue}>{stats.openMaintenance}</h2>
                <p className={styles.statDetail}>Requires attention</p>
              </div>
            </Card>
          </div>

          <div className={styles.quickActions}>
            <h3>Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <Link to="/properties/new" className={styles.actionCard}>
                <span className={styles.actionIcon}>➕</span>
                <span>Add Property</span>
              </Link>
              <Link to="/maintenance" className={styles.actionCard}>
                <span className={styles.actionIcon}>🔧</span>
                <span>View Requests</span>
              </Link>
              <Link to="/payments" className={styles.actionCard}>
                <span className={styles.actionIcon}>💳</span>
                <span>Track Payments</span>
              </Link>
              <Link to="/messages" className={styles.actionCard}>
                <span className={styles.actionIcon}>💬</span>
                <span>Messages</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {isTenant && (
        <>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#EEF2FF' }}>
                <span style={{ color: '#6366F1' }}>💰</span>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Next Payment</p>
                <h2 className={styles.statValue}>{formatCurrency(stats.nextPaymentAmount)}</h2>
                <p className={styles.statDetail}>
                  Due: {stats.nextPaymentDate ? new Date(stats.nextPaymentDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#FEF3C7' }}>
                <span style={{ color: '#F59E0B' }}>🔧</span>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Open Requests</p>
                <h2 className={styles.statValue}>{stats.openRequests}</h2>
                <p className={styles.statDetail}>Maintenance requests</p>
              </div>
            </Card>
          </div>

          <div className={styles.quickActions}>
            <h3>Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <Link to="/payments" className={styles.actionCard}>
                <span className={styles.actionIcon}>💳</span>
                <span>Make Payment</span>
              </Link>
              <Link to="/maintenance/new" className={styles.actionCard}>
                <span className={styles.actionIcon}>🔧</span>
                <span>New Request</span>
              </Link>
              <Link to="/leases" className={styles.actionCard}>
                <span className={styles.actionIcon}>📄</span>
                <span>View Lease</span>
              </Link>
              <Link to="/messages" className={styles.actionCard}>
                <span className={styles.actionIcon}>💬</span>
                <span>Messages</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {recentActivity.length > 0 && (
        <Card title="Recent Activity" className={styles.activityCard}>
          <div className={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.type === 'payment' ? '💳' : '🔧'}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityDescription}>{activity.description}</p>
                  <p className={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
