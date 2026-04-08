import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingCart, Clock, Flame, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function DealsPage() {
  const navigate = useNavigate();
  const { type } = useParams();
  const { darkMode, language, formatPrice, addToCart, cart, deals, bundles } = useStore();

  const filteredDeals = deals.filter(d => d.isActive && (!type || d.type === type));
  const filteredBundles = bundles.filter(b => b.isActive && (!type || b.type === type));

  const getPageTitle = () => {
    if (type === 'daily-deal') return language === 'mm' ? 'နေ့စဉ် အထူးဈေး' : 'Daily Deals';
    if (type === 'bundle') return language === 'mm' ? 'အစုံလိုက် ထုတ်ပိုးမှုများ' : 'Combo Bundles';
    if (type === 'flash-sale') return language === 'mm' ? 'အထူး လျှော့ဈေး' : 'Flash Sales';
    return language === 'mm' ? 'ယနေ့ အထူးပရိုမိုရှင်းများ' : 'Daily Deals & Bundles';
  };

  const handleAddToCart = (item: any) => {
    const product = {
      id: item.id,
      nameEn: item.title,
      nameMm: item.titleMm,
      price: item.price,
      image: item.image,
      category: item.type,
      unit: 'set'
    };
    addToCart(product);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-on-surface' : 'bg-gray-50 text-on-surface'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 px-6 py-5 flex items-center justify-between ${darkMode ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-md border-b ${darkMode ? 'border-on-surface/10' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${darkMode ? 'hover:bg-surface-container-high' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight">{getPageTitle()}</h1>
        </div>
        <button 
          onClick={() => navigate('/checkout')}
          className={`relative p-2.5 rounded-full transition-all active:scale-90 ${darkMode ? 'hover:bg-surface-container-high' : 'hover:bg-gray-100'}`}
        >
          <ShoppingCart size={22} />
          {cart.length > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center rounded-full shadow-sm">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      <main className="p-6 space-y-10">
        {/* Daily Deals Section */}
        {filteredDeals.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <Flame className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{language === 'mm' ? 'ယနေ့ အထူးလျှော့ဈေး' : 'Flash Deals'}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDeals.map((deal) => (
                <motion.div 
                  key={deal.id}
                  onClick={() => navigate(`/deals/${deal.id}`)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group flex gap-5 p-4 rounded-3xl border ${darkMode ? 'bg-surface-container-low border-on-surface/10' : 'bg-white border-gray-100'} shadow-lg shadow-gray-200/50 dark:shadow-none cursor-pointer active:scale-[0.98] transition-all hover:border-primary/30`}
                >
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                      {deal.discount} OFF
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div>
                      <h3 className="font-bold text-base leading-snug line-clamp-2">{language === 'mm' ? deal.titleMm : deal.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xl font-black text-red-600">{formatPrice(deal.price)}</span>
                        <span className="text-sm text-gray-400 line-through">{formatPrice(deal.originalPrice)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> Ends soon</span>
                        <span>{deal.soldCount}/{deal.totalCount} Sold</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${(deal.soldCount / deal.totalCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Bundles Section */}
        {filteredBundles.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <Package className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{language === 'mm' ? 'အစုံလိုက်ထုတ်ပိုးမှုများ' : 'Combo Bundles'}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBundles.map((bundle) => (
                <motion.div 
                  key={bundle.id}
                  onClick={() => navigate(`/deals/${bundle.id}`)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-surface-container-low border-on-surface/10' : 'bg-white border-gray-100'} shadow-lg shadow-gray-200/50 dark:shadow-none cursor-pointer active:scale-[0.98] transition-all hover:border-primary/30`}
                >
                  <div className="relative h-48 w-full">
                    <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 right-4 bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      Save {formatPrice(bundle.originalPrice - bundle.price)}
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg">{language === 'mm' ? bundle.titleMm : bundle.title}</h3>
                      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{language === 'mm' ? bundle.descriptionMm : bundle.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-2xl font-black text-orange-600">{formatPrice(bundle.price)}</span>
                        <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(bundle.originalPrice)}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(bundle); }}
                        className="px-6 py-3 bg-orange-600 text-white text-sm font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-orange-600/20"
                      >
                        {language === 'mm' ? 'ဝယ်ယူမည်' : 'Add'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
