import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Save, MapPin, Phone, User, Home, Building, CheckCircle2, Navigation, Landmark, Hash, Check, Map } from 'lucide-react';
import { motion } from 'motion/react';
import { Address } from '../types';

export default function AddAddressPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { addresses, addAddress, updateAddress, t, darkMode, userName, userPhone, serviceAreas } = useStore();
  
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

  // Filter active service areas
  const activeServiceAreas = serviceAreas.filter(area => area.isActive);

  // Compute unique regions
  const availableRegions = Array.from(new Set(activeServiceAreas.map(a => a.region)));

  // Helper to get cities for a region
  const getRegionCities = (regionName: string) => {
    const area = activeServiceAreas.find(a => a.region === regionName);
    if (!area) return [];
    
    return area.cities || [];
  };

  const currentRegionCities = getRegionCities(formData.region);
  const availableCities = currentRegionCities.map(c => c.name);

  // Compute townships for selected region and city
  const availableTownships = currentRegionCities.find(c => c.name === formData.city)?.townships || [];

  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (editId) {
      const existing = addresses.find(a => a.id === editId);
      if (existing) {
        const { id, ...rest } = existing;
        setFormData(rest);
      }
    } else {
      // Simulate GPS locating on new address
      setIsLocating(true);
      setTimeout(() => setIsLocating(false), 2000);
    }
  }, [editId, addresses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editId) {
        await updateAddress(editId, formData);
      } else {
        await addAddress(formData);
      }
      navigate(-1);
    } catch (error) {
      console.error("Error saving address:", error);
      setIsSaving(false);
    }
  };

  const labels: ('Home' | 'Office' | 'Other')[] = ['Home', 'Office', 'Other'];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 flex items-center justify-between px-4 h-[72px] border-b backdrop-blur-3xl ${darkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-on-surface/5'}`}>
        <button 
          onClick={() => navigate(-1)}
          className={`flex-none w-10 h-10 border shadow-sm rounded-full flex items-center justify-center transition-all active:scale-95 ${darkMode ? 'bg-slate-800 border-white/10 hover:bg-slate-700 text-white' : 'bg-white border-on-surface/5 hover:bg-slate-50 text-slate-900'}`}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-bold absolute left-1/2 -translate-x-1/2">
          {editId ? t('editAddress') : t('addNewAddress')}
        </h1>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </header>

      <main className="pb-8">
        <form onSubmit={handleSubmit}>
          
          {/* Contact Section */}
          <div className="px-4 mt-4">
            <h2 className={`text-[10px] font-black mb-2 uppercase tracking-widest ml-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Contact Info</h2>
            <div className={`rounded-2xl overflow-hidden border ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-sm'}`}>
              <div className={`px-4 py-2 border-b ${darkMode ? 'border-white/5' : 'border-on-surface/5'}`}>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Recipient Name</label>
                <input 
                  required type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('recipientNamePlaceholder')}
                  className="w-full bg-transparent font-bold text-sm outline-none"
                />
              </div>
              <div className="px-4 py-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Phone Number</label>
                <input 
                  required type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('phonePlaceholder')}
                  className="w-full bg-transparent font-bold text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="px-4 mt-5">
            <h2 className={`text-[10px] font-black mb-2 uppercase tracking-widest ml-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Address Details</h2>
            <div className={`rounded-2xl overflow-hidden border ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-sm'}`}>
              <div className={`px-4 py-2 border-b ${darkMode ? 'border-white/5' : 'border-on-surface/5'} relative`}>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Region / State</label>
                <select 
                  required
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value, city: '', township: '' })}
                  className={`w-full bg-transparent font-bold text-sm outline-none appearance-none cursor-pointer ${!formData.region && (darkMode ? 'text-white/40' : 'text-slate-400')}`}
                >
                  <option value="" disabled className={darkMode ? 'bg-slate-900' : 'bg-white'}>{t('region')}</option>
                  {availableRegions.map(region => (
                    <option key={region} value={region} className={darkMode ? 'bg-slate-900' : 'bg-white'}>{region}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute bottom-3 right-4 flex items-center">
                  <svg className="w-4 h-4 fill-current opacity-30" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              <div className={`px-4 py-2 border-b ${darkMode ? 'border-white/5' : 'border-on-surface/5'} relative`}>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">City / District</label>
                <select 
                  required
                  disabled={!formData.region}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value, township: '' })}
                  className={`w-full bg-transparent font-bold text-sm outline-none appearance-none cursor-pointer disabled:opacity-50 ${!formData.city && (darkMode ? 'text-white/40' : 'text-slate-400')}`}
                >
                  <option value="" disabled className={darkMode ? 'bg-slate-900' : 'bg-white'}>{t('city')}</option>
                  {availableCities.map(city => (
                    <option key={city} value={city} className={darkMode ? 'bg-slate-900' : 'bg-white'}>{city}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute bottom-3 right-4 flex items-center">
                  <svg className="w-4 h-4 fill-current opacity-30" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              <div className={`px-4 py-2 border-b ${darkMode ? 'border-white/5' : 'border-on-surface/5'} relative`}>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Township</label>
                <select 
                  required
                  disabled={!formData.city}
                  value={formData.township}
                  onChange={(e) => setFormData({ ...formData, township: e.target.value })}
                  className={`w-full bg-transparent font-bold text-sm outline-none appearance-none cursor-pointer disabled:opacity-50 ${!formData.township && (darkMode ? 'text-white/40' : 'text-slate-400')}`}
                >
                  <option value="" disabled className={darkMode ? 'bg-slate-900' : 'bg-white'}>{t('township')}</option>
                  {availableTownships.map(township => (
                    <option key={township} value={township} className={darkMode ? 'bg-slate-900' : 'bg-white'}>{township}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute bottom-3 right-4 flex items-center">
                  <svg className="w-4 h-4 fill-current opacity-30" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              <div className={`px-4 py-2 border-b ${darkMode ? 'border-white/5' : 'border-on-surface/5'}`}>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Street / Road / Quarter</label>
                <input 
                  required type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder={t('streetAddress')}
                  className="w-full bg-transparent font-bold text-sm outline-none"
                />
              </div>
              <div className={`px-4 py-2 border-b ${darkMode ? 'border-white/5' : 'border-on-surface/5'}`}>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Building / Floor</label>
                <input 
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder={`${t('building')} (Optional)`}
                  className="w-full bg-transparent font-bold text-sm outline-none"
                />
              </div>
              <div className="px-4 py-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Note (e.g. House Number / Room)</label>
                <input 
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder={`${t('room')} (Optional)`}
                  className="w-full bg-transparent font-bold text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="px-4 mt-5">
            <h2 className={`text-[10px] font-black mb-2 uppercase tracking-widest ml-1 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>Settings</h2>
            
            <div className={`rounded-2xl overflow-hidden mb-3 border ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-sm'}`}>
              <div className="px-4 py-3.5">
                <p className="font-bold mb-3 text-sm">{t('addressLabel')}</p>
                <div className="flex gap-2">
                  {labels.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({ ...formData, label })}
                      className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                        formData.label === label 
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                          : `${darkMode ? 'bg-white/5 text-white/60 hover:text-white border-transparent' : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent'}`
                      }`}
                    >
                      {t(label.toLowerCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`rounded-2xl overflow-hidden flex items-center justify-between px-4 py-3.5 border ${darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-sm'}`}>
              <span className="font-bold text-sm">{t('setAsDefault')}</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                className={`w-[44px] h-[24px] rounded-full transition-all relative p-0.5 ${
                  formData.isDefault ? 'bg-primary' : (darkMode ? 'bg-white/10' : 'bg-slate-200')
                }`}
              >
                <div 
                  className={`w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.isDefault ? 'translate-x-[20px]' : 'translate-x-[2px]'}`}
                />
              </button>
            </div>
            
            {/* Save Button */}
            <div className="mt-6 mb-2">
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                <span>{editId ? t('updateAddress') : t('saveAddress')}</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

