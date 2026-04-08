import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Bell, Trash2, Receipt, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, clearNotifications, t, darkMode } = useStore();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen font-sans selection:bg-primary/20 ${darkMode ? 'bg-surface text-on-surface' : 'bg-surface text-on-surface'}`}>
      {/* Premium Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b border-on-surface/5 px-4 h-[72px] flex items-center gap-4 ${darkMode ? 'bg-surface/80' : 'bg-surface/80'}`}>
        <button 
          onClick={() => navigate('/menu')}
          className={`flex-none w-10 h-10 border border-on-surface/5 shadow-sm rounded-full flex items-center justify-center transition-colors active:scale-95 ${darkMode ? 'bg-surface-container-high hover:bg-surface-container-highest' : 'bg-white hover:bg-surface-container-low'}`}
        >
          <ChevronLeft size={20} className="text-on-surface" />
        </button>
        <div className="flex flex-col flex-grow">
          <h2 className="text-xl font-black text-on-surface tracking-tight">{t('notifications')}</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{t('updatesAndOffers')}</span>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                {unreadCount} {t('new')}
              </span>
            )}
          </div>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={clearNotifications}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all ${darkMode ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
          >
            <Trash2 size={18} />
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4 pb-20">
        {notifications.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-low'}`}
            >
              <Bell size={40} className="text-on-surface-variant/20" />
            </motion.div>
            <h3 className="text-on-surface font-black text-xl mb-2 tracking-tight">{t('noNotificationsYet')}</h3>
            <p className="text-on-surface-variant/60 text-xs font-medium max-w-[200px] leading-relaxed">
              {t('noNotificationsDesc')}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                className={`p-5 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group ${
                  notification.read 
                    ? `${darkMode ? 'bg-surface-container-high/40 border-on-surface/5' : 'bg-white border-on-surface/5'} opacity-70` 
                    : `${darkMode ? 'bg-surface-container-high border-primary/30' : 'bg-white border-primary/20'} shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-primary/5`
                }`}
              >
                {!notification.read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                )}
                
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    notification.type === 'order' ? 'bg-blue-500/10 text-blue-500' : 
                    notification.type === 'offer' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-primary/10 text-primary'
                  }`}>
                    {notification.type === 'order' ? <Receipt size={22} /> : 
                     notification.type === 'offer' ? <Sparkles size={22} /> : 
                     <Bell size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`font-black text-sm tracking-tight truncate ${notification.read ? 'text-on-surface/70' : 'text-on-surface'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest whitespace-nowrap mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${notification.read ? 'text-on-surface-variant/60' : 'text-on-surface-variant'}`}>
                      {notification.message}
                    </p>
                    {notification.read && (
                      <div className="flex items-center gap-1 mt-2 text-emerald-500/60">
                        <CheckCircle2 size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('read')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
