import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { User, Phone, Sparkles, ChevronRight } from 'lucide-react';

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { userName, userPhone, setUserName, setUserPhone, isProfileLoaded, darkMode, t } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const location = useLocation();

  // Handle navigation after profile is loaded
  React.useEffect(() => {
    if (isCheckingAccount && isProfileLoaded) {
      console.log("RegistrationPage: Profile loaded, checking if user exists", { userName, userPhone });
      
      // If userName is still empty after sync, it's a new user, so set the name they entered
      if (!userName && pendingName) {
        console.log("RegistrationPage: New user, setting name:", pendingName);
        setUserName(pendingName);
      } else if (userName) {
        console.log("RegistrationPage: Existing user found:", userName);
      }
      
      setIsCheckingAccount(false);
      setIsSubmitting(false);
      
      const from = location.state?.from?.pathname || '/menu';
      console.log("RegistrationPage: Navigating to", from);
      navigate(from, { replace: true });
    }
  }, [isCheckingAccount, isProfileLoaded, userName, pendingName, setUserName, navigate, location.state]);

  // Redirect if already registered (on initial load)
  React.useEffect(() => {
    if (!isCheckingAccount && userName && userPhone) {
      const from = location.state?.from?.pathname || '/menu';
      navigate(from, { replace: true });
    }
  }, [userName, userPhone, navigate, location.state, isCheckingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    setIsSubmitting(true);
    setIsCheckingAccount(true);
    setPendingName(name);
    
    const sanitizedPhone = phone.replace(/[^0-9]/g, '');
    setUserPhone(sanitizedPhone);
    // The useEffect above will handle the rest once isProfileLoaded becomes true
  };

  const isRedirected = location.state?.from;

  return (
    <div className={`h-screen w-screen overflow-hidden ${darkMode ? 'bg-black' : 'bg-gray-50'} relative flex items-center justify-center p-6`}>
      {/* Subtle Background Image */}
      <div className="absolute inset-0 z-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop"
          alt="Freshness"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex flex-col items-center w-full max-w-md relative z-10 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`w-full p-8 rounded-[2.5rem] shadow-2xl border ${darkMode ? 'bg-surface-container border-white/5' : 'bg-white border-gray-100'}`}
        >
          <div className="text-center mb-6">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-lg ${darkMode ? 'bg-primary/10' : 'bg-emerald-50'}`}>
              <Sparkles size={28} className={darkMode ? 'text-primary' : 'text-emerald-600'} />
            </div>
            <h2 className={`text-xl font-black tracking-tight mb-1 ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>
              {t('joinSaphoSaung')}
            </h2>
            {isRedirected && (
              <p className="text-rose-500 text-[9px] font-bold mb-2 animate-bounce">
                Please register to continue
              </p>
            )}
            <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>
              {t('letsGetToKnowYou')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-1">
              <label className={`text-[8px] font-black uppercase tracking-widest ml-4 ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('fullName')}</label>
              <div className="relative group">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-on-surface-variant/40 group-focus-within:text-primary' : 'text-gray-400 group-focus-within:text-emerald-600'}`} size={16} />
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('enterYourName')}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-full border-2 font-bold transition-all outline-none placeholder:text-xs placeholder:text-gray-400 placeholder:italic ${darkMode ? 'bg-surface-container-lowest border-white/5 focus:border-primary/50 text-on-surface' : 'bg-gray-50 border-gray-100 focus:border-emerald-600/30 text-emerald-900'}`}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className={`text-[8px] font-black uppercase tracking-widest ml-4 ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{t('phoneNumber')}</label>
              <div className="relative group">
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-on-surface-variant/40 group-focus-within:text-primary' : 'text-gray-400 group-focus-within:text-emerald-600'}`} size={16} />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t('enterYourPhone')}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-full border-2 font-bold transition-all outline-none placeholder:text-xs placeholder:text-gray-400 placeholder:italic ${darkMode ? 'bg-surface-container-lowest border-white/5 focus:border-primary/50 text-on-surface' : 'bg-gray-50 border-gray-100 focus:border-emerald-600/30 text-emerald-900'}`}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <div className={`h-px flex-1 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
              <span className={`text-[8px] font-bold uppercase ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('ready')}</span>
              <div className={`h-px flex-1 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={`mx-auto px-12 py-3 rounded-full font-black text-sm shadow-lg shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${darkMode ? 'bg-primary text-white' : 'bg-emerald-600 text-white'}`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('continue')}
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={() => navigate('/')}
              className={`w-full text-[9px] font-bold mt-4 opacity-40 hover:opacity-100 transition-opacity ${darkMode ? 'text-white' : 'text-gray-500'}`}
            >
              Back to Welcome Page
            </button>
          </form>
        </motion.div>
        
        <p className={`text-[9px] text-center mt-4 ${darkMode ? 'text-on-surface-variant/50' : 'text-gray-400'}`}>
          {t('secureAndPrivate')}
        </p>
      </div>
    </div>
  );
}
