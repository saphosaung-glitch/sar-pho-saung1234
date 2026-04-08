import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  ChevronLeft, ShieldCheck, Lock, Eye, EyeOff, 
  Database, Trash2, Download, ShieldAlert, 
  Smartphone, Fingerprint, History, Info,
  CheckCircle2, AlertCircle, Shield, ChevronRight,
  Activity, Zap, Monitor, Laptop, Tablet, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SecurityPage() {
  const navigate = useNavigate();
  const { 
    twoFactorEnabled, setTwoFactorEnabled,
    biometricEnabled, setBiometricEnabled,
    dataSharingEnabled, setDataSharingEnabled,
    stealthModeEnabled, setStealthModeEnabled,
    userName, userPhone, roomNumber, orders,
    favorites, notifications, paymentMethods,
    darkMode, t
  } = useStore();

  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [securityScore, setSecurityScore] = useState(65);

  useEffect(() => {
    let score = 30;
    if (twoFactorEnabled) score += 30;
    if (biometricEnabled) score += 20;
    if (!stealthModeEnabled) score += 10; 
    if (dataSharingEnabled) score += 10;
    setSecurityScore(score);
  }, [twoFactorEnabled, biometricEnabled, dataSharingEnabled, stealthModeEnabled]);

  const triggerToast = (message: string) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handleExportData = () => {
    const userData = {
      profile: { name: userName, phone: userPhone, room: roomNumber },
      orders,
      favorites,
      notifications,
      paymentMethods: paymentMethods.map(pm => ({ ...pm, last4: '****' })), 
      securitySettings: {
        twoFactorEnabled,
        biometricEnabled,
        dataSharingEnabled,
        stealthModeEnabled
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saphosaung_data_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    triggerToast(t('dataExported'));
  };

  const getScoreColor = () => {
    if (securityScore >= 90) return 'text-emerald-500';
    if (securityScore >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = () => {
    if (securityScore >= 90) return 'bg-emerald-500/10';
    if (securityScore >= 70) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  const sessions = [
    { id: 1, device: t('iphone15Pro'), location: t('yangonMyanmar'), status: t('currentDevice'), icon: Smartphone, time: t('activeNow') },
    { id: 2, device: t('macbookAirM2'), location: t('mandalayMyanmar'), status: t('authorized'), icon: Laptop, time: t('hoursAgo') },
    { id: 3, device: t('ipadPro'), location: t('yangonMyanmar'), status: t('authorized'), icon: Tablet, time: t('yesterday') },
  ];

  return (
    <div className={`min-h-screen pb-24 selection:bg-primary/10 transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#FAFAFA] text-gray-900'}`}>
      {/* Premium Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b px-6 h-[80px] flex items-center justify-between transition-colors duration-300 ${darkMode ? 'bg-surface/70 border-white/5' : 'bg-white/70 border-black/[0.03]'}`}>
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/profile')}
            className={`w-11 h-11 border shadow-sm rounded-2xl flex items-center justify-center transition-all active:scale-95 group ${darkMode ? 'bg-surface-container border-white/10 hover:bg-surface-container-high' : 'bg-white border-black/5 hover:bg-gray-50'}`}
          >
            <ChevronLeft size={22} className={`${darkMode ? 'text-on-surface' : 'text-gray-900'} group-hover:-translate-x-0.5 transition-transform`} />
          </button>
          <div>
            <h1 className={`text-xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('security')}</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('privacyDataProtection')}</p>
            </div>
          </div>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300 ${darkMode ? 'bg-primary text-white shadow-primary/20' : 'bg-gray-900 text-white shadow-gray-900/20'}`}>
          <Shield size={20} />
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-10">
        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 whitespace-nowrap border ${darkMode ? 'bg-surface-container-highest text-on-surface border-white/10' : 'bg-gray-900 text-white border-white/10'}`}
            >
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{showSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Score Card */}
        <section>
          <div className={`rounded-[2.5rem] p-8 border shadow-[0_8px_40px_rgba(0,0,0,0.02)] relative overflow-hidden group transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('securityStatus')}</p>
                <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>
                  {securityScore >= 90 ? t('excellent') : securityScore >= 70 ? t('good') : t('needsAttention')}
                </h2>
              </div>
              <div className={`w-16 h-16 rounded-3xl ${getScoreBg()} flex items-center justify-center relative`}>
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className={darkMode ? 'text-white/5' : 'text-gray-100'}
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="175.9"
                    animate={{ strokeDashoffset: 175.9 - (175.9 * securityScore) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={getScoreColor()}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${getScoreColor()}`}>
                  {securityScore}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t('encrypted'), icon: Lock, color: 'text-blue-500', bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50' },
                { label: t('verified'), icon: CheckCircle2, color: 'text-emerald-500', bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50' },
                { label: t('active'), icon: Zap, color: 'text-amber-500', bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                    <item.icon size={18} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Security Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Lock size={16} />
              </div>
              <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('accountSecurity')}</h2>
            </div>
          </div>

          <div className="space-y-3">
            {/* Two-Factor Auth */}
            <div className={`p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <Smartphone size={24} />
                </div>
                <div>
                  <p className={`text-sm font-black mb-0.5 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('twoFactorAuth')}</p>
                  <p className={`text-[10px] font-bold leading-relaxed max-w-[180px] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('twoFactorDesc')}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  triggerToast(twoFactorEnabled ? t('disabled') : t('enabled'));
                }}
                className={`w-14 h-7 rounded-full relative transition-all duration-500 p-1 ${twoFactorEnabled ? 'bg-primary' : darkMode ? 'bg-white/10' : 'bg-gray-100'}`}
              >
                <motion.div 
                  animate={{ x: twoFactorEnabled ? 28 : 0 }}
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            {/* Biometric Lock */}
            <div className={`p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                  <Fingerprint size={24} />
                </div>
                <div>
                  <p className={`text-sm font-black mb-0.5 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('biometricAccess')}</p>
                  <p className={`text-[10px] font-bold leading-relaxed max-w-[180px] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('biometricDesc')}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setBiometricEnabled(!biometricEnabled);
                  triggerToast(biometricEnabled ? t('disabled') : t('enabled'));
                }}
                className={`w-14 h-7 rounded-full relative transition-all duration-500 p-1 ${biometricEnabled ? 'bg-primary' : darkMode ? 'bg-white/10' : 'bg-gray-100'}`}
              >
                <motion.div 
                  animate={{ x: biometricEnabled ? 28 : 0 }}
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            {/* Login History */}
            <button 
              onClick={() => setShowSessions(true)}
              className={`w-full p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <Activity size={24} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-black mb-0.5 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('activeSessions')}</p>
                  <p className={`text-[10px] font-bold leading-relaxed max-w-[180px] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('activeSessionsDesc')}</p>
                </div>
              </div>
              <ChevronRight size={18} className={`${darkMode ? 'text-on-surface-variant/30' : 'text-gray-300'} group-hover:text-primary transition-colors`} />
            </button>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <Eye size={16} />
            </div>
            <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('privacyControl')}</h2>
          </div>

          <div className="space-y-3">
            {/* Data Sharing */}
            <div className={`p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <Database size={24} />
                </div>
                <div>
                  <p className={`text-sm font-black mb-0.5 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('usageAnalytics')}</p>
                  <p className={`text-[10px] font-bold leading-relaxed max-w-[180px] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('usageAnalyticsDesc')}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setDataSharingEnabled(!dataSharingEnabled);
                  triggerToast(dataSharingEnabled ? t('disabled') : t('enabled'));
                }}
                className={`w-14 h-7 rounded-full relative transition-all duration-500 p-1 ${dataSharingEnabled ? 'bg-primary' : darkMode ? 'bg-white/10' : 'bg-gray-100'}`}
              >
                <motion.div 
                  animate={{ x: dataSharingEnabled ? 28 : 0 }}
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            {/* Profile Visibility */}
            <div className={`p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                  <EyeOff size={24} />
                </div>
                <div>
                  <p className={`text-sm font-black mb-0.5 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('stealthMode')}</p>
                  <p className={`text-[10px] font-bold leading-relaxed max-w-[180px] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('stealthModeDesc')}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setStealthModeEnabled(!stealthModeEnabled);
                  triggerToast(stealthModeEnabled ? t('disabled') : t('enabled'));
                }}
                className={`w-14 h-7 rounded-full relative transition-all duration-500 p-1 ${stealthModeEnabled ? 'bg-primary' : darkMode ? 'bg-white/10' : 'bg-gray-100'}`}
              >
                <motion.div 
                  animate={{ x: stealthModeEnabled ? 28 : 0 }}
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-red-500/20 text-red-500' : 'bg-red-500/10 text-red-500'}`}>
              <ShieldAlert size={16} />
            </div>
            <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('dataManagement')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleExportData}
              className={`p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary/20 transition-all group ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${darkMode ? 'bg-white/5 text-on-surface-variant' : 'bg-gray-50 text-gray-600'}`}>
                <Download size={24} />
              </div>
              <div>
                <p className={`text-xs font-black mb-1 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('exportData')}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest leading-tight ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('exportDataDesc')}</p>
              </div>
            </button>

            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className={`p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center gap-4 transition-all group ${darkMode ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50/50 border-red-100 hover:bg-red-50'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <Trash2 size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-red-600 mb-1">{t('deleteAccount')}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest leading-tight ${darkMode ? 'text-red-400/60' : 'text-red-400'}`}>{t('permanentAction')}</p>
              </div>
            </button>
          </div>
        </section>
      </main>

      {/* Active Sessions Modal */}
      <AnimatePresence>
        {showSessions && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSessions(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={`relative w-full max-w-md p-8 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl space-y-8 ${darkMode ? 'bg-surface-container-lowest' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('activeSessions')}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('manageDevices')}</p>
                </div>
                <button 
                  onClick={() => setShowSessions(false)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-white/5 text-on-surface-variant hover:text-on-surface' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className={`flex items-center justify-between p-4 rounded-3xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/[0.03]'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${darkMode ? 'bg-surface-container text-on-surface-variant' : 'bg-white text-gray-400'}`}>
                        <session.icon size={22} />
                      </div>
                      <div>
                        <p className={`text-sm font-black ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{session.device}</p>
                        <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{session.location} • {session.time}</p>
                      </div>
                    </div>
                    {session.id === 1 ? (
                      <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-widest">{t('active')}</span>
                    ) : (
                      <button className="text-[8px] font-black text-red-500 hover:underline uppercase tracking-widest">{t('logout')}</button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  triggerToast(t('loggedOutAllDevices'));
                  setShowSessions(false);
                }}
                className={`w-full py-5 rounded-2xl font-black text-xs transition-all shadow-xl ${darkMode ? 'bg-primary text-white shadow-primary/20 hover:bg-primary/90' : 'bg-gray-900 text-white shadow-gray-200 hover:bg-gray-800'}`}
              >
                {t('logoutAllDevices')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-sm p-10 rounded-[3rem] shadow-2xl space-y-10 text-center border ${darkMode ? 'bg-surface-container-lowest border-white/5' : 'bg-white border-black/5'}`}
            >
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner ${darkMode ? 'bg-red-500/20 text-red-500' : 'bg-red-50 text-red-500'}`}>
                <AlertCircle size={48} />
              </div>
              <div className="space-y-4">
                <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('irreversibleAction')}</h3>
                <p className={`text-xs font-bold leading-relaxed px-4 ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>
                  {t('deleteAccountMessage')}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    localStorage.clear();
                    navigate('/');
                  }}
                  className="w-full py-5 rounded-2xl font-black text-xs text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95"
                >
                  {t('confirmDeletion')}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`w-full py-5 rounded-2xl font-black text-xs transition-colors ${darkMode ? 'bg-white/5 text-on-surface-variant hover:bg-white/10' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  {t('keepAccount')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
