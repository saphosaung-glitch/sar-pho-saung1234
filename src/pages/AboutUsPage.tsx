import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Globe, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export default function AboutUsPage() {
  const navigate = useNavigate();
  const { darkMode, t } = useStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-400'}`}>{t('version')} 1.0.4</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {/* App Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 border shadow-sm text-center relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/60'}`}
        >
          <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl ${darkMode ? 'bg-primary/5' : 'bg-primary/5'}`} />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <span className="text-4xl font-black text-white">S</span>
            </div>
            <h3 className={`text-2xl font-black mb-1 tracking-tight ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>SAPHOSAUNG</h3>
            <p className="text-sm font-bold text-primary mb-4">{t('version')} 1.0.4</p>
            <p className={`text-sm font-medium leading-relaxed max-w-xs mx-auto ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-500'}`}>
              {t('aboutUsDesc')}
            </p>
          </div>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border shadow-sm overflow-hidden divide-y transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-white/5 divide-white/5' : 'bg-white border-slate-200/60 divide-slate-100'}`}
        >
          <div 
            className={`flex items-center justify-between p-5 transition-colors cursor-pointer ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            onClick={() => window.open('https://saphosaung.com', '_blank')}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-500'}`}>
                <Globe size={20} />
              </div>
              <span className={`text-sm font-bold ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('visitWebsite')}</span>
            </div>
            <ChevronRight size={16} className={darkMode ? 'text-on-surface-variant/30' : 'text-slate-300'} />
          </div>
          <div 
            className={`flex items-center justify-between p-5 transition-colors cursor-pointer ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            onClick={() => window.open('mailto:support@saphosaung.com', '_blank')}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-500'}`}>
                <MessageSquare size={20} />
              </div>
              <span className={`text-sm font-bold ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('sendFeedback')}</span>
            </div>
            <ChevronRight size={16} className={darkMode ? 'text-on-surface-variant/30' : 'text-slate-300'} />
          </div>
          <div className={`flex items-center justify-between p-5 transition-colors cursor-pointer ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`} onClick={() => navigate('/privacy-policy')}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-500/10 text-red-500'}`}>
                <Shield size={20} />
              </div>
              <span className={`text-sm font-bold ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('privacyPolicy')}</span>
            </div>
            <ChevronRight size={16} className={darkMode ? 'text-on-surface-variant/30' : 'text-slate-300'} />
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center pt-8 pb-4"
        >
          <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/30' : 'text-slate-400'}`}>© 2026 SAPHOSAUNG. {t('allRightsReserved')}</p>
          <p className={`text-[10px] font-medium mt-1 ${darkMode ? 'text-on-surface-variant/20' : 'text-slate-400'}`}>{t('madeWithLove')}</p>
        </motion.div>
      </main>
    </div>
  );
}
