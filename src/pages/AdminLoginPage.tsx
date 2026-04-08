import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInWithGoogle, authUid } = useStore();

  // If user signs in with Google and is an admin (checked via rules later), 
  // we still need to set the local isAdmin flag for UI routing if they used this page.
  useEffect(() => {
    if (authUid && localStorage.getItem('isAdmin') === 'pending') {
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    }
  }, [authUid, navigate]);

  const handleGoogleLogin = async () => {
    localStorage.setItem('isAdmin', 'pending');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Google ဖြင့် ဝင်ရောက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
      localStorage.removeItem('isAdmin');
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
        <p className="text-emerald-700 font-bold mb-10 text-sm uppercase tracking-widest">စားဖိုဆောင် (Sar Pho Saung)</p>

        {error && <p className="text-red-500 text-xs font-bold bg-red-50 py-3 rounded-xl border border-red-100 w-full mb-6">{error}</p>}

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-gray-100 text-gray-600 py-5 rounded-2xl font-bold text-lg shadow-sm hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" referrerPolicy="no-referrer" />
          Google ဖြင့် ဝင်ရောက်မည်
        </button>

        <button 
          onClick={() => navigate('/')}
          className="mt-6 text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors"
        >
          Back to Store
        </button>
      </motion.div>
    </div>
  );
}
