import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  ChevronLeft, User, Phone, MapPin, Store, Receipt, 
  ShoppingCart, LogOut, CheckCircle2, Settings, 
  Camera, Save, Sparkles, ChevronRight, Heart, 
  Headphones, Bell, Moon, CreditCard, ShieldCheck,
  Trophy, Trash2, MessageCircle, HelpCircle, Shield, Info,
  Clock, Package, Mail, Calendar, Database, RefreshCw, Share2, QrCode
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeModal } from '../components/ui/QRCodeModal';
import { PRODUCTION_URL } from '../constants';

export default function ProfilePage() {
  const { 
    userName, setUserName, userPhone, setUserPhone, 
    roomNumber, setRoomNumber, supportNumber,
    emailNotificationsEnabled, setEmailNotificationsEnabled,
    points, language, setLanguage, t,
    darkMode, setDarkMode, formatPrice,
    logout, forceSync, isSyncing, uid, addresses, orders, userAvatar,
    userEmail, userBirthday, isAdmin, isQuotaExceeded, resetQuotaExceeded, totalOrders
  } = useStore();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'my', name: 'Myanmar', flag: '🇲🇲' },
  ];

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleWhatsApp = () => {
    const message = encodeURIComponent(t('whatsappSupportMsg').replace('{orderId}', 'General Support'));
    window.open(`https://wa.me/${supportNumber}?text=${message}`, '_blank');
  };

  const handleLogout = async () => {
    try {
      // Set confirm to false first to avoid UI lock
      setShowLogoutConfirm(false);
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout encountered a problem, but your session is clearing.");
      navigate('/', { replace: true });
    }
  };

  const handleResetData = () => {
    setIsResetting(true);
    // Simulate a thorough cleanup process
    setTimeout(() => {
      localStorage.clear();
      // Also clear session storage just in case
      sessionStorage.clear();
      window.location.href = '/'; // Redirect to home/welcome
    }, 1500);
  };

  return (
    <div className={`min-h-screen pb-12 overflow-x-hidden selection:bg-primary/10 ${darkMode ? 'bg-surface text-on-surface' : 'bg-surface text-on-surface'}`}>
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-50 ${darkMode ? 'bg-primary/10' : 'bg-primary/5'}`} />
        <div className={`absolute top-1/2 -left-24 w-72 h-72 rounded-full blur-3xl opacity-50 ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`} />
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl px-4 h-[72px] flex items-center justify-between border-b border-on-surface/5 ${darkMode ? 'bg-surface/80' : 'bg-surface/80'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/menu')}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 text-on-surface-variant ${darkMode ? 'bg-surface-container-high hover:bg-surface-container-highest' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-black text-on-surface tracking-tight">{t('profile')}</h2>
        </div>
      </header>

      <main className="pt-24 px-4 space-y-6 max-w-2xl mx-auto relative z-10">
        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500 text-white px-6 py-4 rounded-[2rem] shadow-xl shadow-emerald-500/20 flex items-center gap-3 justify-center"
            >
              <CheckCircle2 size={20} />
              <span className="text-xs font-black uppercase tracking-widest">{t('profileUpdated')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Identity Card - Horizontal Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${darkMode ? 'bg-surface-container-high' : 'bg-white'} rounded-[2rem] p-6 border border-on-surface/5 shadow-sm relative overflow-hidden group`}
        >
          {/* Background Watermark Icon */}
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] rotate-12 pointer-events-none">
            <Shield size={220} strokeWidth={1} />
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-110 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-surface-container-low rounded-3xl flex items-center justify-center shadow-inner border border-on-surface/5 overflow-hidden group/avatar">
                {userAvatar ? (
                  <img key={userAvatar} src={userAvatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={40} className="text-primary/20" />
                )}
                <div 
                  onClick={() => navigate('/edit-profile')}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera size={18} className="text-white" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 border-2 border-white">
                <Sparkles size={14} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-on-surface tracking-tight truncate">{userName || t('guestUser')}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest truncate">{userPhone || t('noPhoneNumber')}</p>
              </div>

              {userEmail && (
                <div className="flex items-center gap-2 mt-1 opacity-60">
                  <Mail size={10} className="text-blue-500" />
                  <p className="text-on-surface-variant text-[9px] font-bold truncate">{userEmail}</p>
                </div>
              )}

              {userBirthday && (
                <div className="flex items-center gap-2 mt-1 opacity-60">
                  <Calendar size={10} className="text-orange-500" />
                  <p className="text-on-surface-variant text-[9px] font-bold truncate">{userBirthday}</p>
                </div>
              )}
              
              <div className="flex gap-4 mt-3">
                <div 
                  className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => navigate('/orders', { state: { from: 'profile' } })}
                >
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('orders')}</p>
                  <p className="text-sm font-black text-on-surface tracking-tight">{totalOrders || orders.length}</p>
                </div>
                <div className="w-px h-6 bg-on-surface/5 self-end mb-1" />
                <div 
                  className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => navigate('/points')}
                >
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('points')}</p>
                  <p className="text-sm font-black text-primary tracking-tight">{points.toLocaleString()} <span className="text-[10px] text-on-surface-variant/60 font-medium">({formatPrice(points / 500)})</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Order Shortcut */}
          {orders.length > 0 && (
            <div className="mt-6 pt-4 border-t border-on-surface/5">
              {(() => {
                const recentOrder = orders[0]; // Already sorted by createdAt desc in StoreContext

                if (!recentOrder) return null;

                const statusColors: Record<string, string> = {
                  pending: 'text-amber-500 bg-amber-500/10',
                  packing: 'text-blue-500 bg-blue-500/10',
                  delivered: 'text-emerald-500 bg-emerald-500/10',
                  cancelled: 'text-red-500 bg-red-500/10'
                };

                const statusIcons: Record<string, any> = {
                  pending: Clock,
                  packing: Package,
                  delivered: CheckCircle2,
                  cancelled: Trash2
                };

                const StatusIcon = statusIcons[recentOrder.status] || Clock;

                return (
                  <div 
                    onClick={() => navigate(`/orders/${recentOrder.id}`)}
                    className="flex items-center justify-between group/order cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[recentOrder.status]}`}>
                        <StatusIcon size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('recentOrder')}</p>
                        <p className="text-[10px] font-bold text-on-surface">#{recentOrder.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight ${statusColors[recentOrder.status]}`}>
                        {t(`status${recentOrder.status.charAt(0).toUpperCase() + recentOrder.status.slice(1)}`)}
                      </span>
                      <ChevronRight size={14} className="text-on-surface-variant/20 group-hover/order:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: Receipt, label: t('history'), color: 'bg-blue-500/10 text-blue-500', onClick: () => navigate('/orders', { state: { from: 'profile' } }) },
            { icon: Heart, label: t('favorites'), color: 'bg-rose-500/10 text-rose-500', onClick: () => navigate('/favorites') },
            { icon: Trophy, label: t('points'), color: 'bg-amber-500/10 text-amber-500', onClick: () => navigate('/points') },
            { icon: Share2, label: 'Share', color: 'bg-indigo-500/10 text-indigo-500', onClick: () => setShowQRModal(true) },
            { icon: Headphones, label: t('support'), color: 'bg-emerald-500/10 text-emerald-500', onClick: handleWhatsApp },
          ].map((action, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              onClick={action.onClick}
              className={`${darkMode ? 'bg-surface-container-high' : 'bg-white'} p-3 rounded-[1.25rem] border border-on-surface/5 shadow-sm flex flex-col items-center gap-1.5 active:scale-95 transition-all`}
            >
              <div className={`w-9 h-9 ${action.color} rounded-xl flex items-center justify-center`}>
                <action.icon size={18} />
              </div>
              <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest leading-none">{action.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Account Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="px-2">
            <h2 className="text-on-surface-variant/60 font-black text-[10px] uppercase tracking-[0.2em]">{t('personalInfo')}</h2>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-on-surface/5 shadow-sm divide-y divide-on-surface/5">
            <div 
              onClick={() => navigate('/edit-profile')}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('editProfile')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('updateProfileDesc')}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30" />
            </div>

            <div 
              onClick={() => navigate('/address-management')}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/5 rounded-xl flex items-center justify-center text-orange-500">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('savedAddresses')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{addresses.length} {t('locations')}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30" />
            </div>

            {uid && (
              <div 
                onClick={forceSync}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSyncing ? 'bg-primary/20 text-primary' : 'bg-primary/5 text-primary'}`}>
                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{t('syncAccountData') || 'Sync Account Data'}</p>
                    <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Restore Likes & History'}</p>
                  </div>
                </div>
                <RefreshCw size={14} className={`text-on-surface-variant/30 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
            )}
          </div>
        </motion.section>

        {/* Preferences Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="px-2">
            <h2 className="text-on-surface-variant/60 font-black text-[10px] uppercase tracking-[0.2em]">{t('preferences')}</h2>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-on-surface/5 shadow-sm divide-y divide-on-surface/5">
            <div 
              onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-500/5 rounded-xl flex items-center justify-center text-purple-500">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('emailNotifications')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('orderUpdatesDesc')}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative p-1 transition-colors duration-300 ${emailNotificationsEnabled ? 'bg-primary' : 'bg-surface-container-high'}`}>
                <motion.div 
                  animate={{ x: emailNotificationsEnabled ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-3 h-3 bg-white rounded-full shadow-sm" 
                />
              </div>
            </div>

            {/* Language Preference */}
            <div 
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-600">
                  <Info size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('language')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('languagesDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-primary uppercase">{currentLanguage.code}</span>
                <ChevronRight size={16} className="text-on-surface-variant/30" />
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div 
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-500/5 rounded-xl flex items-center justify-center text-slate-500">
                  <Moon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('darkMode')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('toggleThemeDesc')}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative p-1 transition-colors duration-300 ${darkMode ? 'bg-primary' : 'bg-surface-container-high'}`}>
                <motion.div 
                  animate={{ x: darkMode ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-3 h-3 bg-white rounded-full shadow-sm" 
                />
              </div>
            </div>

            <div 
              onClick={() => navigate('/security')}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500/5 rounded-xl flex items-center justify-center text-indigo-500">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('security')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('privacySettingsDesc')}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30" />
            </div>
          </div>
        </motion.section>

        {/* Support & Legal Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="px-2">
            <h2 className="text-on-surface-variant/60 font-black text-[10px] uppercase tracking-[0.2em]">{t('support')} & {t('legal')}</h2>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-on-surface/5 shadow-sm divide-y divide-on-surface/5">
            <div onClick={handleWhatsApp} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/5 rounded-xl flex items-center justify-center text-[#25D366]">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('support')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('whatsappSupportDesc')}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30" />
            </div>

            <div onClick={() => navigate('/help-center')} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sky-500/5 rounded-xl flex items-center justify-center text-sky-500">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('helpCenter')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('faqsDesc')}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30" />
            </div>

            <div onClick={() => navigate('/privacy-policy')} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-500/5 rounded-xl flex items-center justify-center text-red-500">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('privacyPolicy')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('privacyDataDesc')}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30" />
            </div>

            <div onClick={() => navigate('/about-us')} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-500/5 rounded-xl flex items-center justify-center text-gray-500">
                  <Info size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('aboutUs')}</p>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('version')} 3.2.1</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30" />
            </div>
          </div>
        </motion.section>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pb-24 pt-6 flex justify-center relative z-20"
        >
          <button 
            type="button"
            onClick={() => {
              console.log("Logout triggered");
              setShowLogoutConfirm(true);
            }}
            className={`flex items-center justify-center gap-2 px-10 py-4 rounded-[2rem] font-black text-xs transition-all active:scale-95 border shadow-lg ${darkMode ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 shadow-red-500/5'}`}
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </motion.div>

        {/* Modals */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-surface-container-lowest w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                  <LogOut size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-on-surface tracking-tight">{t('logoutConfirm')}</h3>
                  <p className="text-xs font-bold text-on-surface-variant/60 leading-relaxed">
                    {t('logoutMessage')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="py-4 rounded-2xl font-black text-xs text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="py-4 rounded-2xl font-black text-xs text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                  >
                    {t('logout')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showResetConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowResetConfirm(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-surface-container-lowest w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-on-surface tracking-tight">{t('resetDataConfirm')}</h3>
                  <p className="text-xs font-bold text-on-surface-variant/60 leading-relaxed">
                    {t('resetDataMessage')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    disabled={isResetting}
                    onClick={() => setShowResetConfirm(false)}
                    className="py-4 rounded-2xl font-black text-xs text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    disabled={isResetting}
                    onClick={handleResetData}
                    className="py-4 rounded-2xl font-black text-xs text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isResetting ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {t('resetting')}
                      </>
                    ) : (
                      t('reset')
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showLanguageModal && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLanguageModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative bg-surface-container-lowest w-full max-w-lg p-8 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-on-surface tracking-tight">{t('language')}</h3>
                    <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{t('selectPreference')}</p>
                  </div>
                  <button 
                    onClick={() => setShowLanguageModal(false)}
                    className="w-10 h-10 bg-surface-container-low rounded-2xl flex items-center justify-center text-on-surface-variant active:scale-90 transition-all"
                  >
                    <ChevronLeft size={20} className="rotate-[-90deg]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLanguageModal(false);
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        language === lang.code 
                          ? 'border-primary bg-primary/5' 
                          : 'border-on-surface/5 bg-surface-container-low/30 hover:border-on-surface/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{lang.flag}</span>
                        <span className={`text-sm font-bold ${language === lang.code ? 'text-primary' : 'text-on-surface'}`}>
                          {lang.name}
                        </span>
                      </div>
                      {language === lang.code && (
                        <CheckCircle2 size={18} className="text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <QRCodeModal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)} 
        url={PRODUCTION_URL}
        title="Share App"
        subtitle="Invite friends to shop"
        darkMode={darkMode}
      />
    </div>
  );
}
