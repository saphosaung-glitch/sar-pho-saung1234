import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Heart, Plus, ShoppingCart, Search, Trash2 } from 'lucide-react';
import { AddToCartButton } from '../components/AddToCartButton';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function FavoritesPage() {
  const { favorites, toggleFavorite, addToCart, cart, cartTotal, clearCart, t, darkMode, formatPrice, getMainName, getSecondaryName } = useStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    }, (error) => {
      console.error("Error fetching products:", error);
    });
    return () => unsubscribe();
  }, []);

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${darkMode ? 'bg-surface' : 'bg-surface'}`}>
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl px-4 h-[72px] flex items-center justify-between border-b transition-colors duration-300 ${darkMode ? 'bg-surface/80 border-on-surface/5' : 'bg-surface/80 border-on-surface/5'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 text-on-surface-variant ${darkMode ? 'bg-surface-container-high hover:bg-surface-container-highest' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-black text-on-surface tracking-tight">{t('myFavorites')}</h2>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto">
        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {favoriteProducts.map(product => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={product.id} 
                className={`rounded-[1.5rem] overflow-hidden relative shadow-sm flex flex-col h-full ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-lowest'}`}
              >
                <button 
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center transition-all duration-300 active:scale-90 text-rose-500 drop-shadow-sm"
                >
                  <Heart size={14} fill="currentColor" />
                </button>

                <div className={`h-32 w-full ${darkMode ? 'bg-surface-container-low' : 'bg-[#FDFBF7]'}`}>
                  <img className="w-full h-full object-cover" src={product.image} alt={product.name} referrerPolicy="no-referrer" />
                </div>

                <div className="p-2 flex flex-col flex-1 justify-between gap-1">
                  <div className="space-y-1">
                    <h4 className="text-on-surface font-black text-xs leading-tight line-clamp-1 tracking-tight">{getMainName(product)}</h4>
                    <p className="text-on-surface-variant/60 text-[10px] font-medium leading-tight">{getSecondaryName(product)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-primary font-black text-sm tracking-tighter">{formatPrice(product.price)}</p>
                    <AddToCartButton 
                      onClick={() => addToCart(product)}
                      darkMode={darkMode}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-lowest'}`}>
              <Heart size={32} className="text-rose-200" />
            </div>
            <div className="space-y-2">
              <p className="text-on-surface font-black text-lg tracking-tight">{t('noFavoritesYet')}</p>
              <p className="text-on-surface-variant/60 text-xs font-medium">{t('noFavoritesDescription')}</p>
              <button 
                onClick={() => navigate('/menu')}
                className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                {t('exploreMenu')}
              </button>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 px-4 z-40"
          >
            <div className={`backdrop-blur-2xl rounded-2xl p-2.5 flex items-center justify-between shadow-lg border border-primary/10 ${darkMode ? 'bg-surface-container-high/90' : 'bg-surface-container-lowest/90'}`}>
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
    </div>
  );
}
