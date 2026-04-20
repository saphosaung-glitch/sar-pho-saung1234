import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { User, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { setUserName, setUserPhone, darkMode, deviceId, isAuthLoading, authUid, userName, userPhone } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if session restored in background
  React.useEffect(() => {
    if (userName && userPhone && !isSubmitting) {
      console.log("RegistrationPage: Session restored in background, auto-redirecting to menu");
      navigate('/menu', { replace: true });
    }
  }, [userName, userPhone, navigate, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!name || !cleanPhone) {
        toast.error("နာမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပေးပါ။");
        return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if user exists
      const userRef = doc(db, 'users', cleanPhone);
      
      await finalizeLogin(name, cleanPhone);
    } catch (error) {
      console.error("Auth process failed:", error);
      toast.error("စနစ်အတွင်း အမှားအယွင်းရှိနေပါသည်။");
      setIsSubmitting(false);
    }
  };

  const finalizeLogin = async (userName: string, userPhone: string) => {
    setUserName(userName);
    setUserPhone(userPhone);
    
    // 1. Create mapping for session restoration
    if (authUid) {
      try {
        await setDoc(doc(db, 'authToPhone', authUid), { 
          phone: userPhone, 
          lastActive: serverTimestamp() 
        }, { merge: true });
        console.log("RegistrationPage: Created auth mapping for:", authUid);
      } catch (err) {
        console.warn("RegistrationPage: Failed to create mapping:", err);
      }
    }

    const userRef = doc(db, 'users', userPhone);
    await setDoc(userRef, {
      name: userName,
      phone: userPhone,
      lastDeviceId: deviceId,
      lastActive: serverTimestamp()
    }, { merge: true });

    localStorage.setItem('sp_user_name', userName);
    localStorage.setItem('sp_user_phone', userPhone);
    
    setIsSubmitting(false);
    navigate('/menu', { replace: true });
  };

  const inputClass = `w-full h-12 pl-12 pr-4 rounded-2xl border transition-all duration-500 ease-out outline-none text-sm group-hover:shadow-md ${
    darkMode 
      ? 'bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:bg-white/[0.08] text-white placeholder:text-white/20 placeholder:italic placeholder:text-[11px]' 
      : 'bg-black/[0.03] border-black/5 focus:border-emerald-600/30 focus:bg-white text-slate-900 placeholder:text-slate-400/50 placeholder:italic placeholder:text-[11px] font-medium'
  }`;

  const iconClass = `absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
    darkMode ? 'text-emerald-500/50 group-focus-within:text-emerald-400 group-focus-within:scale-110' : 'text-emerald-600/40 group-focus-within:text-emerald-600 group-focus-within:scale-110'
  }`;

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden font-sans ${darkMode ? 'bg-black' : 'bg-[#FDFCFB]'}`}>
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-full opacity-30 ${darkMode ? 'bg-black' : ''}`}>
           <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover blur-[2px]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className={`absolute inset-0 bg-gradient-to-b ${darkMode ? 'from-black/60 via-black/80 to-black' : 'from-transparent via-white/80 to-white'}`} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[380px] relative z-10"
      >
        {/* The Card - Modern Bento Style */}
        <div className={`relative p-10 rounded-[40px] border before:absolute before:inset-0 before:rounded-[40px] before:p-[1px] before:bg-gradient-to-b ${
          darkMode 
            ? 'bg-white/[0.04] border-white/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] before:from-white/20 before:to-transparent' 
            : 'bg-white/80 border-slate-200/50 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.1)] before:from-white before:to-transparent'
        } backdrop-blur-3xl`}>
          
          {/* Subtle Inner Glow */}
          <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent blur-sm" />

          <div className="text-center mb-10 relative mt-4">
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-4xl font-serif tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}
              >
                Welcome
              </motion.h1>
              
              <div className="flex items-center justify-center gap-3">
                <div className={`h-px w-6 ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`text-[9px] font-black uppercase tracking-[0.4em] ${darkMode ? 'text-emerald-500/60' : 'text-emerald-600/70'}`}
                >
                  Enter details to proceed
                </motion.p>
                <div className={`h-px w-6 ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="relative group h-12"
            >
              <User className={iconClass} size={18} />
              <input 
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                className={inputClass}
                required
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="relative group h-12"
            >
              <Phone className={iconClass} size={18} />
              <input 
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Phone Number"
                className={inputClass}
                required
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="py-2 flex items-center gap-4 justify-center"
            >
              <div className={`h-px flex-1 ${darkMode ? 'bg-white/10' : 'bg-black/5'}`} />
              <span className={`text-[8px] uppercase tracking-[0.4em] font-black ${darkMode ? 'text-emerald-500/40' : 'text-emerald-600/40'}`}>
                Royal Guest
              </span>
              <div className={`h-px flex-1 ${darkMode ? 'bg-white/10' : 'bg-black/5'}`} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center"
            >
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-40 h-11 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-500 active:scale-[0.96] bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 group overflow-hidden relative"
              >
                <span className="relative z-10">
                  {isSubmitting ? '...' : 'Continue'}
                </span>
                {!isSubmitting && <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />}
                
                {/* Button Glossy Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            </motion.div>
          </form>
        </div>
        
        {/* Visual Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className={`text-center mt-8 text-[8px] uppercase tracking-[0.3em] font-medium ${darkMode ? 'text-white/20' : 'text-slate-400'}`}
        >
          © 2026 Sar Taw Set Royal Caterer
        </motion.p>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
