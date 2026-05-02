import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithEmailAndPassword, signInWithPopup, googleProvider } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { useStore } from '../context/StoreContext';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useStore();

  const isIframe = window !== window.top;
  const brandLogo = "https://scontent.fkul7-2.fna.fbcdn.net/v/t39.30808-6/684505557_122097016515302120_6150026231108406984_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=65onKQ3wqrwQ7kNvwH-5Tn-&_nc_oc=AdoS-wVrlfKZ1ez9KNNdnG2zrOlHcnj7uHcGjRb3mW6fp1oguy8-8wQ1-pXhxzE26ke-vq-3N92HeuXbHTYkvevu&_nc_zt=23&_nc_ht=scontent.fkul7-2.fna&_nc_gid=lCsMSE2No98znYrLT3N7sg&_nc_ss=7b2a8&oh=00_Af4X8z6JL4VX10-1XWuFqPcF1kQfsivurJR7gMP3HKIQ7Q&oe=69FC4851";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/network-request-failed') {
        setError('ကွန်ရက်ချိတ်ဆက်မှု ပြတ်တောက်နေပါသည် (Network Request Failed)။ Ad-blocker များကို ခေတ္တပိတ်၍ သို့မဟုတ် Google ဖြင့် ဝင်ရောက်ကြည့်ပါ။');
      } else {
        setError('အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ (Invalid Email/Password)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Google ဖြင့် ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။ (Google Sign In Failed)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[840px] z-10 flex flex-col items-center"
      >
        <div className="w-full bg-white/70 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white overflow-hidden flex flex-col md:flex-row min-h-[400px] md:min-h-[480px]">
          
          {/* Logo/Branding Side (Left) */}
          <div className="md:w-5/12 bg-slate-900 p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-white rounded-full blur-[80px]" />
            </div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl mb-6 md:mb-8 border-4 border-white/10 rotate-3 z-10 shrink-0"
            >
              <img 
                src={brandLogo} 
                alt="Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <div className="z-10">
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Admin</h1>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Restricted Access</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="mt-8 md:mt-12 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em] z-10"
            >
              ← Back to Store
            </button>
          </div>

          {/* Form Side (Right) */}
          <div className="md:w-7/12 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
            <div className="mb-8 md:mb-10">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-1">Internal Authentication</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Provide authorized credentials</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden mb-4 md:mb-6"
                >
                  <div className="bg-red-50 border border-red-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <p className="text-[10px] md:text-[11px] font-bold text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="w-full space-y-4 md:space-y-5">
              <div className="space-y-3 md:space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors flex items-center justify-center">
                    <Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white py-4 md:py-5 pl-12 pr-5 rounded-xl md:rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 text-sm shadow-inner" 
                    type="email" 
                    placeholder="Authorized Email Address" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors flex items-center justify-center">
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white py-4 md:py-5 pl-12 pr-14 rounded-xl md:rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 text-sm shadow-inner" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Admin Access Password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 opacity-20">
                <div className="h-px bg-slate-400 flex-1"></div>
                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                <div className="h-px bg-slate-400 flex-1"></div>
              </div>

              <div className="flex justify-center">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full sm:w-10/12 bg-slate-900 text-white py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In to Dashboard
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-6 md:mt-8 text-center text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
          Powered by Sar Taw Set Infrastructure v3.1<br/>
          © {new Date().getFullYear()} Royal Asset Management
        </p>
      </motion.div>
    </div>
  );
}

