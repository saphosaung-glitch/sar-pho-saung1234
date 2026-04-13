import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Search, Menu as MenuIcon, Plus, Store, Receipt, User, Settings, X, Sliders, Camera, Heart, Bell, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRODUCTS } from '../lib/seed';
import { CATEGORIES } from '../constants';

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const { 
    setRoomNumber, addToCart, cartTotal, cart, roomNumber, clearCart,
    favorites, toggleFavorite, notifications, markNotificationAsRead, clearNotifications,
    t, darkMode, language, formatPrice, getMainName, getSecondaryName, products,
    promotionBanners, categories, deals, bundles
  } = useStore();
  const navigate = useNavigate();

  const activeBanners = useMemo(() => {
    return promotionBanners.filter(b => b.isActive);
  }, [promotionBanners]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const productGridRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    const handleScroll = () => {
      if (searchBoxRef.current) {
        const rect = searchBoxRef.current.getBoundingClientRect();
        // If the bottom of the search box is above the top of the viewport (or header)
        setShowHeaderSearch(rect.bottom < 72);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const room = searchParams.get('room');
    if (room) setRoomNumber(room);
  }, [searchParams, setRoomNumber]);

  const activeCategories = useMemo(() => {
    return categories.filter(c => c.isActive);
  }, [categories]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'deals') {
      return deals.filter(d => d.isActive).map(d => ({ ...d, isDeal: true }));
    }
    if (selectedCategory === 'bundles') {
      return bundles.filter(b => b.isActive).map(b => ({ ...b, isBundle: true }));
    }
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesCategory;
    });
  }, [selectedCategory, products, deals, bundles]);

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${darkMode ? 'bg-surface' : 'bg-surface'}`}>
      {/* Top Bar */}
      <header className={`fixed top-0 w-full z-50 px-4 flex flex-col justify-center border-b border-on-surface/5 transition-all duration-300 h-[72px] ${darkMode ? 'bg-surface/80 backdrop-blur-xl' : 'bg-surface/80 backdrop-blur-xl'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-3 max-w-[60%]">
            <div className={`flex-shrink-0 p-2 rounded-xl transition-colors ${darkMode ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <Store size={20} className="text-primary" />
            </div>
            <div className="flex flex-col min-w-0 py-1">
              <h1 className="text-lg font-black text-primary leading-tight tracking-tight">စားတော်ဆက်</h1>
              <span className={`text-[8px] font-black uppercase tracking-wider truncate transition-colors ${darkMode ? 'text-on-surface-variant/60' : 'text-on-surface-variant/60'}`}>
                Sar Taw Set {t('royalCaterer')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {showHeaderSearch && (
                <motion.button 
                  initial={{ x: 40, opacity: 0, scale: 0.5 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: 40, opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  onClick={() => navigate('/search')}
                  className={`p-2 rounded-full transition-colors z-0 ${darkMode ? 'text-on-surface-variant hover:bg-surface-container-high' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  <Search size={22} />
                </motion.button>
              )}
            </AnimatePresence>
            
            <button 
              onClick={() => navigate('/notifications')}
              className={`p-2 rounded-full transition-all active:scale-90 relative ${darkMode ? 'text-on-surface-variant hover:bg-surface-container-high' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
              )}
            </button>

            <button 
              onClick={() => navigate('/profile')}
              className={`p-2 rounded-full transition-all active:scale-90 ${darkMode ? 'text-on-surface-variant hover:bg-surface-container-high' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <User size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className={`transition-all duration-300 pt-[72px]`}>
        {/* Advertisement Carousel */}
        <AnimatePresence initial={false}>
          <motion.section 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="bg-transparent overflow-hidden"
          >
            <div className="flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 py-4 scroll-px-4">
              {/* Left Spacer to align with px-4 */}
              <div className="flex-none w-4" />
              
              {(() => {
                const placeholdersCount = Math.max(0, 3 - activeBanners.length);
                const totalItems = activeBanners.length + placeholdersCount;

                return (
                  <>
                    {activeBanners.map((banner, index) => (
                      <div 
                        key={banner.id}
                        className={`relative flex-none w-[300px] h-[150px] ${index === totalItems - 1 ? 'snap-end' : 'snap-start'} overflow-hidden rounded-[2rem] shadow-xl shadow-primary/5 transition-all`}
                      >
                        <img 
                          className="w-full h-full object-cover" 
                          src={banner.image} 
                          referrerPolicy="no-referrer"
                          alt={banner.title}
                        />
                      </div>
                    ))}
                    
                    {Array.from({ length: placeholdersCount }).map((_, i) => (
                      <div 
                        key={`placeholder-${i}`} 
                        className={`flex-none w-[280px] ${activeBanners.length + i === totalItems - 1 ? 'snap-end' : 'snap-start'} bg-gray-100 rounded-[2rem] p-5 flex flex-col justify-center min-h-[140px] shadow-sm`}
                      >
                        <p className="text-gray-500 text-sm font-bold text-center">No active promotions</p>
                      </div>
                    ))}
                  </>
                );
              })()}
              
              {/* Right Spacer to align with px-4 */}
              <div className="flex-none w-4" />
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Search Bar */}
        <div ref={searchBoxRef} className="px-4 -mt-2 cursor-pointer" onClick={() => navigate('/search')}>
          <div className={`relative pointer-events-none flex items-center rounded-2xl shadow-sm border border-on-surface/5 transition-all ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-lowest'}`}>
            <div className="pl-4 text-on-surface-variant/50">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              readOnly
              className="w-full bg-transparent py-3 pl-3 pr-4 text-sm font-medium outline-none text-on-surface"
            />
            <div className="flex items-center gap-2 pr-4 text-on-surface-variant/50">
              <Sliders size={18} />
              <div className="w-[1px] h-4 bg-on-surface-variant/20" />
              <Camera size={18} />
            </div>
          </div>
        </div>

        <section 
          className="sticky z-40 transition-all duration-300 h-7 flex items-center overflow-hidden mt-2"
          style={{ top: '72px' }}
        >
          <div className="flex overflow-x-auto overflow-y-hidden no-scrollbar gap-2 px-4 w-full items-center h-full">
            <button
              onClick={() => {
                setSelectedCategory('all');
                productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 shadow-sm flex items-center justify-center ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : `${darkMode ? 'bg-surface-container-high text-on-surface-variant' : 'bg-surface-container-lowest text-on-surface-variant'} border border-on-surface/5 hover:bg-surface-container-low`
              }`}
            >
              {t('all')}
            </button>
            {activeCategories.filter(c => c.id !== 'all').map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 shadow-sm flex items-center justify-center ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                    : `${darkMode ? 'bg-surface-container-high text-on-surface-variant' : 'bg-surface-container-lowest text-on-surface-variant'} border border-on-surface/5 hover:bg-surface-container-low`
                }`}
              >
                {t(cat.key)}
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section ref={productGridRef} className="mt-1 px-4 min-h-[70vh] scroll-mt-[104px]">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-base font-black text-on-surface tracking-tighter">
              {selectedCategory === 'deals' ? 'Daily Deals' : selectedCategory === 'bundles' ? 'Bundles' : t('dailyEssentials')}
            </h3>
            <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
              {filteredItems.length} {t('items')}
            </span>
          </div>
          
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredItems.map((item: any) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={item.id} 
                  className={`${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-lowest'} rounded-[1.5rem] overflow-hidden relative group shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col h-full`}
                >
                  {/* Image Section */}
                  <div className={`relative h-32 w-full overflow-hidden ${darkMode ? 'bg-surface-container-low' : 'bg-[#FDFBF7]'}`}>
                    {!item.isBundle && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className={`absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center transition-all duration-300 active:scale-90 ${
                          favorites.includes(item.id) 
                            ? 'text-rose-500 drop-shadow-sm' 
                            : 'text-on-surface-variant/40 hover:text-rose-500/60'
                        }`}
                      >
                        <Heart size={14} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                      </button>
                    )}
                    <img 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      src={item.image} 
                      alt={item.name || item.title}
                      referrerPolicy="no-referrer"
                    />
                    {item.isDeal && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">Deal</div>
                    )}
                    {item.isBundle && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">Bundle</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Content Section */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-col">
                        <h4 className="text-on-surface font-black text-xs leading-tight line-clamp-1 tracking-tight group-hover:text-primary transition-colors duration-300">
                          {item.name || item.title}
                        </h4>
                        <p className="text-on-surface-variant/60 text-[10px] font-medium leading-tight mt-0.5">
                          {item.mmName || item.titleMm}
                        </p>
                      </div>
                      <p className="text-on-surface-variant/40 text-[8px] font-bold uppercase tracking-[0.1em]">
                        {item.unit || 'Bundle'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {item.originalPrice && (
                          <span className="text-[8px] text-on-surface-variant/40 line-through font-bold">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                        <p className="text-primary font-black text-sm tracking-tighter">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => addToCart(item)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 active:scale-90 shadow-sm ${darkMode ? 'bg-surface-container-low text-primary hover:bg-primary hover:text-white' : 'bg-surface-container-low text-primary hover:bg-primary hover:text-white'}`}
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-6">
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-low'}`}>
                <Search size={32} className="text-on-surface-variant/20" />
              </div>
              <div className="space-y-2">
                <p className="text-on-surface font-black text-lg tracking-tight">{t('noItemsFound')}</p>
                <p className="text-on-surface-variant/60 text-xs font-medium">{t('trySearchingAgain')}</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Cart Summary Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 px-4 z-40"
          >
            <div className={`${darkMode ? 'bg-surface-container-high/90' : 'bg-surface-container-lowest/90'} backdrop-blur-2xl rounded-2xl p-3 flex items-center justify-between shadow-lg border border-primary/10`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-9 h-9 shrink-0 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                  <ShoppingCart className="text-white" size={16} />
                </div>
                <div className="flex flex-col overflow-hidden whitespace-nowrap">
                  <span className="text-on-surface-variant text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 truncate">{t('yourSelection')}</span>
                  <span className="text-on-surface text-sm font-black tracking-tighter truncate">
                    {cart.reduce((a,b) => a + b.quantity, 0)} {t('items')} | {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => clearCart()}
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all"
                  aria-label="Clear Cart"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="bg-primary shrink-0 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
                >
                  {t('checkout')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
