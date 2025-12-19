import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import PropertyForm from './pages/PropertyForm';
import Leases from './pages/Leases';
import LeaseDetails from './pages/LeaseDetails';
import LeaseForm from './pages/LeaseForm';
import Payments from './pages/Payments';
import PaymentForm from './pages/PaymentForm';
import Maintenance from './pages/Maintenance';
import MaintenanceDetails from './pages/MaintenanceDetails';
import MaintenanceForm from './pages/MaintenanceForm';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Landlord-only Route Component
const LandlordOnlyRoute = ({ children }) => {
  const { user, isLandlord } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return isLandlord ? children : <Navigate to="/properties" replace />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state;
  const backgroundLocation = state?.backgroundLocation;

  const LeaseCreateModal = () => {
    const navigate = useNavigate();
    return (
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={() => navigate(-1)}
      >
        <div
          className="lux-card w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <LeaseForm isModal />
        </div>
      </div>
    );
  };

  const MaintenanceCreateModal = () => {
    const navigate = useNavigate();
    return (
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={() => navigate(-1)}
      >
        <div
          className="lux-card w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <MaintenanceForm isModal />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* FIXED NAVBAR: show only when logged in AND not on home page */}
      {location.pathname !== "/" && user && <Navbar />}

      <main className={`flex-grow ${location.pathname === "/messages" ? "overflow-hidden" : ""}`}>
        <Routes location={backgroundLocation || location}>

          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Properties */}
          <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
          <Route path="/properties/new" element={<LandlordOnlyRoute><PropertyForm /></LandlordOnlyRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetails /></ProtectedRoute>} />
          <Route path="/properties/:id/edit" element={<LandlordOnlyRoute><PropertyForm /></LandlordOnlyRoute>} />

          {/* Leases */}
          <Route path="/leases" element={<ProtectedRoute><Leases /></ProtectedRoute>} />
          <Route path="/leases/new" element={<ProtectedRoute><LeaseForm /></ProtectedRoute>} />
          <Route path="/leases/:id" element={<ProtectedRoute><LeaseDetails /></ProtectedRoute>} />
          <Route path="/leases/:id/edit" element={<ProtectedRoute><LeaseForm /></ProtectedRoute>} />

          {/* Payments */}
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/payments/new" element={<LandlordOnlyRoute><PaymentForm /></LandlordOnlyRoute>} />

          {/* ⭐ FIXED: EDIT PAYMENT ROUTE — THIS WAS MISSING ⭐ */}
          <Route path="/payments/:id/edit" element={<LandlordOnlyRoute><PaymentForm /></LandlordOnlyRoute>} />

          {/* Maintenance */}
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/maintenance/new" element={<ProtectedRoute><MaintenanceForm /></ProtectedRoute>} />
          <Route path="/maintenance/:id" element={<ProtectedRoute><MaintenanceDetails /></ProtectedRoute>} />
          <Route path="/maintenance/:id/edit" element={<ProtectedRoute><MaintenanceForm /></ProtectedRoute>} />

          {/* Messages */}
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

          {/* Profile */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

        {backgroundLocation && (
          <Routes>
            <Route path="/leases/new" element={<ProtectedRoute><LeaseCreateModal /></ProtectedRoute>} />
            <Route path="/maintenance/new" element={<ProtectedRoute><MaintenanceCreateModal /></ProtectedRoute>} />
          </Routes>
        )}
      </main>

      {/* Footer only for logged-in users */}
      {user && location.pathname !== "/messages" && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
