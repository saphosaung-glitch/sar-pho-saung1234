import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, signInWithPopup, googleProvider } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { useStore } from '../context/StoreContext';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { t } = useStore();

  const isIframe = window !== window.top;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Google ဖြင့် ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။ (Google Sign In Failed)');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full flex flex-col items-center border border-emerald-100"
      >
        <div className="bg-emerald-600 p-6 rounded-full shadow-lg shadow-emerald-200 mb-8">
          <ShieldCheck size={48} className="text-white" />
        </div>

        <h1 className="text-3xl font-black text-emerald-900 mb-2 tracking-tight">Admin Login</h1>
        <p className="text-emerald-700 font-bold mb-10 text-sm uppercase tracking-widest">စားတော်ဆက် (Sar Taw Set)</p>

        {isIframe && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold p-3 rounded-xl mb-6 text-left leading-relaxed">
            ⚠️ You are viewing this in an iframe setup. If you experience "Network Request Failed" errors, please open the app in a new tab by clicking the external link button in the preview window.
          </div>
        )}

        {error && <p className="text-red-500 text-xs font-bold bg-red-50 py-3 px-4 rounded-xl border border-red-100 w-full mb-6 leading-relaxed">{error}</p>}

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <input className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 placeholder:text-gray-400" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 placeholder:text-gray-400" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-sm hover:bg-emerald-700 transition-all active:scale-95">
            ဝင်ရောက်မည်
          </button>
        </form>

        <div className="w-full flex items-center justify-between gap-4 my-6">
          <div className="h-px bg-gray-100 flex-1"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
          <div className="h-px bg-gray-100 flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          type="button" 
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-600 py-4 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
          Google ဖြင့် ဝင်မည်
        </button>

        <button 
          onClick={() => navigate('/')}
          className="mt-8 text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors"
        >
          Back to Store
        </button>
      </motion.div>
    </div>
  );
}
