/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreProvider, useStore } from './context/StoreContext';
import RegistrationPage from './pages/RegistrationPage';
import WelcomePage from './pages/WelcomePage';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import NotificationsPage from './pages/NotificationsPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import SecurityPage from './pages/SecurityPage';
import OrderDetailPage from './pages/OrderDetailPage';
import HelpCenterPage from './pages/HelpCenterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AboutUsPage from './pages/AboutUsPage';
import PointsPage from './pages/PointsPage';
import SetupAdminPage from './pages/SetupAdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AddressManagementPage from './pages/AddressManagementPage';
import AddAddressPage from './pages/AddAddressPage';
import DealsPage from './pages/DealsPage';
import DealDetailPage from './pages/DealDetailPage';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useStore();
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { userName, userPhone } = useStore();
  const location = useLocation();
  
  // If user hasn't registered (no name or phone), redirect to registration
  if (!userName || !userPhone) {
    return <Navigate to="/registration" state={{ from: location }} replace />;
  }
  
  return children;
}

function ThemeHandler() {
  const { darkMode } = useStore();
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <ThemeHandler />
      <Toaster position="top-center" expand={false} richColors />
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
          <Route path="/deals" element={<ProtectedRoute><DealsPage /></ProtectedRoute>} />
          <Route path="/deals/type/:type" element={<ProtectedRoute><DealsPage /></ProtectedRoute>} />
          <Route path="/deals/:id" element={<ProtectedRoute><DealDetailPage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          <Route path="/help-center" element={<ProtectedRoute><HelpCenterPage /></ProtectedRoute>} />
          <Route path="/privacy-policy" element={<ProtectedRoute><PrivacyPolicyPage /></ProtectedRoute>} />
          <Route path="/about-us" element={<ProtectedRoute><AboutUsPage /></ProtectedRoute>} />
          <Route path="/points" element={<ProtectedRoute><PointsPage /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
          <Route path="/address-management" element={<ProtectedRoute><AddressManagementPage /></ProtectedRoute>} />
          <Route path="/add-address" element={<ProtectedRoute><AddAddressPage /></ProtectedRoute>} />
          <Route path="/setup-admin" element={<SetupAdminPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
