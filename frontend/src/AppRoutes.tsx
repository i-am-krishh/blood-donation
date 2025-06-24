import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './context/UserContext';
import Layout from './Layouts/Layout';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import MyRegistrations from './pages/Donor/MyRegistrations';
import NearbyCamps from './pages/Donor/NearbyCamps';
import MyDonations from './pages/Donor/MyDonations';
import OrganizerDashboard from './pages/Dashboard/OrganizerDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import Camps from './pages/Camps/Camps';
import Contact from './pages/Contact/Contact';
import HowItWorks from './pages/HowItWorks/HowItWorks';
import NotFound from './pages/NotFound';
import DonorDashboard from './pages/Dashboard/DonorDashboard';
import ManageCamps from './pages/Organizer/ManageCamps';
import RegisteredUsers from './pages/Organizer/RegisteredUsers';
import VerifyDonations from './pages/Organizer/VerifyDonations';
import AllCamps from './pages/Admin/AllCamps';
import AllUsers from './pages/Admin/AllUsers';
import AllDonations from './pages/Admin/AllDonations';
import Analytics from './pages/Admin/Analytics';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'donor':
        return <Navigate to="/donor/dashboard" replace />;
      case 'camp_organizer':
        return <Navigate to="/organizer/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useUser();

  // Redirect to appropriate dashboard if user is already logged in
  const handleAuthRedirect = () => {
    if (!user) return null;

    switch (user.role) {
      case 'donor':
        return <Navigate to="/donor/dashboard" replace />;
      case 'camp_organizer':
        return <Navigate to="/organizer/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/camps" element={<Camps />} />

        {/* Auth Routes with Redirect Logic */}
        <Route
          path="/login"
          element={handleAuthRedirect() || <Login />}
        />
        <Route
          path="/signup"
          element={handleAuthRedirect() || <Signup />}
        />
        <Route
          path="/forgot-password"
          element={handleAuthRedirect() || <ForgotPassword />}
        />

        {/* Donor Routes */}
        <Route
          path="/donor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/registrations"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <MyRegistrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/nearby-camps"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <NearbyCamps />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/donations"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <MyDonations />
            </ProtectedRoute>
          }
        />

        {/* Organizer Routes */}
        <Route
          path="/organizer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['camp_organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/manage-camps"
          element={
            <ProtectedRoute allowedRoles={['camp_organizer']}>
              <ManageCamps />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/registered-users"
          element={
            <ProtectedRoute allowedRoles={['camp_organizer']}>
              <RegisteredUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/verify-donations"
          element={
            <ProtectedRoute allowedRoles={['camp_organizer']}>
              <VerifyDonations />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/camps"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllCamps />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/donations"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllDonations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default AppRoutes;