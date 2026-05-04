import React, { useState } from 'react';
import { 
  DollarSign, Clock, Save, Phone, ClipboardList, CreditCard, 
  ShieldCheck, AlertTriangle, User, ShieldAlert, Zap, Globe,
  Database, ShoppingBag, RefreshCw, MessageSquare, Info, XCircle, ShoppingCart, Plus, ChevronDown, MapPin, QrCode, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, SupportContact } from '../../context/StoreContext';
import { toast } from 'sonner';
import { auth } from '../../lib/firebase';
import { seedSampleOrders } from '../../lib/seed';
import { ServiceAreasConfig } from './ServiceAreasConfig';
import { QRCodeModal } from '../ui/QRCodeModal';
import { PRODUCTION_URL } from '../../constants';

export function SettingsTab({ 
  darkMode,
  handleSeed,
  isSeeding,
  handleMigrate,
  isMigrating,
  setIsSeeding
}: { 
  darkMode: boolean,
  handleSeed: () => Promise<void>,
  isSeeding: boolean,
  handleMigrate: () => Promise<void>,
  isMigrating: boolean,
  setIsSeeding: (seeding: boolean) => void
}) {
  const {
    supportNumber, setSupportNumber,
    supportContacts, setSupportContacts,
    bankName, setBankName,
    bankAccountNumber, setBankAccountNumber,
    bankAccountName, setBankAccountName,
    currency, setCurrency,
    t,
    isDeliveryEnabled, setIsDeliveryEnabled,
    deliveryFee, setDeliveryFee,
    isLowStockAlertEnabled, setIsLowStockAlertEnabled,
    isMaintenanceMode, updateMaintenanceMode,
    cutoffTime, setCutoffTime,
    isBankEnabled, setIsBankEnabled,
    estimatedDeliveryTime, setEstimatedDeliveryTime,
    signInWithGoogle,
    authUid,
    shopPhone, setShopPhone,
    shopEmail, setShopEmail,
    settings, updateSettings
  } = useStore();

  const [tempSupportNumber, setTempSupportNumber] = useState(supportNumber);
  const [tempCutoffTime, setTempCutoffTime] = useState(cutoffTime);
  const [tempEstimatedDeliveryTime, setTempEstimatedDeliveryTime] = useState(estimatedDeliveryTime);
  const [tempDeliveryFee, setTempDeliveryFee] = useState(deliveryFee || 0);
  const [tempShopPhone, setTempShopPhone] = useState(shopPhone);
  const [tempShopEmail, setTempShopEmail] = useState(shopEmail);
  const [tempProductionUrl, setTempProductionUrl] = useState(settings.productionUrl);
  const [tempBankDetails, setTempBankDetails] = useState({
    name: bankName,
    number: bankAccountNumber,
    accountName: bankAccountName,
  });

  const [newContact, setNewContact] = useState<{ 
    labelEn: string; 
    labelMm: string; 
    phone: string; 
    type: SupportContact['type'] 
  }>({ 
    labelEn: '', 
    labelMm: '', 
    phone: '', 
    type: 'help' 
  });

  const addContact = () => {
    if (!newContact.labelEn || !newContact.phone) {
      toast.error('Label and phone are required');
      return;
    }
    const contact: SupportContact = {
      id: Date.now().toString(),
      ...newContact
    };
    setSupportContacts([...supportContacts, contact]);
    setNewContact({ labelEn: '', labelMm: '', phone: '', type: 'help' });
    toast.success('Contact channel added');
  };

  const getIconForType = (type: SupportContact['type']) => {
    switch(type) {
      case 'help': return <Info size={14} />;
      case 'order': return <ShoppingCart size={14} />;
      case 'cancellation': return <XCircle size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  const removeContact = (id: string) => {
    setSupportContacts(supportContacts.filter(c => c.id !== id));
    toast.success('Contact removed');
  };

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState(settings.productionUrl);
  const [qrTitle, setQrTitle] = useState("Shop App QR");

  const sections = [
    { id: 'marketing', label: 'Marketing', sub: 'QR Codes & Sharing', icon: <QrCode size={18} />, color: 'bg-indigo-600' },
    { id: 'localization', label: 'Localization', sub: 'Currency & Fees', icon: <Globe size={18} />, color: 'bg-primary' },
    { id: 'schedule', label: 'Schedule', sub: 'Delivery & Cut-off', icon: <Clock size={18} />, color: 'bg-blue-500' },
    { id: 'serviceAreas', label: 'Service Areas', sub: 'Delivery Locations', icon: <MapPin size={18} />, color: 'bg-indigo-500' },
    { id: 'branding', label: 'Branding', sub: 'Shop Info & Emails', icon: <ClipboardList size={18} />, color: 'bg-amber-500' },
    { id: 'support', label: 'Support Channels', sub: 'WhatsApp & Flows', icon: <Phone size={18} />, color: 'bg-purple-500' },
    { id: 'payments', label: 'Payments', sub: 'Bank & Transfers', icon: <CreditCard size={18} />, color: 'bg-emerald-500' },
    { id: 'system', label: 'System Tools', sub: 'Data & Maintenance', icon: <Database size={18} />, color: 'bg-rose-500' },
  ];

  const SettingRow = ({ section, children }: { section: typeof sections[0], children: React.ReactNode }) => {
    const isOpen = openSection === section.id;
    return (
      <div className={`mb-3 overflow-hidden transition-all duration-300 rounded-xl border ${
        isOpen 
          ? (darkMode ? 'bg-white/5 border-primary/30 ring-1 ring-primary/20 shadow-xl shadow-primary/5' : 'bg-white border-primary/20 shadow-xl shadow-on-surface/5') 
          : (darkMode ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' : 'bg-surface-container-high/20 border-white/5 hover:bg-surface-container-high/40 shadow-sm')
      }`}>
        <button 
          onClick={() => setOpenSection(isOpen ? null : section.id)}
          className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors cursor-pointer hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center gap-6">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg ${section.color} ${isOpen ? 'scale-110 shadow-primary/20' : 'opacity-80'} transition-all`}>
              {section.icon}
            </div>
            <div>
              <h4 className={`text-sm font-black uppercase tracking-widest leading-none ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{section.label}</h4>
              <p className="text-[10px] font-bold opacity-40 mt-1.5 uppercase tracking-tighter">{section.sub}</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-primary text-white rotate-180 scale-110' : 'bg-on-surface/5 opacity-40'}`}>
            <ChevronDown size={18} />
          </div>
        </button>
        
        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="p-6 pt-0">
            <div className={`h-px w-full mb-6 ${darkMode ? 'bg-white/5' : 'bg-on-surface/5'}`} />
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>
            {t('generalSettings')}
          </h2>
          <p className={`text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1 italic`}>
            System configuration & core store controls
          </p>
        </div>
        
        <div className={`flex items-center gap-2 p-1 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-on-surface/5'}`}>
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${isMaintenanceMode ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isMaintenanceMode ? 'Maintenance Active' : 'System Live'}
            </span>
          </div>
          <button 
            onClick={() => updateMaintenanceMode(!isMaintenanceMode)}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white shadow-sm hover:bg-gray-50'
            }`}
          >
            {isMaintenanceMode ? 'Disable' : 'Enable'} Maintenance
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Marketing / QR */}
        <SettingRow section={sections[0]}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className={`p-8 rounded-[2.5rem] flex flex-col items-center text-center gap-4 flex-1 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-on-surface/5'}`}>
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
                <QrCode size={32} />
              </div>
              <div>
                <h5 className="text-sm font-black uppercase tracking-tight mb-1">Application QR Code</h5>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest max-w-[200px] mx-auto">
                  Generate a scanable QR code for your shop to print on banners, flyers or receipts.
                </p>
              </div>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <QrCode size={18} />
                Generate QR Code
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="p-6 rounded-3xl bg-on-surface/5 border border-on-surface/5">
                <div className="flex items-center justify-between mb-3">
                  <h6 className="text-[10px] font-black uppercase tracking-widest opacity-40">Main Production Link (Stable URL)</h6>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-tight">System Link Active</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={tempProductionUrl}
                    onChange={(e) => setTempProductionUrl(e.target.value)}
                    placeholder="https://your-delivery-site.com"
                    className={`flex-1 px-4 py-3 rounded-xl border text-[10px] font-mono outline-none focus:border-primary transition-all ${
                      darkMode ? 'bg-black/20 border-white/10' : 'bg-white border-on-surface/5'
                    }`}
                  />
                  <button 
                    onClick={() => {
                      updateSettings({ productionUrl: tempProductionUrl });
                    }}
                    className="p-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                    title="Save stable link"
                  >
                    <Save size={16} />
                  </button>
                </div>
                <p className="text-[9px] font-medium opacity-40 mt-3 px-1 leading-relaxed">
                  ⚠️ <b>အရေးကြီးသည်:</b> ဤ Link သည် သင်၏ လက်ကမ်းစာစောင်များရှိ QR Code ထဲတွင် ပါဝင်မည့် Link ဖြစ်သည်။ 
                  Website Update တင်၍ Link အသစ်ထွက်လာပါက ဤနေရာတွင် လာရောက်ပြင်ဆင်ပေးရုံဖြင့် လက်ရှိ QR ဟောင်းများ ဆက်လက်အလုပ်လုပ်နေမည်ဖြစ်သည်။
                </p>
              </div>

              {/* Professional QR Marketing Section */}
              <div className={`p-8 rounded-[2rem] border transition-all ${
                darkMode ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100 shadow-sm'
              }`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <h6 className="text-sm font-black uppercase tracking-tight">Marketing QR System</h6>
                      <p className="text-[11px] opacity-50 font-medium">For Flyers, Posters & Home Delivery Packages</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                    Industry standard
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-on-surface/5 border border-on-surface/5">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">
                      Flyer Destination URL
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text"
                          value={tempProductionUrl}
                          onChange={(e) => setTempProductionUrl(e.target.value)}
                          placeholder="https://yourlink.com"
                          className={`w-full pl-10 pr-4 py-3.5 rounded-xl border text-[11px] font-mono outline-none focus:border-primary transition-all ${
                            darkMode ? 'bg-black/40 border-white/10' : 'bg-white border-on-surface/10'
                          }`}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (!tempProductionUrl.startsWith('http')) {
                            toast.error("Please enter a valid URL starting with http:// or https://");
                            return;
                          }
                          updateSettings({ productionUrl: tempProductionUrl });
                        }}
                        className="px-6 rounded-xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Save size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Connect</span>
                      </button>
                    </div>
                    <div className="mt-4 flex items-start gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[9px] font-bold text-amber-600/80 leading-relaxed italic">
                        <b>အရေးကြီးသည်:</b> သင်၏ လက်ကမ်းစာစောင်များကို မရိုက်နှိပ်မီ အပေါ်မှ URL ကို သေချာစွာ စစ်ဆေးပါ။ Website Link ပြောင်းသွားသော်လည်း ဤနေရာကို လာပြင်လိုက်ရုံဖြင့် အဟောင်း QR များ ဆက်လက် အလုပ်လုပ်နေမည် ဖြစ်သည်။
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setQrUrl(settings.productionUrl);
                        setQrTitle("Sar Taw Set - Delivery Flyer");
                        setIsQRModalOpen(true);
                      }}
                      className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all hover:scale-105 active:scale-95 ${
                        darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-on-surface/5 hover:border-primary/20 shadow-md'
                      }`}
                    >
                      <Download size={24} className="text-primary" />
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest">Flyer HQ</span>
                        <span className="text-[8px] opacity-40 font-bold uppercase tracking-tight">Large Size (1024px)</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        window.open(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(settings.productionUrl)}`, '_blank');
                        toast.info("Opening raw preview...");
                      }}
                      className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all hover:scale-105 active:scale-95 ${
                        darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-on-surface/5 hover:border-primary/20 shadow-md'
                      }`}
                    >
                      <Globe size={24} className="text-indigo-500" />
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest">Raw Preview</span>
                        <span className="text-[8px] opacity-40 font-bold uppercase tracking-tight">Test connectivity</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-indigo-50/10 border-indigo-100/50'}`}>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-bold leading-relaxed opacity-60">
                    QR Dynamic System is active. All scans are routed through your verified stable link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SettingRow>

        {/* Localization */}
        <SettingRow section={sections[1]}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Store Currency</label>
              <div className="flex gap-1 p-1 rounded-2xl bg-on-surface/10">
                {['MMK', 'RM'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr as any)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${
                      currency === curr 
                        ? 'bg-primary text-surface shadow-xl shadow-primary/20 scale-105' 
                        : 'text-on-surface/40 hover:text-on-surface/60'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Delivery Fee ({currency})</label>
               <div className="relative">
                 <input 
                   type="number"
                   value={tempDeliveryFee}
                   onChange={(e) => setTempDeliveryFee(Number(e.target.value))}
                   className={`w-full pl-6 pr-16 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                     darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'
                   }`}
                 />
                 <button 
                   onClick={() => { setDeliveryFee(tempDeliveryFee); toast.success('Fee updated'); }}
                   className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-primary text-surface shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center hover:brightness-110"
                 >
                   <Save size={18} />
                 </button>
               </div>
            </div>
          </div>
        </SettingRow>

        {/* Schedule */}
        <SettingRow section={sections[2]}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 p-6 rounded-3xl bg-on-surface/5 flex flex-col items-center justify-center text-center space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDeliveryEnabled ? 'bg-emerald-500 text-white' : 'bg-on-surface/10 opacity-40'}`}>
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Accepting Orders</p>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter mt-1">Global switch for new orders</p>
              </div>
              <button 
                onClick={() => setIsDeliveryEnabled(!isDeliveryEnabled)}
                className={`w-14 h-7 rounded-full relative transition-all ${isDeliveryEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-on-surface/20'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all ${isDeliveryEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Daily Cut-off Time</label>
                <div className="relative">
                  <input 
                    type="time"
                    value={tempCutoffTime}
                    onChange={(e) => setTempCutoffTime(e.target.value)}
                    className={`w-full pl-6 pr-16 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'
                    }`}
                  />
                  <button 
                    onClick={() => { setCutoffTime(tempCutoffTime); toast.success('Cut-off updated'); }}
                    className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-primary text-surface shadow-lg shadow-primary/20 flex items-center justify-center hover:brightness-110 active:scale-95"
                  >
                    <Save size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Estimated Delivery Window</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={tempEstimatedDeliveryTime}
                    onChange={(e) => setTempEstimatedDeliveryTime(e.target.value)}
                    placeholder="e.g. 8AM - 10AM"
                    className={`w-full pl-6 pr-16 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'
                    }`}
                  />
                  <button 
                    onClick={() => { setEstimatedDeliveryTime(tempEstimatedDeliveryTime); toast.success('Window updated'); }}
                    className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-primary text-surface shadow-lg shadow-primary/20 flex items-center justify-center hover:brightness-110 active:scale-95"
                  >
                    <Save size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SettingRow>

        {/* Service Areas */}
        <SettingRow section={sections[3]}>
          <ServiceAreasConfig darkMode={darkMode} />
        </SettingRow>

        {/* Branding */}
        <SettingRow section={sections[4]}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Shop Public Phone</label>
              <div className="relative">
                <input 
                  type="text"
                  value={tempShopPhone}
                  onChange={(e) => setTempShopPhone(e.target.value)}
                  className={`w-full pl-6 pr-16 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                    darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'
                  }`}
                />
                <button 
                  onClick={() => { setShopPhone(tempShopPhone); toast.success('Phone updated'); }}
                  className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-primary text-surface shadow-lg shadow-primary/20 flex items-center justify-center hover:brightness-110 active:scale-95"
                >
                  <Save size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Customer Support Email</label>
              <div className="relative">
                <input 
                  type="email"
                  value={tempShopEmail}
                  onChange={(e) => setTempShopEmail(e.target.value)}
                  className={`w-full pl-6 pr-16 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                    darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'
                  }`}
                />
                <button 
                  onClick={() => { setShopEmail(tempShopEmail); toast.success('Email updated'); }}
                  className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-primary text-surface shadow-lg shadow-primary/20 flex items-center justify-center hover:brightness-110 active:scale-95"
                >
                  <Save size={18} />
                </button>
              </div>
            </div>
          </div>
        </SettingRow>

        {/* Support */}
        <SettingRow section={sections[5]}>
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 rounded-3xl bg-red-500/5 border border-red-500/10">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-500">Low Stock Notifications</p>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter mt-1">Alert admins when inventory falls below limit</p>
              </div>
              <button 
                onClick={() => setIsLowStockAlertEnabled(!isLowStockAlertEnabled)}
                className={`w-12 h-6 rounded-full relative transition-all ${isLowStockAlertEnabled ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-on-surface/20'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${isLowStockAlertEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Add New Channel */}
              <div className="space-y-4">
                <h5 className="text-[11px] font-black uppercase tracking-widest opacity-60">Add Support Channel</h5>
                  <div className="p-1 rounded-3xl bg-on-surface/5 space-y-4">
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Flow Category</label>
                        <div className="relative">
                          <select 
                            value={newContact.type}
                            onChange={(e) => setNewContact({...newContact, type: e.target.value as any})}
                            className={`w-full px-5 py-3 rounded-xl border text-xs font-black outline-none focus:border-primary transition-all appearance-none ${
                              darkMode ? 'bg-white/5 border-white/10 shadow-sm' : 'bg-white border-on-surface/10'
                            }`}
                          >
                            <option value="help">Help Center</option>
                            <option value="general">General Support</option>
                            <option value="order">Order Inquiries</option>
                            <option value="cancellation">Cancellation Requests</option>
                            <option value="other">Other / Custom</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <Zap size={12} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Label (English)</label>
                          <input 
                            type="text"
                            placeholder="e.g. Sales Team"
                            value={newContact.labelEn}
                            onChange={(e) => setNewContact({...newContact, labelEn: e.target.value})}
                            className={`w-full px-5 py-3 rounded-xl border text-xs font-black outline-none focus:border-primary transition-all ${
                              darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-on-surface/10'
                            }`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Label (Burmese)</label>
                          <input 
                            type="text"
                            placeholder="ဥပမာ- အရောင်း"
                            value={newContact.labelMm}
                            onChange={(e) => setNewContact({...newContact, labelMm: e.target.value})}
                            className={`w-full px-5 py-3 rounded-xl border text-xs font-black outline-none focus:border-primary transition-all ${
                              darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-on-surface/10'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">WhatsApp Number (e.g. 6011...)</label>
                        <input 
                          type="text"
                          placeholder="601128096366"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                          className={`w-full px-5 py-3 rounded-xl border text-xs font-black outline-none focus:border-primary transition-all ${
                            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-on-surface/10'
                          }`}
                        />
                      </div>

                      <button 
                        onClick={addContact}
                        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-3"
                      >
                        <Plus size={18} />
                        Register Channel
                      </button>
                    </div>
                  </div>
              </div>

              {/* Channel List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black uppercase tracking-widest opacity-60">Active Channels</h5>
                  <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">{supportContacts.length} Registered</span>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {supportContacts.map((contact) => (
                    <div key={contact.id} className={`p-4 rounded-3xl border flex items-center justify-between group transition-all ${
                      darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-on-surface/5 hover:bg-on-surface/10'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${darkMode ? 'bg-primary/20 text-primary' : 'bg-primary/5 text-primary'}`}>
                          {getIconForType(contact.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-black tracking-tight leading-none uppercase">{contact.labelEn}</span>
                            <span className="text-[9px] font-bold opacity-30 italic leading-none">{contact.labelMm}</span>
                          </div>
                          <p className="text-[10px] font-mono opacity-60 leading-none">+{contact.phone}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeContact(contact.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-500/5 hover:bg-red-500 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all transform group-hover:scale-105"
                      >
                        <AlertTriangle size={16} />
                      </button>
                    </div>
                  ))}
                  {supportContacts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-on-surface/10 rounded-[2.5rem]">
                      <Phone size={48} className="mb-4" />
                      <p className="text-[11px] font-black uppercase tracking-widest">No Support Channels Configured</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SettingRow>

        {/* Payments */}
        <SettingRow section={sections[6]}>
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest">Manual Bank Transfer</p>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter mt-1">Allow customers to upload receipt for verification</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBankEnabled(!isBankEnabled)}
                className={`w-14 h-7 rounded-full relative transition-all ${isBankEnabled ? 'bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-on-surface/20'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all ${isBankEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Bank Institution</label>
                  <input 
                    type="text"
                    value={tempBankDetails.name}
                    onChange={(e) => setTempBankDetails({...tempBankDetails, name: e.target.value})}
                    placeholder="e.g. Maybank / KBZ Pay"
                    className={`w-full px-6 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5 shadow-inner'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Account Identifier</label>
                  <input 
                    type="text"
                    value={tempBankDetails.number}
                    onChange={(e) => setTempBankDetails({...tempBankDetails, number: e.target.value})}
                    placeholder="e.g. 1234-5678-90"
                    className={`w-full px-6 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5 shadow-inner'
                    }`}
                  />
                </div>
              </div>
              <div className="space-y-4 flex flex-col">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Legal Account Name</label>
                  <input 
                    type="text"
                    value={tempBankDetails.accountName}
                    onChange={(e) => setTempBankDetails({...tempBankDetails, accountName: e.target.value})}
                    placeholder="e.g. KO KO AUNG"
                    className={`w-full px-6 py-4 rounded-2xl border text-sm font-black outline-none focus:border-primary transition-all ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5 shadow-inner'
                    }`}
                  />
                </div>
                <button 
                  onClick={() => {
                    setBankName(tempBankDetails.name);
                    setBankAccountNumber(tempBankDetails.number);
                    setBankAccountName(tempBankDetails.accountName);
                    toast.success('System parameters updated');
                  }}
                  className="mt-auto py-4 rounded-2xl bg-primary text-surface shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:brightness-110"
                >
                  <Save size={20} />
                  Persist Payment Data
                </button>
              </div>
            </div>
          </div>
        </SettingRow>

        {/* System */}
        <SettingRow section={sections[7]}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-widest opacity-60">Maintenance Mode</h5>
              <div className={`p-6 rounded-[2rem] border flex flex-col items-center text-center gap-4 ${isMaintenanceMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-on-surface/5 border-transparent'}`}>
                <ShieldAlert size={32} className={isMaintenanceMode ? 'text-amber-500' : 'opacity-20'} />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Public Access Lock</p>
                  <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-1">Prevent shopping while performing updates</p>
                </div>
                <button 
                  onClick={() => updateMaintenanceMode(!isMaintenanceMode)}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                    isMaintenanceMode ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-on-surface/20'
                  }`}
                >
                  {isMaintenanceMode ? 'Unlock System' : 'Lock System'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-widest opacity-60">Development Utilities</h5>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className={`group p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between ${
                    isSeeding ? 'opacity-50' : 'hover:bg-amber-500 hover:text-white hover:shadow-xl hover:shadow-amber-500/20'
                  } ${darkMode ? 'bg-white/5 text-amber-400' : 'bg-amber-50 text-amber-600 shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <Database size={18} className={isSeeding ? 'animate-bounce' : ''} />
                    <span>Reset Inventory Data</span>
                  </div>
                  <XCircle size={16} className="opacity-0 group-hover:opacity-100 transition-all rotate-45" />
                </button>

                <button
                  onClick={async () => {
                    setIsSeeding(true);
                    try {
                      await seedSampleOrders();
                      toast.success("Orders populated");
                    } catch (e) {
                      toast.error("Process failed");
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                  disabled={isSeeding}
                  className={`group p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between ${
                    isSeeding ? 'opacity-50' : 'hover:bg-emerald-500 hover:text-white hover:shadow-xl hover:shadow-emerald-500/20'
                  } ${darkMode ? 'bg-white/5 text-emerald-400' : 'bg-emerald-50 text-emerald-600 shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <ShoppingBag size={18} className={isSeeding ? 'animate-bounce' : ''} />
                    <span>Generate Dummy Orders</span>
                  </div>
                  <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className={`group p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between ${
                    isMigrating ? 'opacity-50' : 'hover:bg-blue-500 hover:text-white hover:shadow-xl hover:shadow-blue-500/20'
                  } ${darkMode ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-600 shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <RefreshCw size={18} className={isMigrating ? 'animate-spin' : ''} />
                    <span>Synchronize Schema</span>
                  </div>
                  <Save size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </SettingRow>
      </div>

      {/* Auth Status Bar */}
      <div className={`p-6 rounded-[2.5rem] border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-emerald-600 border-transparent shadow-xl shadow-emerald-600/20 text-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-primary/20 text-primary' : 'bg-white/20 text-white'}`}>
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">System Status</p>
              <p className="text-[9px] font-bold opacity-60 mt-1">
                {authUid ? `Secure connection active as ${auth.currentUser?.email}` : 'System restricted. Please authorize.'}
              </p>
            </div>
          </div>
          
          {!authUid && (
            <button 
              onClick={signInWithGoogle}
              className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 ${
                darkMode ? 'bg-primary text-surface' : 'bg-white text-emerald-600 shadow-lg'
              }`}
            >
               Authorize
            </button>
          )}
        </div>
      </div>

      <QRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        url={qrUrl}
        title={qrTitle}
        subtitle="Catalog & Ordering System"
        darkMode={darkMode}
      />
    </div>
  );
}
