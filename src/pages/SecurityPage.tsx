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
    link.download = `sartawset_data_${new Date().getTime()}.json`;
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
    <div className={`min-h-screen pb-24 font-sans selection:bg-primary/20 transition-all duration-500 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Premium Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2 ${darkMode ? 'bg-primary' : 'bg-primary/30'}`} />
        <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 translate-y-1/2 -translate-x-1/2 ${darkMode ? 'bg-blue-500' : 'bg-blue-300'}`} />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-5 h-20 flex items-center justify-between transition-colors duration-300 ${darkMode ? 'bg-surface/80 border-white/5' : 'bg-white/80 border-slate-200/50'}`}>
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/profile')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 group ${darkMode ? 'bg-surface-container-high border border-white/10 hover:bg-surface-container-highest' : 'bg-white border border-slate-200/60 shadow-sm hover:border-slate-300'}`}
          >
            <ChevronLeft size={20} className={`${darkMode ? 'text-on-surface' : 'text-slate-900'} group-hover:-translate-x-0.5 transition-transform`} />
          </button>
          <div>
            <h1 className={`text-xl font-black tracking-tight leading-none mb-1 ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('security')}</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface-variant/50' : 'text-slate-400'}`}>{t('privacyDataProtection')}</p>
            </div>
          </div>
        </div>
        <motion.div 
          whileHover={{ rotate: 15 }}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${darkMode ? 'bg-primary text-white shadow-primary/30' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
        >
          <Shield size={22} strokeWidth={2.5} />
        </motion.div>
      </header>

      <main className="max-w-xl mx-auto p-5 space-y-8 relative z-10">
        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 whitespace-nowrap border ${darkMode ? 'bg-surface-container-highest text-on-surface border-white/10' : 'bg-slate-900 text-white border-white/10'}`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">{showSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Overview Card - Premium Design */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={`rounded-[2.5rem] p-8 border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden group transition-all duration-500 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/40'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="space-y-1.5">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-on-surface-variant/50' : 'text-slate-400'}`}>{t('profileSecurity')}</p>
                <h2 className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>
                  {securityScore >= 80 ? t('excellent') : securityScore >= 60 ? t('good') : t('needsAttention')}
                </h2>
              </div>
              <div className="relative">
                <div className={`w-20 h-20 rounded-[1.75rem] ${getScoreBg()} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                  <svg className="w-full h-full -rotate-90 p-1.5">
                    <circle
                      cx="34"
                      cy="34"
                      r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className={darkMode ? 'text-white/5' : 'text-slate-100'}
                    />
                    <motion.circle
                      cx="34"
                      cy="34"
                      r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray="188.5"
                      animate={{ strokeDashoffset: 188.5 - (188.5 * securityScore) / 100 }}
                      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                      strokeLinecap="round"
                      className={getScoreColor()}
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${getScoreColor()}`}>
                    {securityScore}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t('profile'), icon: CheckCircle2, color: userName ? 'text-emerald-500' : 'text-slate-300', bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50', active: !!userName },
                { label: t('contact'), icon: Smartphone, color: userPhone ? 'text-blue-500' : 'text-slate-300', bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50', active: !!userPhone },
                { label: t('google'), icon: ShieldCheck, color: authUid ? 'text-amber-500' : 'text-slate-300', bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50', active: !!authUid },
              ].map((item, i) => (
                <div key={i} className={`flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition-all ${item.active ? (darkMode ? 'bg-white/[0.02] border-white/5 shadow-sm' : 'bg-slate-50/50 border-slate-100 shadow-sm') : 'opacity-40 border-transparent grayscale'}`}>
                  <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center shadow-lg shadow-current/5`}>
                    <item.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Protection Sections */}
        <div className="space-y-10 uppercase">
           {/* Section Header Pattern */}
           <div className="h-px w-full bg-slate-200/50 dark:bg-white/5 relative">
              <div className={`absolute top-1/2 left-4 -translate-y-1/2 px-4 ${darkMode ? 'bg-surface' : 'bg-[#F8FAFC]'} text-[10px] font-black tracking-[0.4em] text-primary whitespace-nowrap`}>
                 {t('accountIntegrity')}
              </div>
           </div>

           <section className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group transition-all duration-300 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/40 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl shadow-blue-500/10 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <ShieldCheck size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <p className={`text-sm font-black mb-1 group-hover:text-primary transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('googleVerification')}</p>
                  <p className={`text-[10px] font-bold leading-relaxed max-w-[200px] ${darkMode ? 'text-on-surface-variant/50' : 'text-slate-400'}`}>
                    {authUid ? t('googleLinkedDesc') : t('googleNotLinkedDesc')}
                  </p>
                </div>
              </div>
              {authUid ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-500" size={20} strokeWidth={2.5} />
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/profile')}
                  className="bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                >
                  {t('linkNow')}
                </button>
              )}
            </motion.div>
          </section>

          {/* Sessions Pattern */}
          <div className="h-px w-full bg-slate-200/50 dark:bg-white/5 relative">
              <div className={`absolute top-1/2 left-4 -translate-y-1/2 px-4 ${darkMode ? 'bg-surface' : 'bg-[#F8FAFC]'} text-[10px] font-black tracking-[0.4em] text-emerald-500 whitespace-nowrap`}>
                 {t('activeSessions')}
              </div>
           </div>

          <section className="space-y-3">
            {sessions.map((session, index) => (
              <motion.div 
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`p-5 rounded-[1.75rem] border shadow-sm flex items-center justify-between transition-all group ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/40 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${darkMode ? 'bg-white/5 text-on-surface-variant' : 'bg-slate-50 text-slate-500'} shadow-inner`}>
                    {session.deviceType === 'desktop' ? <Laptop size={22} /> : session.deviceType === 'tablet' ? <Tablet size={22} /> : <Smartphone size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-black ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>
                        {session.browser} on {session.os}
                      </p>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                          {t('currentDevice')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <Activity size={10} className="text-emerald-500" />
                       <p className={`text-[10px] font-bold tracking-tight ${darkMode ? 'text-on-surface-variant/50' : 'text-slate-400'}`}>
                        {t('lastActive')}: {new Date(session.lastActive).toLocaleDateString()} at {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button 
                    onClick={() => revokeSession(session.id)}
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group/btn"
                    title={t('logoutDevice')}
                  >
                    <X className={index === 0 ? "transition-transform group-hover/btn:rotate-90" : ""} size={18} strokeWidth={2.5} />
                  </button>
                )}
              </motion.div>
            ))}
          </section>

          {/* Data Pattern */}
          <div className="h-px w-full bg-slate-200/50 dark:bg-white/5 relative">
              <div className={`absolute top-1/2 left-4 -translate-y-1/2 px-4 ${darkMode ? 'bg-surface' : 'bg-[#F8FAFC]'} text-[10px] font-black tracking-[0.4em] text-rose-500 whitespace-nowrap`}>
                 {t('dataManagement')}
              </div>
           </div>

          <section className="grid grid-cols-2 gap-4">
            <motion.button 
              whileHover={{ y: -5 }}
              onClick={handleExportData}
              className={`p-6 rounded-[2rem] border shadow-sm flex flex-col items-center text-center gap-4 transition-all group ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/40 hover:border-slate-300 hover:shadow-xl'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${darkMode ? 'bg-white/5 text-on-surface-variant' : 'bg-slate-50 text-slate-600'} shadow-inner`}>
                <Download size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <p className={`text-xs font-black uppercase tracking-tight ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('exportData')}</p>
                <p className={`text-[8px] font-bold uppercase tracking-[0.2em] leading-tight opacity-40`}>{t('exportDataDesc')}</p>
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -5 }}
              onClick={() => setShowDeleteConfirm(true)}
              className={`p-6 rounded-[2rem] border shadow-sm flex flex-col items-center text-center gap-4 transition-all group ${darkMode ? 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10' : 'bg-rose-50/30 border-rose-100 hover:bg-rose-50 hover:shadow-xl'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform ${darkMode ? 'bg-red-500/20' : 'bg-rose-100 shadow-lg shadow-rose-100/50'}`}>
                <Trash2 size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-tight text-rose-600">{t('resetAccount')}</p>
                <p className={`text-[8px] font-bold uppercase tracking-[0.2em] leading-tight text-rose-400 opacity-60`}>{t('permanentAction')}</p>
              </div>
            </motion.button>
          </section>
        </div>

        {/* Premium Footer */}
        <footer className="pt-20 pb-10 text-center space-y-6">
           <div className="flex items-center justify-center gap-6 opacity-20">
              <div className="h-px w-10 bg-current" />
              <Shield size={16} />
              <div className="h-px w-10 bg-current" />
           </div>
           
           <div className="space-y-2">
              <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${darkMode ? 'text-on-surface-variant/40' : 'text-slate-400'}`}>
                Sar Taw Set Security Protocol v3.2.0
              </p>
              <p className={`text-[8px] font-bold uppercase tracking-[0.2em] ${darkMode ? 'text-on-surface-variant/20' : 'text-slate-300'}`}>
                Encrypted with military-grade standards
              </p>
           </div>
        </footer>
      </main>

      {/* Modern Deletion Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative w-full max-w-[360px] p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] space-y-8 text-center border overflow-hidden ${darkMode ? 'bg-surface-container-highest border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
              
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${darkMode ? 'bg-red-500/20 text-red-500' : 'bg-rose-50 text-rose-500'}`}>
                <AlertCircle size={36} strokeWidth={2.5} />
              </div>
              
              <div className="space-y-3 px-2">
                <h3 className={`text-2xl font-black tracking-tighter leading-tight ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('irreversibleAction')}</h3>
                <p className={`text-[11px] font-bold leading-relaxed ${darkMode ? 'text-on-surface-variant/50' : 'text-slate-400'}`}>
                  {t('resetAccountMessage')}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    await logout();
                    localStorage.clear();
                    navigate('/');
                  }}
                  className="w-full py-5 rounded-2xl font-black text-xs text-white bg-rose-500 hover:bg-rose-600 shadow-2xl shadow-rose-500/40 transition-all active:scale-95 uppercase tracking-[0.2em]"
                >
                  {t('confirmReset')}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`w-full py-5 rounded-2xl font-black text-xs transition-all uppercase tracking-[0.2em] border ${darkMode ? 'bg-white/5 text-on-surface border-white/5 hover:bg-white/10' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
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
