import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Globe, Shield, ChevronRight, QrCode, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { QRCodeModal } from '../components/ui/QRCodeModal';
import { useState } from 'react';
import { BRAND_LOGO, PRODUCTION_URL } from '../constants';

export default function AboutUsPage() {
  const navigate = useNavigate();
  const { darkMode, t, settings } = useStore();
  const [showLocationQR, setShowLocationQR] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const brandLogo = BRAND_LOGO;

  return (
    <div className={`min-h-screen pb-24 font-sans selection:bg-primary/20 transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 h-[72px] flex items-center gap-4 transition-colors duration-300 ${darkMode ? 'bg-surface/80 border-white/5' : 'bg-white/80 border-slate-200/50'}`}>
        <button
          onClick={() => navigate(-1)}
          className={`flex-none w-10 h-10 border shadow-sm rounded-full flex items-center justify-center transition-all active:scale-90 ${darkMode ? 'bg-surface-container border-white/10 hover:bg-surface-container-high' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
        >
          <ChevronLeft size={20} className={darkMode ? 'text-on-surface' : 'text-slate-600'} />
        </button>
        <div className="flex flex-col">
          <h2 className={`text-lg font-black tracking-tight leading-tight ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('aboutUs')}</h2>
          <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-400'}`}>{t('version')} 3.2.0</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-8 mt-6">
        {/* App Info Card - Premium Redesign */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className={`rounded-[3rem] p-10 border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] text-center relative overflow-hidden transition-all duration-500 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/40'}`}
        >
          {/* Subtle Ambient Light Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-28 h-28 rounded-3xl overflow-hidden mx-auto mb-8 shadow-2xl border-4 border-white rotate-3 group transition-transform hover:rotate-0 duration-500"
            >
              <img 
                src={brandLogo} 
                alt="Sar Taw Set Logo" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className={`text-3xl font-black mb-2 tracking-tighter ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>Sar Taw Set</h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                 <span className="h-1 w-1 rounded-full bg-primary" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Royal Taste Experience</p>
                 <span className="h-1 w-1 rounded-full bg-primary" />
              </div>
              <p className={`text-sm font-medium leading-[1.8] max-w-sm mx-auto ${darkMode ? 'text-on-surface-variant/80' : 'text-slate-500'}`}>
                {t('aboutUsDesc')}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Action Links - Glassmorphism style */}
        <div className="space-y-4">
          {[
            { icon: Globe, label: t('visitWebsite'), color: 'bg-blue-500', action: () => window.open(settings.productionUrl, '_blank') },
            { icon: MessageSquare, label: t('sendFeedback'), color: 'bg-emerald-500', action: () => window.open('mailto:hello@sartawset.com', '_blank') },
            { icon: MapPin, label: 'Store Location', subLabel: 'Scan for directions', color: 'bg-indigo-500', action: () => setShowLocationQR(true), isQR: true },
            { icon: Shield, label: t('privacyPolicy'), color: 'bg-rose-500', action: () => navigate('/privacy-policy') }
          ].map((item, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98] group ${darkMode ? 'bg-surface-container-high border-white/5 hover:bg-white/5' : 'bg-white border-slate-200/50 hover:border-slate-300 hover:shadow-md'}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.color} text-white shadow-lg shadow-${item.color.split('-')[1]}-200/40`}>
                  <item.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start translate-y-[-1px]">
                  <span className={`text-sm font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{item.label}</span>
                  {item.subLabel && <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.subLabel}</span>}
                </div>
              </div>
              {item.isQR ? (
                <QrCode size={18} className="opacity-30 group-hover:opacity-100 transition-opacity" />
              ) : (
                <ChevronRight size={18} className="opacity-20 group-hover:opacity-100 transition-opacity group-hover:translate-x-1" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Redesigned Footer Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pt-12 pb-6 space-y-4"
        >
          <div className="flex items-center justify-center gap-4 opacity-20">
             <div className="h-px w-8 bg-current" />
             <div className="w-1.5 h-1.5 rounded-full bg-current" />
             <div className="h-px w-8 bg-current" />
          </div>
          
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-on-surface-variant/40' : 'text-slate-400'}`}>
              © {new Date().getFullYear()} Sar Taw Set Royal Caterer
            </p>
            <p className={`text-[9px] font-bold mt-2 uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/20' : 'text-slate-300'}`}>
               Crafted with Elegance by Sar Taw Set Infrastructure
            </p>
          </div>
        </motion.div>
      </main>

      <QRCodeModal 
        isOpen={showLocationQR} 
        onClose={() => setShowLocationQR(false)} 
        url="https://maps.google.com/?q=Sartawset+Royal+Caterer+Mandalay"
        title="Store Location"
        subtitle="Sartawset Royal Caterer"
        darkMode={darkMode}
      />
    </div>
  );
}
