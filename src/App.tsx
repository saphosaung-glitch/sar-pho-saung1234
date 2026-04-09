/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider } from './context/StoreContext';
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import { Toaster } from 'sonner';

export default function App() {
  return (
    <StoreProvider>
      <Toaster position="top-center" expand={false} richColors />
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/type/:type" element={<DealsPage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/help-center" element={<HelpCenterPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/address-management" element={<AddressManagementPage />} />
          <Route path="/add-address" element={<AddAddressPage />} />
          <Route path="/setup-admin" element={<SetupAdminPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
