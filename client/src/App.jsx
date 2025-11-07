import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Loader from './components/common/Loader';
import Navbar from './components/layout/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import PropertyForm from './pages/PropertyForm';
import Payments from './pages/Payments';
import PaymentForm from './pages/PaymentForm';
import Maintenance from './pages/Maintenance';
import MaintenanceDetails from './pages/MaintenanceDetails';
import MaintenanceForm from './pages/MaintenanceForm';
import Messages from './pages/Messages';
import Leases from './pages/Leases';
import LeaseDetails from './pages/LeaseDetails';
import LeaseForm from './pages/LeaseForm';
import Profile from './pages/Profile';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/properties" element={<PrivateRoute><Properties /></PrivateRoute>} />
          <Route path="/properties/new" element={<PrivateRoute><PropertyForm /></PrivateRoute>} />
          <Route path="/properties/:id" element={<PrivateRoute><PropertyDetails /></PrivateRoute>} />
          <Route path="/properties/:id/edit" element={<PrivateRoute><PropertyForm /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/payments/new" element={<PrivateRoute><PaymentForm /></PrivateRoute>} />
          <Route path="/payments/:id/edit" element={<PrivateRoute><PaymentForm /></PrivateRoute>} />
          <Route path="/maintenance" element={<PrivateRoute><Maintenance /></PrivateRoute>} />
          <Route path="/maintenance/new" element={<PrivateRoute><MaintenanceForm /></PrivateRoute>} />
          <Route path="/maintenance/:id" element={<PrivateRoute><MaintenanceDetails /></PrivateRoute>} />
          <Route path="/maintenance/:id/edit" element={<PrivateRoute><MaintenanceForm /></PrivateRoute>} />
          <Route path="/leases" element={<PrivateRoute><Leases /></PrivateRoute>} />
          <Route path="/leases/new" element={<PrivateRoute><LeaseForm /></PrivateRoute>} />
          <Route path="/leases/:id/edit" element={<PrivateRoute><LeaseForm /></PrivateRoute>} />
          <Route path="/leases/:id" element={<PrivateRoute><LeaseDetails /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* 404 */}
          <Route path="*" element={<div style={{padding: '2rem'}}><h1>404 - Page Not Found</h1></div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
