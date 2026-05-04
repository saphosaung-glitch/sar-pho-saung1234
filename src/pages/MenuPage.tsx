import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  ShoppingCart, Search, Menu as MenuIcon, Plus, Store, Receipt, User, Settings, X, 
  Sliders, Camera, Heart, Bell, Trash2, CheckCircle2, Sparkles, Zap, LayoutDashboard, 
  Snowflake, Coffee, Cookie, Utensils, Baby, Dog, Home, Briefcase, Pill, Smile,
  Fish, Beef, Carrot, Egg, Soup, Wheat, UtensilsCrossed, Flame, Wine, Candy, MessageCircle,
  QrCode, Share2
} from 'lucide-react';

import { AddToCartButton } from '../components/AddToCartButton';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRODUCTS } from '../lib/seed';
import { CATEGORIES } from '../constants';
import { QRCodeModal } from '../components/ui/QRCodeModal';

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const { 
    setRoomNumber, addToCart, cartTotal, cart, roomNumber, clearCart,
    favorites, toggleFavorite, notifications, markNotificationAsRead, clearNotifications,
    t, darkMode, language, formatPrice, getMainName, getSecondaryName, getCategoryName, products,
    promotionBanners, categories, deals, bundles, settings
  } = useStore();
  const navigate = useNavigate();

  const activeBanners = useMemo(() => {
    return [...promotionBanners]
      .filter(b => b.isActive)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [promotionBanners]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [qrItem, setQrItem] = useState<{ id: string; name: string } | null>(null);
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

  const activeBundles = useMemo(() => bundles.filter(b => b.isActive), [bundles]);
  const activeDeals = useMemo(() => deals.filter(d => d.isActive), [deals]);

  const activeCategoryData = useMemo(() => {
    return categories.find(c => c.key === selectedCategory);
  }, [categories, selectedCategory]);

  const handleCategorySupport = () => {
    if (activeCategoryData?.supportPhone) {
      const message = encodeURIComponent(`Hi, I need help with ${activeCategoryData.nameEn} category.`);
      window.open(`https://wa.me/${activeCategoryData.supportPhone}?text=${message}`, '_blank');
    }
  };

  const getCategoryIcon = (key: string) => {
    const iconSize = 12;
    switch (key) {
      case 'all': return <LayoutDashboard size={iconSize} />;
      case 'deals': return <Zap size={iconSize} className="fill-orange-500 text-orange-500" />;
      case 'bundles': return <Sparkles size={iconSize} className="text-cyan-500" />;
      
      // Core food categories
      case 'meat': 
      case 'poultry':
      case 'meat-poultry': return <Beef size={iconSize} />;
      case 'seafood': 
      case 'fish': return <Fish size={iconSize} />;
      case 'vegetables': 
      case 'fresh-produce': 
      case 'fruits': return <Carrot size={iconSize} />;
      case 'dairy':
      case 'eggs':
      case 'dairy-eggs':
      case 'dairyAndEggs': return <Egg size={iconSize} />;
      case 'ready-to-eat':
      case 'readyToEat': 
      case 'prepared-meals': return <Soup size={iconSize} />;
      case 'dry-goods':
      case 'pantry':
      case 'dryGoods': return <Wheat size={iconSize} />;
      case 'kitchen': 
      case 'home-essentials': return <UtensilsCrossed size={iconSize} />;
      case 'spices': 
      case 'seasonings': return <Flame size={iconSize} className="text-orange-600" />;
      case 'beverages': 
      case 'drinks': return <Wine size={iconSize} />;
      case 'snacks': 
      case 'confectionery': return <Candy size={iconSize} />;
      
      // Legacy/Misc categories
      case 'frozen-foods': return <Snowflake size={iconSize} />;
      case 'baby-care': return <Baby size={iconSize} />;
      case 'pet-care': return <Dog size={iconSize} />;
      case 'household': return <Home size={iconSize} />;
      case 'personal-care': return <Smile size={iconSize} />;
      case 'health-wellness': return <Pill size={iconSize} />;
      case 'office-supplies': return <Briefcase size={iconSize} />;
      
      default: return <Store size={iconSize} />;
    }
  };

  const categoriesWithSpecials = useMemo(() => {
    // Start with the 'all' category if it exists, otherwise create it
    const allCat = categories.find(c => c.id === 'all') || { id: 'all', key: 'all', name: 'All Items', isActive: true };
    
    const list = [allCat];
    
    // Add Deals if any are active AND the category itself is active
    const dealsCat = categories.find(c => c.key === 'deals' || c.id === 'deals');
    if (activeDeals.length > 0 && (!dealsCat || dealsCat.isActive !== false)) {
      list.push({ id: 'deals', name: 'Flash Deals', nameMm: 'အထူးဈေး', key: 'deals', isActive: true, translationKey: 'deals' });
    }
    
    // Add Bundles if any are active AND the category itself is active
    const bundlesCat = categories.find(c => c.key === 'bundles' || c.id === 'bundles');
    if (activeBundles.length > 0 && (!bundlesCat || bundlesCat.isActive !== false)) {
      list.push({ id: 'bundles', name: 'Combo Bundles', nameMm: 'တွဲဖက်', key: 'bundles', isActive: true, translationKey: 'bundles' });
    }

    // Add remaining active categories (filtered to avoid duplicates)
    const others = categories.filter(c => 
      c.isActive !== false && 
      c.id !== 'all' && 
      c.id !== 'deals' && 
      c.id !== 'bundles'
    ).sort((a, b) => (a.order || 0) - (b.order || 0));

    return [...list, ...others];
  }, [categories, activeDeals, activeBundles]);

  const filteredItems = useMemo(() => {
    // Get IDs of active categories for filtering products in 'all' view
    const activeCategoryIds = new Set(categoriesWithSpecials.map(c => c.id));

    if (selectedCategory === 'deals') {
      return activeDeals.map(d => ({ ...d, isDeal: true }));
    }
    if (selectedCategory === 'bundles') {
      return activeBundles.map(b => ({ ...b, isBundle: true }));
    }
    
    return products.filter(product => {
      // 1. Must match selected category (or be 'all')
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      if (!matchesCategory) return false;

      return true;
    });
  }, [selectedCategory, products, activeDeals, activeBundles, categoriesWithSpecials]);

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${darkMode ? 'bg-surface' : 'bg-surface'}`}>
      {/* Top Bar */}
      <header className={`fixed top-0 w-full z-50 px-4 flex flex-col justify-center border-b border-on-surface/5 transition-all duration-300 h-[72px] ${darkMode ? 'bg-surface/80 backdrop-blur-xl' : 'bg-surface/80 backdrop-blur-xl'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-3 max-w-[60%]">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden transition-all shadow-sm ${darkMode ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <img 
                src="https://scontent.fkul7-2.fna.fbcdn.net/v/t39.30808-6/684505557_122097016515302120_6150026231108406984_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=65onKQ3wqrwQ7kNvwH-5Tn-&_nc_oc=AdoS-wVrlfKZ1ez9KNNdnG2zrOlHcnj7uHcGjRb3mW6fp1oguy8-8wQ1-pXhxzE26ke-vq-3N92HeuXbHTYkvevu&_nc_zt=23&_nc_ht=scontent.fkul7-2.fna&_nc_gid=lCsMSE2No98znYrLT3N7sg&_nc_ss=7b2a8&oh=00_Af4X8z6JL4VX10-1XWuFqPcF1kQfsivurJR7gMP3HKIQ7Q&oe=69FC4851" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
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
                        {banner.title && (
                          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <h3 className="text-white text-xs font-black uppercase tracking-widest drop-shadow-lg">
                              {banner.title}
                            </h3>
                          </div>
                        )}
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
          <div className={`relative pointer-events-none flex items-center rounded-full shadow-sm border border-on-surface/5 transition-all ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-lowest'}`}>
            <div className="pl-5 text-on-surface-variant/50">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              readOnly
              className="w-full bg-transparent py-2.5 pl-3 pr-4 text-xs font-medium outline-none text-on-surface"
            />
            <div className="flex items-center gap-2 pr-5 text-on-surface-variant/50">
              <Sliders size={16} />
              <div className="w-[1px] h-3 bg-on-surface-variant/20" />
              <Camera size={16} />
            </div>
          </div>
        </div>

        <section 
          className="sticky z-40 transition-all duration-300 h-9 flex items-center overflow-hidden mt-2"
          style={{ top: '72px' }}
        >
          <div className="flex overflow-x-auto overflow-y-hidden no-scrollbar gap-1.5 px-4 w-full items-center h-full">
            {categoriesWithSpecials.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex-none px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 shadow-sm flex items-center gap-1.5 border ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : `${darkMode ? 'bg-surface-container-high text-on-surface-variant' : 'bg-white text-on-surface-variant'} border-on-surface/5 hover:bg-on-surface/5`
                }`}
              >
                <span className={selectedCategory === cat.id ? 'scale-110' : 'opacity-60'}>
                  {getCategoryIcon(cat.key || cat.id)}
                </span>
                {getCategoryName(cat.id)}
              </button>
            ))}
          </div>
        </section>

        {/* Support Banner for Categories */}
        <AnimatePresence>
          {activeCategoryData?.supportPhone && selectedCategory !== 'all' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 mb-4"
            >
              <div 
                className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
                  darkMode ? 'bg-primary/10 border-primary/20' : 'bg-emerald-50 border-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${darkMode ? 'text-primary' : 'text-emerald-700'}`}>
                      {language === 'en' ? 'Category Expert' : 'ကဏ္ဍအလိုက် အကူအညီ'}
                    </p>
                    <p className={`text-[9px] font-bold opacity-60 ${darkMode ? 'text-on-surface' : 'text-slate-600'}`}>
                      {language === 'en' ? `Need help with ${activeCategoryData.nameEn}?` : `${activeCategoryData.nameMm} အတွက် အကူအညီလိုပါသလား?`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleCategorySupport}
                  className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  {language === 'en' ? 'Chat Now' : 'ပြောဆိုမည်'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <section ref={productGridRef} className="mt-1 px-4 min-h-[70vh] scroll-mt-[112px]">
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
                      className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${item.isAvailable === false ? 'opacity-50' : ''}`} 
                      src={item.image} 
                      alt={item.name || item.title}
                      referrerPolicy="no-referrer"
                    />
                    {item.isAvailable === false && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="bg-black/70 px-3 py-1 rounded-lg">
                          <span className="text-white font-black text-[10px] uppercase tracking-widest">Sold Out</span>
                        </div>
                      </div>
                    )}
                    {item.isDeal && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">Deal</div>
                    )}
                    {item.isBundle && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">Bundle</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Content Section */}
                  <div className="p-2 flex flex-col flex-1 justify-between gap-1">
                    <div className="space-y-1">
                      <div className="flex flex-col">
                        <h4 className="text-on-surface font-black text-xs leading-tight tracking-tight group-hover:text-primary transition-colors duration-300 truncate">
                          {getMainName(item)}
                        </h4>
                        <p className="text-on-surface-variant/60 text-[10px] font-medium leading-tight truncate mt-0.5">
                          {getSecondaryName(item)}
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
                      
                      <AddToCartButton 
                        onClick={() => addToCart(item)}
                        darkMode={darkMode}
                        disabled={item.isAvailable === false}
                      />
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
            className="fixed bottom-6 left-0 right-0 px-4 z-40"
          >
            <div className={`${darkMode ? 'bg-surface-container-high/90' : 'bg-surface-container-lowest/90'} backdrop-blur-2xl rounded-2xl p-2.5 flex items-center justify-between shadow-lg border border-primary/10`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 shrink-0 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                  <ShoppingCart className="text-white" size={14} />
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
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all"
                  aria-label="Clear Cart"
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="bg-primary shrink-0 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
                >
                  {t('checkout')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QRCodeModal 
        isOpen={!!qrItem} 
        onClose={() => setQrItem(null)} 
        url={`${settings.productionUrl}/#/search?q=${qrItem ? encodeURIComponent(qrItem.name) : ''}`}
        title={qrItem?.name || 'Product'}
        subtitle="Item QR Code"
        darkMode={darkMode}
      />
    </div>
  );
}
