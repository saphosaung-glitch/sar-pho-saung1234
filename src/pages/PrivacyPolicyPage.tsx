import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Lock, Eye, Database, Bell, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { darkMode, t } = useStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const policies = [
    {
      icon: <Database size={20} />,
      title: t('infoCollectTitle'),
      content: t('infoCollectContent')
    },
    {
      icon: <Eye size={20} />,
      title: t('howUseInfoTitle'),
      content: t('howUseInfoContent')
    },
    {
      icon: <Lock size={20} />,
      title: t('dataSecurityTitle'),
      content: t('dataSecurityContent')
    },
    {
      icon: <UserCheck size={20} />,
      title: t('yourRightsTitle'),
      content: t('yourRightsContent')
    },
    {
      icon: <Bell size={20} />,
      title: t('communicationsTitle'),
      content: t('communicationsContent')
    }
  ];

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
          <h2 className={`text-lg font-black tracking-tight leading-tight ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('privacyPolicy')}</h2>
          <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-400'}`}>{t('howHandleData')}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 border shadow-sm text-center transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/60'}`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'}`}>
            <Shield size={32} />
          </div>
          <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('privacyMattersTitle')}</h3>
          <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-500'}`}>
            {t('privacyMattersDesc')}
          </p>
        </motion.div>

        <div className="space-y-4">
          {policies.map((policy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl p-5 border shadow-sm flex gap-4 transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/60'}`}
            >
              <div className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-white/5 text-on-surface-variant/60' : 'bg-slate-50 text-slate-600'}`}>
                {policy.icon}
              </div>
              <div>
                <h4 className={`text-sm font-bold mb-1 ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{policy.title}</h4>
                <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-500'}`}>
                  {policy.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-8 pb-4"
        >
          <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/30' : 'text-slate-400'}`}>{t('lastUpdated')}: April 2026</p>
        </motion.div>
      </main>
    </div>
  );
}
