import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function SetupAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Admin account created!');
      navigate('/admin-login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-5">Create Admin Account</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleCreate} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
        <button type="submit" className="bg-emerald-600 text-white p-2 rounded">Create</button>
      </form>
    </div>
  );
}
