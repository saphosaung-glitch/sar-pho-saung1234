import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Save, MapPin, Phone, User, Home, Building, CheckCircle2, Map, Navigation, Landmark, Hash, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Address } from '../types';

export default function AddAddressPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { addresses, addAddress, updateAddress, t, darkMode, userName, userPhone } = useStore();
  
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: userName || '',
    phone: userPhone || '',
    region: '',
    city: '',
    township: '',
    street: '',
    building: '',
    room: '',
    label: 'Home',
    isDefault: false
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      const existing = addresses.find(a => a.id === editId);
      if (existing) {
        const { id, ...rest } = existing;
        setFormData(rest);
      }
    }
  }, [editId, addresses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Optimistic: call and navigate immediately
    setTimeout(() => {
      if (editId) {
        updateAddress(editId, formData);
      } else {
        addAddress(formData);
      }
      navigate(-1);
    }, 600);
  };

  const labels: ('Home' | 'Office' | 'Other')[] = ['Home', 'Office', 'Other'];

  return (
    <div className={`min-h-screen font-sans selection:bg-primary/20 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#FAFAFA] text-slate-900'}`}>
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-primary/30' : 'bg-primary/10'}`} />
        <div className={`absolute bottom-0 -left-48 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] ${darkMode ? 'invert' : ''}`} style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-3xl border-b px-6 h-[80px] flex items-center gap-5 transition-all duration-500 ${darkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-on-surface/5'}`}>
        <motion.button 
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className={`flex-none w-12 h-12 border shadow-sm rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-slate-800/50 border-white/10 hover:bg-slate-700/50' : 'bg-white border-on-surface/5 hover:bg-slate-50'}`}
        >
          <ChevronLeft size={22} className={darkMode ? 'text-white' : 'text-on-surface'} />
        </motion.button>
        <div className="flex flex-col">
          <h2 className={`text-lg font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-on-surface'}`}>
            {editId ? t('editAddress') : t('addNewAddress')}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(13,99,27,0.5)]" />
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>{t('deliveryDetails')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 pb-40 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Contact Information */}
          <section className="space-y-5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-5 bg-primary rounded-full shadow-[0_0_15px_rgba(13,99,27,0.5)]"></div>
              <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>{t('contactDetails')}</h3>
            </div>
            <div className={`rounded-[2.5rem] p-8 space-y-7 border transition-all duration-500 relative overflow-hidden ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-[0_15px_50px_rgb(0,0,0,0.04)]'}`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="space-y-2.5 relative">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('recipientName')}</label>
                <div className="relative group">
                  <User size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-primary group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-primary group-focus-within:scale-110'}`} />
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('recipientNamePlaceholder')}
                    className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 font-bold transition-all duration-300 outline-none ${
                      darkMode 
                        ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                        : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2.5 relative">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('phoneNumber')}</label>
                <div className="relative group">
                  <Phone size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-emerald-500 group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-emerald-500 group-focus-within:scale-110'}`} />
                  <input 
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('phonePlaceholder')}
                    className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 font-bold transition-all duration-300 outline-none ${
                      darkMode 
                        ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                        : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                    }`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section className="space-y-5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
              <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>{t('locationDetails')}</h3>
            </div>
            <div className={`rounded-[2.5rem] p-8 space-y-7 border transition-all duration-500 relative overflow-hidden ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-[0_15px_50px_rgb(0,0,0,0.04)]'}`}>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] -ml-20 -mb-20 pointer-events-none"></div>
              
              <div className="grid grid-cols-2 gap-5 relative">
                <div className="space-y-2.5">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('region')}</label>
                  <div className="relative group">
                    <Map size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-amber-500 group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-amber-500 group-focus-within:scale-110'}`} />
                    <input 
                      required
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="e.g. Yangon"
                      className={`w-full pl-11 pr-4 py-4.5 rounded-[1.25rem] border-2 text-sm font-bold transition-all duration-300 outline-none ${
                        darkMode 
                          ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                          : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('city')}</label>
                  <div className="relative group">
                    <Navigation size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-blue-500 group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-blue-500 group-focus-within:scale-110'}`} />
                    <input 
                      required
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Yangon"
                      className={`w-full pl-11 pr-4 py-4.5 rounded-[1.25rem] border-2 text-sm font-bold transition-all duration-300 outline-none ${
                        darkMode 
                          ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                          : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 relative">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('township')}</label>
                <div className="relative group">
                  <Landmark size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-purple-500 group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-purple-500 group-focus-within:scale-110'}`} />
                  <input 
                    required
                    type="text"
                    value={formData.township}
                    onChange={(e) => setFormData({ ...formData, township: e.target.value })}
                    placeholder="e.g. Kamayut"
                    className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 text-sm font-bold transition-all duration-300 outline-none ${
                      darkMode 
                        ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                        : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2.5 relative">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('streetAddress')}</label>
                <div className="relative group">
                  <MapPin size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-orange-500 group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-orange-500 group-focus-within:scale-110'}`} />
                  <input 
                    required
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="e.g. 123 Main Street"
                    className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 text-sm font-bold transition-all duration-300 outline-none ${
                      darkMode 
                        ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                        : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 relative">
                <div className="space-y-2.5">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('building')}</label>
                  <div className="relative group">
                    <Building size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-indigo-500 group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-indigo-500 group-focus-within:scale-110'}`} />
                    <input 
                      type="text"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      placeholder={t('buildingPlaceholder')}
                      className={`w-full pl-11 pr-4 py-4.5 rounded-[1.25rem] border-2 text-sm font-bold transition-all duration-300 outline-none ${
                        darkMode 
                          ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                          : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('room')}</label>
                  <div className="relative group">
                    <Hash size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${darkMode ? 'text-white/20 group-focus-within:text-rose-500 group-focus-within:scale-110' : 'text-on-surface-variant/40 group-focus-within:text-rose-500 group-focus-within:scale-110'}`} />
                    <input 
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      placeholder="e.g. 101"
                      className={`w-full pl-11 pr-4 py-4.5 rounded-[1.25rem] border-2 text-sm font-bold transition-all duration-300 outline-none ${
                        darkMode 
                          ? 'bg-slate-800/30 border-white/5 focus:border-primary/40 focus:bg-slate-800/50 text-white' 
                          : 'bg-slate-50/50 border-slate-100 focus:bg-white focus:border-primary/20 text-on-surface shadow-sm'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Label Selection */}
          <section className="space-y-5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-5 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
              <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>{t('addressLabel')}</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {labels.map((label) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, label })}
                  className={`py-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center gap-4 relative overflow-hidden ${
                    formData.label === label 
                      ? 'border-primary bg-primary/5 text-primary shadow-[0_15px_35px_rgba(13,99,27,0.1)]' 
                      : `border-on-surface/5 ${darkMode ? 'bg-slate-900/40' : 'bg-white'} text-on-surface-variant/40 hover:border-primary/20`
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${formData.label === label ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : (darkMode ? 'bg-white/5' : 'bg-slate-50')}`}>
                    {label === 'Home' ? <Home size={24} /> : label === 'Office' ? <Building size={24} /> : <MapPin size={24} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t(label.toLowerCase())}</span>
                  {formData.label === label && (
                    <motion.div 
                      layoutId="active-label"
                      className="absolute top-3 right-3 text-primary"
                    >
                      <CheckCircle2 size={16} className="fill-primary/10" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Default Toggle */}
          <section className={`flex items-center justify-between p-8 rounded-[2.5rem] border transition-all duration-500 ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-[0_15px_50px_rgb(0,0,0,0.04)]'}`}>
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-white/5 text-primary' : 'bg-primary/5 text-primary'}`}>
                <Check size={28} strokeWidth={3} />
              </div>
              <div className="space-y-1">
                <h4 className={`text-base font-black tracking-tight ${darkMode ? 'text-white' : 'text-on-surface'}`}>{t('setAsDefault')}</h4>
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${darkMode ? 'text-white/20' : 'text-on-surface-variant/40'}`}>{t('setAsDefaultDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              className={`w-16 h-8 rounded-full transition-all duration-500 relative p-1.5 ${
                formData.isDefault ? 'bg-primary shadow-[0_0_15px_rgba(13,99,27,0.4)]' : 'bg-on-surface/10'
              }`}
            >
              <motion.div 
                animate={{ x: formData.isDefault ? 32 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-white shadow-xl" 
              />
            </button>
          </section>

          {/* Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-8 z-50 max-w-md mx-auto">
            <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none -mt-16 ${darkMode ? 'from-slate-950 via-slate-950/80 to-transparent' : 'from-[#FAFAFA] via-[#FAFAFA]/80 to-transparent'}`}></div>
            <motion.button 
              type="submit"
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSaving}
              className="w-full relative bg-primary text-white py-5 rounded-[2rem] font-black text-sm shadow-[0_25px_60px_rgba(13,99,27,0.35)] flex items-center justify-center gap-4 transition-all hover:bg-primary-container disabled:opacity-50 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              {isSaving ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={22} className="group-hover:rotate-12 transition-transform duration-300" />
              )}
              <span className="uppercase tracking-[0.2em]">{editId ? t('updateAddress') : t('saveAddress')}</span>
            </motion.button>
          </div>
        </form>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
