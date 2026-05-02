/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { StoreProvider, useStore } from './context/StoreContext';
import { AlertCircle, RefreshCw, Phone } from 'lucide-react';
import { motion } from 'motion/react';

import RegistrationPage from './pages/RegistrationPage';
import WelcomePage from './pages/WelcomePage';
const MenuPage = lazy(() => import('./pages/MenuPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PaymentMethodsPage = lazy(() => import('./pages/PaymentMethodsPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const PointsPage = lazy(() => import('./pages/PointsPage'));
const SetupAdminPage = lazy(() => import('./pages/SetupAdminPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AddressManagementPage = lazy(() => import('./pages/AddressManagementPage'));
const AddAddressPage = lazy(() => import('./pages/AddAddressPage'));
const DealsPage = lazy(() => import('./pages/DealsPage'));
const DealDetailPage = lazy(() => import('./pages/DealDetailPage'));

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthLoading } = useStore();
  
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
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

function ThemedToaster() {
  const { darkMode } = useStore();
  return <Toaster position="top-center" theme={darkMode ? 'dark' : 'light'} expand={false} richColors />;
}

function QuotaExceededGuard({ children }: { children: React.ReactNode }) {
  const { isQuotaExceeded, darkMode, supportNumber, products, orders } = useStore();
  const [showAnyway, setShowAnyway] = React.useState(false);

  // If we have products/orders in cache, allow "Soft Mode" but show a warning
  const hasCachedData = products.length > 0 || orders.length > 0;

  if (isQuotaExceeded && !showAnyway && !hasCachedData) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 text-center ${darkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-sm p-8 rounded-[2.5rem] border shadow-2xl ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-rose-500" />
          </div>
          
          <h2 className="text-2xl font-black mb-4 tracking-tight">Rate Exceeded</h2>
          
          <div className="space-y-4 mb-8">
            <p className="text-sm font-medium opacity-70 leading-relaxed">
              နေ့စဉ် အသုံးပြုနိုင်သည့် ပမာဏ ပြည့်သွားပါပြီ။ ခေတ္တစောင့်ဆိုင်းပြီးမှ ပြန်လည် ကြိုးစားပေးပါ။
            </p>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">
              Daily resource limit reached. Please try again later.
            </p>
          </div>

          <div className="grid gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> ပြန်လည်စတင်ပါ (Reload)
            </button>
            
            {supportNumber && (
              <a 
                href={`tel:${supportNumber}`}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border ${darkMode ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Phone size={14} /> အကူအညီရယူရန် (Support)
              </a>
            )}
          </div>
          
          <p className="mt-8 text-[9px] font-medium opacity-30 uppercase tracking-widest italic">
            Resetting in 12-24 hours
          </p>
        </motion.div>
      </div>
    );
  }

  return children;
}

function AppErrorListener() {
  useEffect(() => {
    const handleError = (e: any) => {
      toast.error(e.detail || 'An error occurred');
    };
    window.addEventListener('app-error', handleError);
    return () => window.removeEventListener('app-error', handleError);
  }, []);
  return null;
}

function BlockedGuard({ children }: { children: React.ReactNode }) {
  const { isBlocked, blockMessage, darkMode } = useStore();
  const location = useLocation();

  // Allow admin routes even if blocked
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  if (isBlocked) {
    if (location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }
    
    return (
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 text-center bg-black/60 backdrop-blur-md`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-sm p-8 rounded-[2.5rem] border shadow-2xl ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'} relative`}
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-rose-500" />
          </div>
          
          <h2 className={`text-2xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Account Blocked</h2>
          
          <div className="space-y-4 mb-8">
            <p className={`text-sm font-medium opacity-70 leading-relaxed ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {blockMessage || "Your account has been temporarily suspended."}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return children;
}

function AppContent() {
  const { isQuotaExceeded, darkMode, t } = useStore();
  
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {isQuotaExceeded && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-500 text-white py-1 px-4 text-[10px] font-black uppercase tracking-widest text-center shadow-lg flex items-center justify-center gap-2">
          <AlertCircle size={10} />
          <span>Daily Rate Reached - Using Offline Data</span>
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 underline opacity-80 hover:opacity-100"
          >
            Retry
          </button>
        </div>
      )}
      <HashRouter>
        <ScrollToTop />
        <BlockedGuard>
          <Suspense fallback={null}>
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
          </Suspense>
        </BlockedGuard>
      </HashRouter>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ThemeHandler />
      <ThemedToaster />
      <AppErrorListener />
      <QuotaExceededGuard>
        <AppContent />
      </QuotaExceededGuard>
    </StoreProvider>
  );
}
