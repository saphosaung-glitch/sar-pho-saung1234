import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword } from '../lib/firebase';
import { auth } from '../lib/firebase';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။');
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

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <input className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-sm hover:bg-emerald-700 transition-all active:scale-95">
            ဝင်ရောက်မည်
          </button>
        </form>

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
