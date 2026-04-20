import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { darkMode, userPhone, userName, t, isDeliveryEnabled } = useStore();

  // Auto-redirect if already registered
  React.useEffect(() => {
    if (userName && userPhone) {
      console.log("WelcomePage: User already registered, auto-redirecting to menu");
      navigate('/menu', { replace: true });
    }
  }, [userName, userPhone, navigate]);

  const handleGetStarted = () => {
    // Check if user is registered (has name and phone)
    const isRegistered = userName && userPhone;
    if (isRegistered) {
      navigate('/menu', { replace: true });
    } else {
      // Explicitly state that we are coming from the welcome flow to land on menu
      navigate('/registration', { state: { from: { pathname: '/menu' } } });
    }
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${darkMode ? 'bg-black' : 'bg-surface'} relative flex items-center justify-center`}>
      {/* Subtle Background Image */}
      <div className="absolute inset-0 z-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop"
          alt="Freshness"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center space-y-8 p-6 max-w-sm"
      >
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-4xl font-serif text-on-surface">စားတော်ဆက်</h1>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant">Sar Taw Set {t('royalCaterer')}</p>
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <p className="text-lg text-on-surface leading-relaxed">လတ်ဆတ်သောအစားအစာများကို သင့်အိမ်တိုင်ရာရောက် ပို့ဆောင်ပေးပါသည်။</p>
          <p className="text-sm italic text-on-surface-variant">{t('welcomeTagline')}</p>
          <p className="text-xs text-primary font-medium pt-2">💯 အရည်အသွေးနှင့် လတ်ဆတ်မှုကို အပြည့်အဝ အာမခံပါသည်။</p>
          <p className="text-[10px] italic text-on-surface-variant opacity-70">{t('welcomeGuarantee')}</p>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-6 text-xs text-on-surface-variant font-medium">
          <span className="flex items-center gap-1">✨ {t('points')}</span>
          <span className="flex items-center gap-1">🚚 {t('fast')}</span>
          <span className="flex items-center gap-1">🍎 {t('fresh')}</span>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          {!isDeliveryEnabled && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-center gap-2 text-red-500 mb-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <p className="text-xs font-bold">{t('deliveryPausedDesc') || 'Delivery service is temporarily paused.'}</p>
            </div>
          )}
          <button
            onClick={handleGetStarted}
            className="w-full bg-primary text-on-primary-fixed px-8 py-3 rounded-md font-sans font-semibold hover:bg-primary-container transition-all duration-300 shadow-md"
          >
            {t('getStarted')}
          </button>
          
          {/* Version Footer */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] text-on-surface-variant opacity-50">v1.0.0 | © 2026 Sar Taw Set</p>
            <button 
              onClick={() => navigate('/admin-login')}
              className="text-[8px] text-on-surface-variant opacity-20 hover:opacity-100 transition-opacity uppercase tracking-tighter"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
