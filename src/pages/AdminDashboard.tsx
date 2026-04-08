import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Product } from '../context/StoreContext';
import { LogOut, Package, Clock, CheckCircle2, LayoutDashboard, ShoppingBag, ListChecks, ChevronRight, MapPin, Settings, Phone, Save, CreditCard, DollarSign, Database, RefreshCw, Plus, Trash2, Sparkles, Image as ImageIcon, Tag, Hash, ShieldCheck, Menu, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { seedDatabase, seedSampleOrders, PRODUCTS } from '../lib/seed';
import { CATEGORIES } from '../constants';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { translateProductName } from '../services/translationService';

function BannerManagement({ banners, add, update, remove, darkMode }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    type: 'deal',
    tag: 'dailyDeal',
    title: '',
    subtitle: '',
    image: '',
    color: 'bg-emerald-600',
    isActive: true
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await add(formData);
    setShowAdd(false);
    setFormData({ type: 'deal', tag: 'dailyDeal', title: '', subtitle: '', image: '', color: 'bg-emerald-600', isActive: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Banners</h3>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600 text-white'}`}
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className={`p-8 rounded-[2rem] border space-y-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Subtitle" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
            <select className="bg-white/5 p-4 rounded-xl border border-white/10" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="deal">Deal</option>
              <option value="bundle">Bundle</option>
              <option value="flash-sale">Flash Sale</option>
            </select>
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Add Banner</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner: any) => (
          <div key={banner.id} className={`p-6 rounded-[2rem] border relative overflow-hidden ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{banner.type}</span>
              <h4 className="font-black text-lg">{banner.title}</h4>
              <p className="text-xs opacity-60">{banner.subtitle}</p>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => update(banner.id, { isActive: !banner.isActive })}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${banner.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}
                >
                  {banner.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => remove(banner.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <img src={banner.image} className="absolute right-[-10%] top-0 h-full w-1/2 object-cover opacity-20 grayscale" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DealManagement({ deals, add, update, remove, darkMode, formatPrice }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    type: 'daily-deal',
    title: '',
    titleMm: '',
    originalPrice: '',
    price: '',
    discount: '',
    image: '',
    endTime: '',
    soldCount: 0,
    totalCount: 100,
    description: '',
    descriptionMm: '',
    isActive: true
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await add({
      ...formData,
      originalPrice: Number(formData.originalPrice),
      price: Number(formData.price),
      totalCount: Number(formData.totalCount)
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Deals</h3>
        <button onClick={() => setShowAdd(!showAdd)} className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600 text-white'}`}>
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className={`p-8 rounded-[2rem] border space-y-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Title (EN)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Title (MM)" value={formData.titleMm} onChange={e => setFormData({...formData, titleMm: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Original Price" type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Sale Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Discount (e.g. 20%)" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="End Time (ISO)" type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
            <select className="bg-white/5 p-4 rounded-xl border border-white/10" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="daily-deal">Daily Deal</option>
              <option value="flash-sale">Flash Sale</option>
            </select>
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Add Deal</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal: any) => (
          <div key={deal.id} className={`p-6 rounded-[2rem] border flex gap-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <img src={deal.image} className="w-20 h-20 rounded-2xl object-cover" />
            <div className="flex-grow space-y-1">
              <h4 className="font-black text-sm">{deal.title}</h4>
              <p className="text-xs text-emerald-600 font-black">{formatPrice(deal.price)} <span className="text-gray-400 line-through ml-2">{formatPrice(deal.originalPrice)}</span></p>
              <div className="flex gap-2 pt-2">
                <button onClick={() => update(deal.id, { isActive: !deal.isActive })} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${deal.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {deal.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => remove(deal.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BundleManagement({ bundles, add, update, remove, darkMode, formatPrice }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    titleMm: '',
    description: '',
    descriptionMm: '',
    originalPrice: '',
    price: '',
    image: '',
    items: '',
    isActive: true
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await add({
      ...formData,
      originalPrice: Number(formData.originalPrice),
      price: Number(formData.price),
      items: formData.items.split(',').map(i => i.trim()),
      type: 'bundle'
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Bundles (Combo Packs)</h3>
        <button onClick={() => setShowAdd(!showAdd)} className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600 text-white'}`}>
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className={`p-8 rounded-[2rem] border space-y-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Title (EN)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Title (MM)" value={formData.titleMm} onChange={e => setFormData({...formData, titleMm: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Original Price" type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Sale Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
            <input className="bg-white/5 p-4 rounded-xl border border-white/10" placeholder="Items (comma separated)" value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} required />
            <textarea className="bg-white/5 p-4 rounded-xl border border-white/10 md:col-span-2" placeholder="Description (EN)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Add Bundle</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle: any) => (
          <div key={bundle.id} className={`p-6 rounded-[2rem] border flex gap-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <img src={bundle.image} className="w-20 h-20 rounded-2xl object-cover" />
            <div className="flex-grow space-y-1">
              <h4 className="font-black text-sm">{bundle.title}</h4>
              <p className="text-xs text-emerald-600 font-black">{formatPrice(bundle.price)}</p>
              <div className="flex gap-2 pt-2">
                <button onClick={() => update(bundle.id, { isActive: !bundle.isActive })} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${bundle.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {bundle.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => remove(bundle.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromotionsTab({ darkMode, t }: { darkMode: boolean, t: any }) {
  const { 
    promotionBanners, addPromotionBanner, updatePromotionBanner, deletePromotionBanner,
    deals, addDeal, updateDeal, deleteDeal,
    bundles, addBundle, updateBundle, deleteBundle,
    formatPrice
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'banners' | 'deals' | 'bundles'>('banners');

  return (
    <div className="space-y-8">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'banners', label: 'Banners', icon: ImageIcon },
          { id: 'deals', label: 'Deals', icon: Tag },
          { id: 'bundles', label: 'Bundles', icon: Package }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-none flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeSubTab === tab.id
                ? darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white'
                : darkMode ? 'bg-white/5 text-on-surface-variant/60' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'banners' && (
            <BannerManagement 
              banners={promotionBanners} 
              add={addPromotionBanner} 
              update={updatePromotionBanner} 
              remove={deletePromotionBanner}
              darkMode={darkMode}
            />
          )}
          {activeSubTab === 'deals' && (
            <DealManagement 
              deals={deals} 
              add={addDeal} 
              update={updateDeal} 
              remove={deleteDeal}
              darkMode={darkMode}
              formatPrice={formatPrice}
            />
          )}
          {activeSubTab === 'bundles' && (
            <BundleManagement 
              bundles={bundles} 
              add={addBundle} 
              update={updateBundle} 
              remove={deleteBundle}
              darkMode={darkMode}
              formatPrice={formatPrice}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AddProductForm({ addProduct, darkMode, t }: { addProduct: (p: any) => Promise<void>, darkMode: boolean, t: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Vegetables',
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1540340061722-9293d5163008?q=80&w=1000&auto=format&fit=crop'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    setLoading(true);
    try {
      // AI Translation
      const translations = await translateProductName(formData.name);
      
      await addProduct({
        ...formData,
        price: Number(formData.price),
        mmName: translations.mmName,
        thName: translations.thName,
        zhName: translations.zhName,
        msName: translations.msName,
        isPremium: false
      });
      
      setFormData({
        name: '',
        price: '',
        category: 'Vegetables',
        unit: '1 kg',
        image: 'https://images.unsplash.com/photo-1540340061722-9293d5163008?q=80&w=1000&auto=format&fit=crop'
      });
      alert("Product added successfully with AI translations!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `w-full pl-14 pr-6 py-5 rounded-2xl border font-bold transition-all outline-none text-sm ${
    darkMode 
      ? 'bg-white/5 border-white/10 focus:border-primary/50 text-on-surface' 
      : 'bg-gray-50 border-gray-100 focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 text-emerald-950'
  }`;

  const labelClasses = `text-[10px] font-black uppercase tracking-[0.2em] ml-4 mb-2 block ${
    darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'
  }`;

  const iconClasses = `absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${
    darkMode ? 'text-on-surface-variant/30' : 'text-gray-300'
  }`;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-1">
        <label className={labelClasses}>Product Name (English)</label>
        <div className="relative group">
          <Tag className={`${iconClasses} group-focus-within:text-primary`} size={20} />
          <input 
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Fresh Red Apple"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClasses}>Price</label>
        <div className="relative group">
          <DollarSign className={`${iconClasses} group-focus-within:text-primary`} size={20} />
          <input 
            type="number" 
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
            placeholder="0.00"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClasses}>Category</label>
        <div className="relative group">
          <LayoutDashboard className={`${iconClasses} group-focus-within:text-primary`} size={20} />
          <select 
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
            className={`${inputClasses} appearance-none`}
          >
            {CATEGORIES.filter(c => c.id !== 'all').map(category => (
              <option key={category.id} value={category.id}>{t(category.key)}</option>
            ))}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
            <ChevronRight size={16} className="rotate-90" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClasses}>Unit</label>
        <div className="relative group">
          <Hash className={`${iconClasses} group-focus-within:text-primary`} size={20} />
          <input 
            type="text" 
            value={formData.unit}
            onChange={e => setFormData({...formData, unit: e.target.value})}
            placeholder="e.g. 1 kg, 500g, 1 pack"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="md:col-span-2 space-y-1">
        <label className={labelClasses}>Image URL</label>
        <div className="relative group">
          <ImageIcon className={`${iconClasses} group-focus-within:text-primary`} size={20} />
          <input 
            type="url" 
            value={formData.image}
            onChange={e => setFormData({...formData, image: e.target.value})}
            placeholder="https://images.unsplash.com/..."
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="md:col-span-2 pt-6">
        <button 
          type="submit"
          disabled={loading}
          className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'
          } ${
            darkMode 
              ? 'bg-primary text-surface shadow-primary/20' 
              : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'
          }`}
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={20} />
          ) : (
            <Sparkles size={20} />
          )}
          {loading ? 'Translating & Adding...' : 'Add Product with AI Translation'}
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const { 
    orders, updateOrderStatus, 
    supportNumber, setSupportNumber,
    bankName, setBankName,
    bankAccountNumber, setBankAccountNumber,
    bankAccountName, setBankAccountName,
    currency, setCurrency, formatPrice,
    darkMode, t,
    products, addProduct, deleteProduct,
    isDeliveryEnabled, setIsDeliveryEnabled,
    cutoffTime, setCutoffTime,
    estimatedDeliveryTime, setEstimatedDeliveryTime,
    signInWithGoogle, authUid
  } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'market' | 'products' | 'promotions' | 'settings'>('orders');
  const [tempSupportNumber, setTempSupportNumber] = useState(supportNumber);
  const [tempCutoffTime, setTempCutoffTime] = useState(cutoffTime);
  const [tempEstimatedDeliveryTime, setTempEstimatedDeliveryTime] = useState(estimatedDeliveryTime);
  
  // Update temp state when context changes
  useEffect(() => {
    setTempCutoffTime(cutoffTime);
    setTempEstimatedDeliveryTime(estimatedDeliveryTime);
  }, [cutoffTime, estimatedDeliveryTime]);

  useEffect(() => {
    if (!authUid) {
      navigate('/admin-login');
    }
  }, [authUid, navigate]);

  const [tempBankDetails, setTempBankDetails] = useState({
    name: bankName,
    accNum: bankAccountNumber,
    accName: bankAccountName
  });

  const [isSeeding, setIsSeeding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!window.confirm('Are you sure you want to seed the database? This will add initial products.')) return;
    setIsSeeding(true);
    try {
      await seedDatabase();
      await seedSampleOrders();
      alert('Database seeded successfully!');
    } catch (error) {
      console.error('Seeding error:', error);
      alert('Error seeding database. Check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm('Are you sure you want to run the migration? This will update localized names for existing products.')) return;
    setIsMigrating(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      let count = 0;
      for (const productDoc of querySnapshot.docs) {
        const product = productDoc.data();
        if (!product.msName || !product.thName || !product.zhName) {
          const seedProduct = (PRODUCTS as any[]).find(p => p.name === product.name);
          if (seedProduct) {
            await updateDoc(doc(db, 'products', productDoc.id), {
              msName: seedProduct.msName,
              thName: seedProduct.thName,
              zhName: seedProduct.zhName
            });
            count++;
          }
        }
      }
      alert(`Migration completed! Updated ${count} products.`);
    } catch (error) {
      console.error('Migration error:', error);
      alert('Error running migration. Check console for details.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin-login');
  };

  // Market List Logic: Auto-Sum total weight/quantity of each product
  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const marketListByDate = useMemo(() => {
    const grouped: Record<string, Record<string, { id: string; name: string; total: number; unit: string }>> = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      if (!grouped[date]) grouped[date] = {};
      order.items.forEach(item => {
        if (!grouped[date][item.id]) {
          grouped[date][item.id] = { id: item.id, name: item.name, total: 0, unit: t('oneKg') };
        }
        grouped[date][item.id].total += item.quantity;
      });
    });
    return grouped;
  }, [orders, t]);

  React.useEffect(() => {
    const dates = Object.keys(marketListByDate);
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [marketListByDate, selectedDate]);

  const stats = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      packing: orders.filter(o => o.status === 'packing').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.reduce((acc, o) => acc + o.total, 0)
    };
  }, [orders]);

  return (
    <div className={`min-h-screen font-sans flex transition-all duration-500 ${darkMode ? 'bg-[#0c0e0e] text-on-surface' : 'bg-[#f8faf9]'}`}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isMenuOpen ? 280 : 0, opacity: isMenuOpen ? 1 : 0 }}
        className={`flex-shrink-0 overflow-hidden z-50 ${darkMode ? 'bg-[#0c0e0e] border-r border-white/5' : 'bg-white border-r border-gray-100'}`}
      >
        <div className="w-72 p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600/10 text-emerald-600'}`}>
              <ShoppingBag size={20} />
            </div>
            <h1 className={`text-lg font-black tracking-tighter ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>စားတော်ဆက်</h1>
          </div>

          <nav className="space-y-1 flex-grow">
            {[
              { id: 'orders', icon: LayoutDashboard, label: t('orders') },
              { id: 'market', icon: ListChecks, label: t('marketList') },
              { id: 'products', icon: Package, label: t('products') },
              { id: 'promotions', icon: Sparkles, label: 'Promotions' },
              { id: 'settings', icon: Settings, label: t('settings') }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  activeTab === item.id 
                    ? darkMode 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-emerald-50 text-emerald-700' 
                    : darkMode 
                      ? 'text-on-surface-variant/60 hover:bg-white/5' 
                      : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-100 dark:border-white/5">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${darkMode ? 'text-red-400/60 hover:bg-red-500/10' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <LogOut size={18} />
              {t('logout')}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto max-h-screen">
        {/* Header */}
        <header className={`sticky top-0 z-40 flex items-center justify-between px-8 py-5 border-b ${darkMode ? 'bg-[#0c0e0e]/80 backdrop-blur-md border-white/5' : 'bg-white/80 backdrop-blur-md border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
              <Menu size={20} />
            </button>
            <h2 className={`text-lg font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>
              {activeTab === 'orders' ? t('orderManagement') : 
               activeTab === 'market' ? t('marketList') : 
               activeTab === 'products' ? t('productManagement') : t('generalSettings')}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'orders' && (
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`} size={16} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`pl-10 pr-4 py-2 rounded-xl border text-xs font-bold outline-none ${darkMode ? 'bg-surface-container border-white/5 text-on-surface' : 'bg-gray-50 border-gray-100 text-emerald-950'}`}
                />
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700">
              {auth.currentUser?.email?.[0].toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">

        {/* Stats Grid - Premium Bento Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: t('pending'), value: stats.pending, color: 'emerald', icon: Clock },
            { label: t('packing'), value: stats.packing, color: 'blue', icon: Package },
            { label: t('delivered'), value: stats.delivered, color: 'indigo', icon: CheckCircle2 },
            { label: t('revenue'), value: formatPrice(stats.totalRevenue), color: 'emerald', icon: DollarSign }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`group p-8 rounded-[2.5rem] border transition-all duration-500 hover:scale-[1.02] relative overflow-hidden ${
                darkMode 
                  ? 'bg-surface-container-high/40 border-white/5 hover:border-primary/20' 
                  : 'bg-white border-gray-100 hover:border-emerald-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]'
              }`}
            >
              <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 ${darkMode ? 'text-white' : 'text-emerald-900'}`}>
                <stat.icon size={120} />
              </div>
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${
                  darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <stat.icon size={24} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>{stat.label}</p>
                <p className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('orderManagement')}</h2>
              <div className="grid grid-cols-1 gap-8">
                {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group rounded-[3rem] p-10 border transition-all duration-500 relative overflow-hidden ${
                      darkMode 
                        ? 'bg-surface-container-high/40 border-white/5 hover:border-primary/20' 
                        : 'bg-white border-gray-100 hover:border-emerald-200 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-10 relative z-10">
                      <div className="flex-grow space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-[1.5rem] transition-colors duration-500 ${darkMode ? 'bg-white/5' : 'bg-emerald-50 text-emerald-600'}`}>
                              <MapPin size={28} />
                            </div>
                            <div>
                              <h3 className={`text-2xl font-black tracking-tight mb-1 ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{t('room')}: {order.roomNumber}</h3>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                  order.status === 'packing' ? 'bg-blue-500/10 text-blue-500' :
                                  'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                  {t(order.status)}
                                </span>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>ID: {order.id.slice(-8)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-primary' : 'text-emerald-700'}`}>{formatPrice(order.total)}</p>
                            <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{new Date(order.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>

                        <div className={`h-px w-full ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>Customer Details</p>
                            <div className="space-y-1">
                              <p className={`font-bold ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{order.customerName}</p>
                              <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>{order.customerPhone}</p>
                              {order.address && <p className={`text-xs font-bold italic ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{order.address}</p>}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-400'}`}>Items ({order.items.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {order.items.map(item => (
                                <span key={item.id} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
                                  darkMode ? 'bg-white/5 text-on-surface-variant/60 border-white/5' : 'bg-gray-50 text-emerald-800 border-gray-100'
                                }`}>
                                  {item.name} <span className="opacity-40 mx-1">×</span> {item.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-3 min-w-[180px]">
                        {[
                          { id: 'pending', label: t('pending'), icon: Clock, activeClass: darkMode ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white' },
                          { id: 'packing', label: t('packing'), icon: Package, activeClass: 'bg-blue-500 text-white' },
                          { id: 'delivered', label: t('done'), icon: CheckCircle2, activeClass: darkMode ? 'bg-primary text-surface' : 'bg-emerald-800 text-white' }
                        ].map((btn) => (
                          <button 
                            key={btn.id}
                            onClick={() => updateOrderStatus(order.id, btn.id as any)}
                            className={`flex-grow flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                              order.status === btn.id 
                                ? `${btn.activeClass} shadow-xl scale-105` 
                                : darkMode ? 'bg-white/5 text-on-surface-variant/30 hover:bg-white/10' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            <btn.icon size={14} />
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className={`rounded-[3rem] p-24 text-center border border-dashed transition-all duration-500 ${darkMode ? 'bg-surface-container-high/20 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <ShoppingBag size={32} className="opacity-20" />
                    </div>
                    <p className={`text-lg font-bold ${darkMode ? 'text-on-surface-variant/30' : 'text-gray-400'}`}>{t('noOrdersYet')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'market' ? (
            <motion.div 
              key="market"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {selectedDate ? (
                // Detail View
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedDate(null)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{selectedDate}</h2>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`px-6 py-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('totalItems')}</p>
                        <p className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{Object.keys(marketListByDate[selectedDate]).length}</p>
                      </div>
                    </div>
                    <button className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}>
                      {t('printList')}
                    </button>
                  </div>

                  <div className={`rounded-[3rem] p-10 border overflow-hidden ${darkMode ? 'bg-surface-container-high/40 border-white/5' : 'bg-white border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]'}`}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">#</th>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('itemName')}</th>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('totalWeightQty')}</th>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.values(marketListByDate[selectedDate]) as { id: string; name: string; total: number; unit: string }[]).map((item, i) => (
                          <tr key={item.id} className={`border-b last:border-0 transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <td className={`py-6 px-4 text-sm font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>{i + 1}</td>
                            <td className={`py-6 px-4 font-bold ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{item.name}</td>
                            <td className={`py-6 px-4 font-black text-right ${darkMode ? 'text-primary' : 'text-emerald-700'}`}>{item.total} {item.unit}</td>
                            <td className="py-6 px-4 text-center">
                              <input type="checkbox" className={`w-5 h-5 rounded-lg border-2 ${darkMode ? 'border-white/20 checked:bg-primary' : 'border-gray-200 checked:bg-emerald-600'}`} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // Overview Page
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('marketList')}</h2>
                    <div className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ${darkMode ? 'bg-white/5 text-on-surface-variant/60' : 'bg-gray-50 text-gray-500'}`}>
                      {Object.keys(marketListByDate).length} {t('days')}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(marketListByDate).map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`group p-8 rounded-[2rem] border text-left transition-all hover:scale-[1.02] ${darkMode ? 'bg-white/5 border-white/5 hover:border-primary/20' : 'bg-white border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:border-emerald-200'}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`font-black text-xl ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{date}</h4>
                          <ChevronRight className={`transition-transform group-hover:translate-x-1 ${darkMode ? 'text-primary' : 'text-emerald-600'}`} size={20} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-primary' : 'text-emerald-600'}`}>
                          {Object.keys(marketListByDate[date]).length} {t('items')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'products' ? (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{t('productManagement')}</h2>
                  <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Add, edit or remove items from your catalog</p>
                </div>
              </div>

              {/* Add Product Form */}
              <div className={`rounded-[3rem] p-10 border transition-all duration-500 ${darkMode ? 'bg-surface-container-high/40 border-white/5' : 'bg-white border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]'}`}>
                <div className="flex items-center gap-5 mb-10">
                  <div className={`p-4 rounded-[1.5rem] ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Plus size={28} />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>Add New Product</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Expand your inventory</p>
                  </div>
                </div>

                <AddProductForm addProduct={addProduct} darkMode={darkMode} t={t} />
              </div>

              {/* Product List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h3 className={`text-xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{t('productList')}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{products.length} Items</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, i) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`group rounded-[2.5rem] p-6 border transition-all duration-500 hover:scale-[1.02] relative overflow-hidden ${
                        darkMode 
                          ? 'bg-surface-container-high/40 border-white/5 hover:border-primary/20' 
                          : 'bg-white border-gray-100 hover:border-emerald-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <div className="flex gap-6 items-center relative z-10">
                        <div className={`w-24 h-24 rounded-2xl overflow-hidden border transition-all duration-500 group-hover:scale-105 ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow space-y-1">
                          <h4 className={`font-black text-lg leading-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{product.name}</h4>
                          <p className={`text-xs font-bold ${darkMode ? 'text-primary' : 'text-emerald-600'}`}>{product.mmName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/5 text-on-surface-variant/60' : 'bg-gray-50 text-gray-500'}`}>
                              {product.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                              {product.unit}
                            </span>
                          </div>
                          <p className={`text-xl font-black tracking-tighter mt-2 ${darkMode ? 'text-primary' : 'text-emerald-700'}`}>{formatPrice(product.price)}</p>
                        </div>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Delete ${product.name}?`)) deleteProduct(product.id);
                          }}
                          className={`p-3 rounded-xl transition-all duration-300 ${darkMode ? 'text-red-400/40 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {product.isPremium && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Premium</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'promotions' ? (
            <motion.div 
              key="promotions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>Promotions Management</h2>
                  <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Manage banners, deals, and combo bundles</p>
                </div>
              </div>
              <PromotionsTab darkMode={darkMode} t={t} />
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{t('generalSettings')}</h2>
                  <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>System configuration and maintenance</p>
                </div>
              </div>

              <div className={`rounded-[3rem] p-12 border transition-all duration-500 ${darkMode ? 'bg-surface-container-high/40 border-white/5' : 'bg-white border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  {/* Left Column */}
                  <div className="space-y-12">
                    {/* Currency Settings */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Currency Settings</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Active currency for the application</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        {['RM', 'MMK'].map((curr) => (
                          <button
                            key={curr}
                            onClick={() => setCurrency(curr as any)}
                            className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 border ${
                              currency === curr
                                ? darkMode ? 'bg-primary text-surface border-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100 scale-[1.02]'
                                : darkMode ? 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {curr === 'RM' ? 'Malaysia (RM)' : 'Myanmar (MMK)'}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Delivery Service Settings */}
                    <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('deliveryService')}</h4>
                            <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('deliveryServiceDesc')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => authUid && setIsDeliveryEnabled(!isDeliveryEnabled)}
                          disabled={!authUid}
                          className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                            !authUid ? 'opacity-50 cursor-not-allowed bg-gray-300' :
                            isDeliveryEnabled ? 'bg-emerald-500' : (darkMode ? 'bg-white/10' : 'bg-gray-200')
                          }`}
                        >
                          <motion.div 
                            animate={{ x: isDeliveryEnabled ? 28 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-7 h-7 bg-white rounded-full shadow-xl" 
                          />
                        </button>
                      </div>

                      {/* Cutoff Time and Estimated Delivery Time Settings */}
                      {authUid && (
                        <div className="space-y-6 mb-8">
                          <div className="flex flex-col gap-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>
                              Order Cut-off Time
                            </label>
                            <div className="flex gap-3">
                              <input 
                                type="time"
                                value={tempCutoffTime}
                                onChange={(e) => setTempCutoffTime(e.target.value)}
                                className={`flex-grow border rounded-2xl px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'}`}
                              />
                              <button 
                                onClick={() => {
                                  setCutoffTime(tempCutoffTime);
                                  alert('Cut-off time updated successfully!');
                                }}
                                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}
                              >
                                <Save size={16} />
                                {t('save')}
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>
                              Estimated Delivery Time
                            </label>
                            <div className="flex gap-3">
                              <input 
                                type="text"
                                value={tempEstimatedDeliveryTime}
                                onChange={(e) => setTempEstimatedDeliveryTime(e.target.value)}
                                placeholder="e.g. 8:00 AM - 10:00 AM"
                                className={`flex-grow border rounded-2xl px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'}`}
                              />
                              <button 
                                onClick={() => {
                                  setEstimatedDeliveryTime(tempEstimatedDeliveryTime);
                                  alert('Estimated delivery time updated successfully!');
                                }}
                                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}
                              >
                                <Save size={16} />
                                {t('save')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!authUid ? (
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck size={18} className="text-amber-500" />
                            <h5 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-500' : 'text-amber-700'}`}>{t('authRequired')}</h5>
                          </div>
                          <p className={`text-[10px] font-bold mb-4 leading-relaxed ${darkMode ? 'text-on-surface-variant/60' : 'text-amber-600'}`}>
                            {t('authRequiredDesc')}
                          </p>
                          <button 
                            onClick={signInWithGoogle}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest text-gray-600"
                          >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" referrerPolicy="no-referrer" />
                            {t('signInWithGoogle')}
                          </button>
                        </div>
                      ) : (
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black ${darkMode ? 'bg-primary' : 'bg-emerald-600'}`}>
                              {auth.currentUser?.email?.[0].toUpperCase()}
                            </div>
                            <div>
                              <h5 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>{t('signedInAsAdmin')}</h5>
                              <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-emerald-600'}`}>{auth.currentUser?.email}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-12">
                    {/* Support Number */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Phone size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('whatsappSupportNumber')}</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('whatsappSupportNumberDesc')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="relative flex-grow">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className={`font-black text-sm ${darkMode ? 'text-on-surface-variant/30' : 'text-gray-400'}`}>+</span>
                          </div>
                          <input 
                            type="text"
                            value={tempSupportNumber}
                            onChange={(e) => setTempSupportNumber(e.target.value)}
                            className={`w-full border rounded-2xl pl-10 pr-6 py-5 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'}`}
                            placeholder="e.g. 601128096366"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            setSupportNumber(tempSupportNumber);
                            alert(t('supportNumberUpdated'));
                          }}
                          className={`px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}
                        >
                          <Save size={16} />
                          {t('save')}
                        </button>
                      </div>
                    </section>

                    {/* Bank Details */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('bankTransferSettings')}</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('bankTransferSettingsDesc')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: t('bankName'), value: tempBankDetails.name, key: 'name', placeholder: 'e.g. Maybank' },
                          { label: t('accountName'), value: tempBankDetails.accName, key: 'accName', placeholder: 'e.g. SAPHOSAUNG GROCERY' }
                        ].map((field) => (
                          <div key={field.key} className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-3 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{field.label}</label>
                            <input 
                              type="text"
                              value={field.value}
                              onChange={(e) => setTempBankDetails({ ...tempBankDetails, [field.key]: e.target.value })}
                              className={`w-full border rounded-2xl px-6 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50'}`}
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                        <div className="md:col-span-2 space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-3 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('accountNumber')}</label>
                          <input 
                            type="text"
                            value={tempBankDetails.accNum}
                            onChange={(e) => setTempBankDetails({ ...tempBankDetails, accNum: e.target.value })}
                            className={`w-full border rounded-2xl px-6 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50'}`}
                            placeholder="e.g. 1234 5678 9012"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setBankName(tempBankDetails.name);
                          setBankAccountNumber(tempBankDetails.accNum);
                          setBankAccountName(tempBankDetails.accName);
                          alert(t('bankDetailsUpdated'));
                        }}
                        className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'}`}
                      >
                        <Save size={16} />
                        {t('updateBankDetails')}
                      </button>
                    </section>

                    {/* Database Tools */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                          <Database size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Database Tools</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Maintenance and data management</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={handleSeed}
                          disabled={isSeeding}
                          className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                            isSeeding ? 'opacity-50 cursor-not-allowed' : ''
                          } ${darkMode ? 'bg-amber-600 text-white shadow-amber-900/20 hover:bg-amber-500' : 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'}`}
                        >
                          <Database size={16} className={isSeeding ? 'animate-bounce' : ''} />
                          {isSeeding ? 'Seeding...' : 'Seed Data'}
                        </button>
                        <button 
                          onClick={handleMigrate}
                          disabled={isMigrating}
                          className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                            isMigrating ? 'opacity-50 cursor-not-allowed' : ''
                          } ${darkMode ? 'bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-500' : 'bg-blue-500 text-white shadow-blue-100 hover:bg-blue-600'}`}
                        >
                          <RefreshCw size={16} className={isMigrating ? 'animate-spin' : ''} />
                          {isMigrating ? 'Migrating...' : 'Run Migration'}
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
