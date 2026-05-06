import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Plus, MapPin, Home, Building, CheckCircle2, Edit2, Trash2, MoreVertical, Phone, Check, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AddressManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCheckout = searchParams.get('from') === 'checkout';
  const { addresses, removeAddress, setDefaultAddress, selectedAddressId, setSelectedAddressId, t, darkMode } = useStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<any | null>(null);

  const confirmDelete = (e: React.MouseEvent, address: any) => {
    e.stopPropagation();
    setAddressToDelete(address);
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;
    const id = addressToDelete.id;
    setDeletingId(id);
    setAddressToDelete(null);
    try {
      await removeAddress(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedAddressId(id);
    if (fromCheckout) {
      navigate(-1);
    }
  };

  const uniqueDisplayAddresses = useMemo(() => {
    const uniqueMap = new Map<string, typeof addresses[0]>();
    addresses.forEach(addr => {
      // Use the same robust key format as StoreContext for consistency
      const key = [
        addr.phone,
        addr.township,
        addr.street,
        addr.building,
        addr.room
      ].map(v => (v || '').toString().toLowerCase().trim().replace(/\s+/g, '')).join('|');

      if (!uniqueMap.has(key) || (addr.isDefault && !uniqueMap.get(key)?.isDefault)) {
        uniqueMap.set(key, addr);
      }
    });
    return Array.from(uniqueMap.values());
  }, [addresses]);

  return (
    <div className={`min-h-screen font-sans selection:bg-primary/20 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#FAFAFA] text-slate-900'}`}>
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-primary/30' : 'bg-primary/10'}`} />
        <div className={`absolute bottom-0 -left-48 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] ${darkMode ? 'invert' : ''}`} style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-3xl border-b px-4 h-[72px] flex items-center justify-between transition-all duration-500 ${darkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-on-surface/5'}`}>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className={`flex-none w-10 h-10 border shadow-sm rounded-full flex items-center justify-center transition-all ${darkMode ? 'bg-slate-800 border-white/10 hover:bg-slate-700 text-white' : 'bg-white border-on-surface/5 hover:bg-slate-50 text-slate-900'}`}
        >
          <ChevronLeft size={20} />
        </motion.button>
        
        <h1 className={`text-base font-bold absolute left-1/2 -translate-x-1/2 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-on-surface'}`}>
          {t('savedAddresses')}
        </h1>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/5">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>
              {uniqueDisplayAddresses.length}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 pb-40 relative z-10">
        {fromCheckout && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 px-2"
          >
            <h3 className={`text-sm font-black uppercase tracking-[0.15em] ${darkMode ? 'text-primary' : 'text-primary'}`}>{t('selectDeliveryAddress')}</h3>
            <p className={`text-[11px] font-bold mt-1.5 ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>{t('tapToSelectAddress')}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {uniqueDisplayAddresses.map((address, index) => (
              <motion.div
                key={address.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.08 
                }}
                onClick={() => handleSelect(address.id)}
                className={`relative group rounded-3xl p-7 border transition-all duration-500 overflow-hidden cursor-pointer ${
                  selectedAddressId === address.id
                    ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/30' 
                    : `border-on-surface/10 ${darkMode ? 'bg-slate-900/40 hover:bg-slate-900/60' : 'bg-white hover:bg-slate-50 shadow-sm'}`
                }`}
              >
                {/* Premium Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                {/* Decorative background element */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none transition-all duration-700 ${selectedAddressId === address.id ? 'bg-primary/20 opacity-100 scale-110' : 'bg-primary/10 opacity-0 group-hover:opacity-100 scale-100'}`}></div>
                
                <div className="relative z-10 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-500 mt-0.5 ${
                        selectedAddressId === address.id 
                          ? 'bg-primary text-white shadow-primary/30 scale-105' 
                          : (darkMode ? 'bg-slate-800 text-white/40 group-hover:text-primary group-hover:bg-primary/10' : 'bg-surface-container-low text-on-surface-variant/40 group-hover:text-primary group-hover:bg-primary/5')
                      }`}>
                        {address.label === 'Home' ? <Home size={20} /> : address.label === 'Office' ? <Building size={20} /> : <MapPin size={20} />}
                      </div>
                      <div className="min-w-0 pr-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className={`font-black text-sm tracking-tight truncate ${darkMode ? 'text-white' : 'text-on-surface'}`}>{address.name}</h4>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded flex-shrink-0 ${selectedAddressId === address.id ? 'bg-primary/20 text-primary' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                            {t(address.label.toLowerCase() || 'other')}
                          </span>
                          {address.isDefault && (
                            <span className="bg-emerald-500/10 text-emerald-600 text-[11px] font-black px-2 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                              <Check size={10} strokeWidth={4} />
                              {t('default')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[13px] font-bold">
                          <Phone size={12} className="text-emerald-500 flex-shrink-0" />
                          <span className={`${darkMode ? 'text-white/50' : 'text-on-surface-variant/70'}`}>{address.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      {!address.isDefault && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefaultAddress(address.id);
                          }}
                          className={`p-2.5 rounded-xl transition-all duration-300 ${darkMode ? 'bg-white/5 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10' : 'bg-slate-50 text-on-surface-variant/40 hover:text-emerald-600 hover:bg-emerald-500/5'}`}
                          title={t('setAsDefault')}
                        >
                          <CheckCircle2 size={18} />
                        </motion.button>
                      )}
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/add-address?edit=${address.id}`);
                        }}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${darkMode ? 'bg-white/5 text-white/40 hover:text-primary hover:bg-primary/10' : 'bg-slate-50 text-on-surface-variant/40 hover:text-primary hover:bg-primary/5'}`}
                      >
                        <Edit2 size={18} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => confirmDelete(e, address)}
                        disabled={deletingId === address.id}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${darkMode ? 'bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10' : 'bg-slate-50 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-500/5'}`}
                      >
                        <Trash2 size={18} className={deletingId === address.id ? 'animate-pulse' : ''} />
                      </motion.button>
                    </div>
                  </div>

                  <div className={`h-px w-full transition-colors duration-500 ${darkMode ? 'bg-white/5' : 'bg-on-surface/5'}`}></div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-lg overflow-hidden flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <Navigation size={12} />
                    </div>
                    <p className={`text-[13px] font-medium leading-relaxed ${darkMode ? 'text-white/70' : 'text-on-surface-variant'}`}>
                      {address.street}, {address.building && `${address.building}, `}{address.room && `${address.room}, `}
                      {address.township}, {address.city}, {address.region}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {addresses.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 text-center space-y-8"
            >
              <div className="relative inline-block">
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto transition-colors shadow-inner ${darkMode ? 'bg-slate-900 text-white/10' : 'bg-surface-container-high text-on-surface-variant/10'}`}
                >
                  <MapPin size={64} />
                </motion.div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white border-4 border-surface shadow-xl"
                >
                  <Plus size={24} />
                </motion.div>
              </div>
              <div className="space-y-3">
                <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-on-surface'}`}>{t('noSavedAddresses')}</h3>
                <p className={`text-sm font-bold max-w-[260px] mx-auto leading-relaxed ${darkMode ? 'text-white/40' : 'text-on-surface-variant/40'}`}>{t('noSavedAddressesDesc')}</p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 left-0 right-0 px-8 flex justify-center z-50 max-w-md mx-auto">
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/add-address')}
          className="px-8 bg-primary text-white py-3.5 rounded-full font-bold text-[11px] shadow-[0_15px_40px_rgba(13,99,27,0.25)] flex items-center justify-center gap-2.5 transition-all hover:bg-primary-container group relative overflow-hidden ring-4 ring-primary/5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          <span className="uppercase tracking-[0.15em]">{t('addNewAddress')}</span>
        </motion.button>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {addressToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddressToDelete(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm rounded-[2rem] p-8 overflow-hidden border shadow-2xl ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="relative z-10 text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
                  <Trash2 size={32} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black">{t('deleteAddressConfirm')}?</h3>
                  <p className={`text-sm font-bold opacity-60`}>
                    {t('deleteAddressWarning')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setAddressToDelete(null)}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(239,68,68,0.2)]"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
