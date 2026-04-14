import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  ChevronLeft, ShieldCheck, Lock, Eye, EyeOff, 
  Database, Trash2, Download, ShieldAlert, 
  Smartphone, Fingerprint, History, Info,
  CheckCircle2, AlertCircle, Shield, ChevronRight, XCircle,
  Activity, Zap, Monitor, Laptop, Tablet, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SecurityPage() {
  const navigate = useNavigate();
  const { 
    userName, userPhone, roomNumber, orders,
    favorites, notifications, paymentMethods,
    darkMode, t, authUid, userEmail, logout,
    sessions, revokeSession
  } = useStore();

  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    let score = 0;
    if (userName) score += 20;
    if (userPhone) score += 20;
    if (userEmail) score += 20;
    if (roomNumber) score += 20;
    if (authUid) score += 20; // Google Account Linked
    setSecurityScore(score);
  }, [userName, userPhone, userEmail, roomNumber, authUid]);

  const triggerToast = (message: string) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handleExportData = () => {
    const userData = {
      profile: { name: userName, phone: userPhone, room: roomNumber, email: userEmail },
      orders,
      favorites,
      notifications,
      paymentMethods: paymentMethods.map(pm => ({ ...pm, last4: '****' })), 
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
    if (securityScore >= 80) return 'text-emerald-500';
    if (securityScore >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = () => {
    if (securityScore >= 80) return 'bg-emerald-500/10';
    if (securityScore >= 60) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className={`min-h-screen pb-24 selection:bg-primary/10 transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#FAFAFA] text-gray-900'}`}>
      {/* Premium Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b px-5 h-[64px] flex items-center justify-between transition-colors duration-300 ${darkMode ? 'bg-surface/70 border-white/5' : 'bg-white/70 border-black/[0.03]'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/profile')}
            className={`w-9 h-9 border shadow-sm rounded-xl flex items-center justify-center transition-all active:scale-95 group ${darkMode ? 'bg-surface-container border-white/10 hover:bg-surface-container-high' : 'bg-white border-black/5 hover:bg-gray-50'}`}
          >
            <ChevronLeft size={18} className={`${darkMode ? 'text-on-surface' : 'text-gray-900'} group-hover:-translate-x-0.5 transition-transform`} />
          </button>
          <div>
            <h1 className={`text-lg font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('security')}</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              <p className={`text-[8px] font-black uppercase tracking-[0.15em] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('privacyDataProtection')}</p>
            </div>
          </div>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300 ${darkMode ? 'bg-primary text-white shadow-primary/20' : 'bg-gray-900 text-white shadow-gray-900/20'}`}>
          <Shield size={18} />
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
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
          <div className={`rounded-[2rem] p-5 border shadow-[0_8px_40px_rgba(0,0,0,0.02)] relative overflow-hidden group transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('profileSecurity')}</p>
                <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>
                  {securityScore >= 80 ? t('excellent') : securityScore >= 60 ? t('good') : t('needsAttention')}
                </h2>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${getScoreBg()} flex items-center justify-center relative`}>
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className={darkMode ? 'text-white/5' : 'text-gray-100'}
                  />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeDasharray="150.8"
                    animate={{ strokeDashoffset: 150.8 - (150.8 * securityScore) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={getScoreColor()}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${getScoreColor()}`}>
                  {securityScore}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('profile'), icon: CheckCircle2, color: userName ? 'text-emerald-500' : 'text-gray-300', bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50' },
                { label: t('contact'), icon: Smartphone, color: userPhone ? 'text-emerald-500' : 'text-gray-300', bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50' },
                { label: t('google'), icon: ShieldCheck, color: authUid ? 'text-emerald-500' : 'text-gray-300', bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                    <item.icon size={14} />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Integrity Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${darkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Lock size={14} />
              </div>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('accountIntegrity')}</h2>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`p-4 rounded-[1.5rem] border shadow-sm flex items-center justify-between group transition-all ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className={`text-xs font-black mb-0.5 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('googleVerification')}</p>
                  <p className={`text-[9px] font-bold leading-relaxed max-w-[160px] ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>
                    {authUid ? t('googleLinkedDesc') : t('googleNotLinkedDesc')}
                  </p>
                </div>
              </div>
              {authUid ? (
                <CheckCircle2 className="text-emerald-500" size={20} />
              ) : (
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {t('linkNow')}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Active Sessions Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${darkMode ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <History size={14} />
            </div>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('activeSessions')}</h2>
          </div>

          <div className="space-y-2">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className={`p-4 rounded-[1.5rem] border shadow-sm flex items-center justify-between transition-all ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-white/5 text-on-surface-variant' : 'bg-gray-50 text-gray-600'}`}>
                    {session.deviceType === 'desktop' ? <Laptop size={18} /> : session.deviceType === 'tablet' ? <Tablet size={18} /> : <Smartphone size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-black ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>
                        {session.browser} on {session.os}
                      </p>
                      {session.isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-wider">
                          {t('currentDevice')}
                        </span>
                      )}
                    </div>
                    <p className={`text-[9px] font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>
                      {t('lastActive')}: {new Date(session.lastActive).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button 
                    onClick={() => revokeSession(session.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                    title={t('logoutDevice')}
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Data Management Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${darkMode ? 'bg-red-500/20 text-red-500' : 'bg-red-500/10 text-red-500'}`}>
              <ShieldAlert size={14} />
            </div>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('dataManagement')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleExportData}
              className={`p-4 rounded-[1.5rem] border shadow-sm flex flex-col items-center text-center gap-3 hover:border-primary/20 transition-all group ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-black/[0.03]'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${darkMode ? 'bg-white/5 text-on-surface-variant' : 'bg-gray-50 text-gray-600'}`}>
                <Download size={20} />
              </div>
              <div>
                <p className={`text-[11px] font-black mb-0.5 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('exportData')}</p>
                <p className={`text-[8px] font-bold uppercase tracking-widest leading-tight ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('exportDataDesc')}</p>
              </div>
            </button>

            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className={`p-4 rounded-[1.5rem] border shadow-sm flex flex-col items-center text-center gap-3 transition-all group ${darkMode ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50/50 border-red-100 hover:bg-red-50'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <Trash2 size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-red-600 mb-0.5">{t('resetAccount')}</p>
                <p className={`text-[8px] font-bold uppercase tracking-widest leading-tight ${darkMode ? 'text-red-400/60' : 'text-red-400'}`}>{t('permanentAction')}</p>
              </div>
            </button>
          </div>
        </section>
      </main>

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
              className={`relative w-full max-w-[320px] p-6 rounded-[2rem] shadow-2xl space-y-6 text-center border ${darkMode ? 'bg-surface-container-lowest border-white/5' : 'bg-white border-black/5'}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${darkMode ? 'bg-red-500/20 text-red-500' : 'bg-red-50 text-red-500'}`}>
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className={`text-xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('irreversibleAction')}</h3>
                <p className={`text-[10px] font-bold leading-relaxed px-2 ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>
                  {t('resetAccountMessage')}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={async () => {
                    await logout();
                    localStorage.clear();
                    navigate('/');
                  }}
                  className="w-full py-4 rounded-xl font-black text-[10px] text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95 uppercase tracking-widest"
                >
                  {t('confirmReset')}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`w-full py-4 rounded-xl font-black text-[10px] transition-colors uppercase tracking-widest ${darkMode ? 'bg-white/5 text-on-surface-variant hover:bg-white/10' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
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
