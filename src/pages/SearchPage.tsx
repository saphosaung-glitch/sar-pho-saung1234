import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft, Plus, SlidersHorizontal, Camera, Clock, TrendingUp, Check, ScanLine, ShoppingCart, Heart, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const POPULAR_SEARCHES = ['Fresh Milk', 'Organic Eggs', 'Salmon', 'Avocado', 'Bread'];
const CATEGORIES = [
  { id: 'all', key: 'all' },
  { id: 'seafood', key: 'seafood' },
  { id: 'meat', key: 'meat' },
  { id: 'vegetables', key: 'vegetables' },
  { id: 'kitchen', key: 'kitchen' }
];

const SORT_OPTIONS = [
  { id: 'relevance', key: 'relevance' },
  { id: 'price_asc', key: 'priceLowToHigh' },
  { id: 'price_desc', key: 'priceHighToLow' },
  { id: 'name_asc', key: 'nameAToZ' }
];

export default function SearchPage() {
  const navigate = useNavigate();
  const { addToCart, cart, cartTotal, clearCart, favorites, toggleFavorite, t, darkMode, formatPrice, getMainName, getSecondaryName, products } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  
  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(t('positionBarcode'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !recentSearches.includes(query.trim())) {
      const updated = [query.trim(), ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const removeRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(q => q !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSortBy('relevance');
  };

  const handleCameraClick = () => {
    // Open the native file picker with camera capture option
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data:image/jpeg;base64, part
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShowScanner(true);
      setIsScanning(true);
      setScanStatus(t('analyzingProduct'));
      
      try {
        const base64Data = await fileToBase64(file);
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.warn("GEMINI_API_KEY is not set. Image scanning will be disabled.");
          setScanStatus(t('error'));
          setIsScanning(false);
          setShowScanner(false);
          return;
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          config: {
            maxOutputTokens: 100,
          },
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              },
              {
                text: "Identify the main grocery or food product in this image. Return ONLY the name of the product in a few words, suitable for a search query. Do not include any other text.",
              },
            ],
          },
        });

        const resultText = response.text?.trim();
        
        if (resultText) {
          setScanStatus(`${t('found')}: ${resultText}`);
          setIsScanning(false);
          
          setTimeout(() => {
            setShowScanner(false);
            handleSearch(resultText);
          }, 1500);
        } else {
          throw new Error("No text returned from AI");
        }

      } catch (error) {
        console.error("Error analyzing image:", error);
        setScanStatus("Failed to recognize product. Please try again.");
        setIsScanning(false);
        
        setTimeout(() => {
          setShowScanner(false);
        }, 2000);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Apply Search, Filter, and Sort
  let filteredProducts = searchQuery.trim() === '' 
    ? [] 
    : products.filter(product => 
        getMainName(product).toLowerCase().includes(searchQuery.toLowerCase()) || 
        getSecondaryName(product).toLowerCase().includes(searchQuery.toLowerCase())
      );

  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  if (sortBy === 'price_asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name_asc') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className={`min-h-screen pb-4 ${darkMode ? 'bg-surface text-on-surface' : 'bg-surface text-on-surface'}`}>
      {/* Hidden File Input for Camera */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        onChange={handleImageCapture}
        className="hidden" 
      />

      <div className={`sticky top-0 backdrop-blur-sm z-40 px-4 h-[72px] flex items-center border-b border-on-surface/5 ${darkMode ? 'bg-surface/95' : 'bg-surface/95'}`}>
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={() => navigate(-1)} 
            className={`flex-none w-10 h-10 border border-on-surface/5 shadow-sm rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}
          >
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <div className={`flex-1 border border-on-surface/5 rounded-full flex items-center px-4 py-2.5 ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-low'}`}>
            <Search size={20} className="text-on-surface-variant/50 mr-3" />
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50"
              autoFocus
            />
            <div className="flex items-center gap-3 ml-2">
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="text-on-surface-variant/50 hover:text-on-surface">
                  <X size={20} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleCameraClick}
                    className="text-on-surface-variant/50 hover:text-on-surface transition-colors"
                  >
                    <Camera size={18} />
                  </button>
                  <div className="w-[1px] h-4 bg-on-surface-variant/20"></div>
                  <button 
                    onClick={() => setShowFilters(true)}
                    className="text-on-surface-variant/50 hover:text-on-surface transition-colors relative"
                  >
                    <SlidersHorizontal size={18} />
                    {(selectedCategory !== 'all' || sortBy !== 'relevance') && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Quick Links (Only show when typing) */}
      {searchQuery.trim() !== '' && (
        <div className={`sticky top-[72px] z-30 backdrop-blur-sm border-b border-on-surface/5 py-2 ${darkMode ? 'bg-surface/95' : 'bg-surface/95'}`}>
          <div className="flex overflow-x-auto no-scrollbar gap-2 px-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : `${darkMode ? 'bg-surface-container-high' : 'bg-white'} text-on-surface-variant border border-on-surface/5 hover:bg-surface-container-low`
                }`}
              >
                {t(cat.key)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        {loading ? (
          <div className="text-center py-20 text-on-surface-variant font-black text-sm uppercase tracking-widest animate-pulse">{t('loading')}</div>
        ) : searchQuery.trim() === '' ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 mt-2"
          >
            {recentSearches.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-sm text-on-surface">{t('recentSearches')}</h3>
                  <button 
                    onClick={clearAllRecent} 
                    className="text-[10px] text-primary font-bold uppercase tracking-widest hover:bg-primary/10 px-2 py-1 rounded-md transition-colors"
                  >
                    {t('clearAll')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(q => (
                    <button 
                      key={q} 
                      onClick={() => handleSearch(q)} 
                      className={`flex items-center gap-1.5 border border-on-surface/5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-shadow text-on-surface ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}
                    >
                      <Clock size={12} className="text-on-surface-variant/50" />
                      {q}
                      <X 
                        size={14} 
                        className="ml-1 text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-low rounded-full p-0.5 transition-colors" 
                        onClick={(e) => removeRecentSearch(q, e)} 
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-on-surface">
                <TrendingUp size={16} className="text-primary" /> 
                {t('popularSearches')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map(q => (
                  <button 
                    key={q} 
                    onClick={() => handleSearch(q)} 
                    className={`${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-low'} px-4 py-2 rounded-full text-xs font-medium text-on-surface-variant hover:bg-primary hover:text-white transition-colors shadow-sm`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={product.id} 
                className={`${darkMode ? 'bg-surface-container-high' : 'bg-white'} rounded-[1.5rem] overflow-hidden relative group shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col h-full`}
              >
                {/* Image Section - Reduced height for compact look */}
                <div className="relative h-32 w-full overflow-hidden bg-[#FDFBF7]">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className={`absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center transition-all duration-300 active:scale-90 ${
                      favorites.includes(product.id) 
                        ? 'text-rose-500 drop-shadow-sm' 
                        : 'text-on-surface-variant/40 hover:text-rose-500/60'
                    }`}
                  >
                    <Heart size={14} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                  <img 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    src={product.image} 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content Section - Compact and single-line price */}
                <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-col">
                      <h4 className="text-on-surface font-black text-xs leading-tight line-clamp-1 tracking-tight group-hover:text-primary transition-colors duration-300">
                        {getMainName(product)}
                      </h4>
                      <p className="text-on-surface-variant/60 text-[10px] font-medium leading-tight mt-0.5">
                        {getSecondaryName(product)}
                      </p>
                    </div>
                    <p className="text-on-surface-variant/40 text-[8px] font-bold uppercase tracking-[0.1em]">
                      {product.unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-primary font-black text-sm tracking-tighter">
                      {formatPrice(product.price)}
                    </p>
                    
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-8 h-8 bg-surface-container-low hover:bg-primary hover:text-white text-primary rounded-xl flex items-center justify-center transition-all duration-500 active:scale-90 shadow-sm"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-on-surface-variant">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-on-surface">{t('noItemsFound')}</p>
            <p className="text-xs mt-1">{t('trySearchingAgain')}</p>
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[2rem] z-50 p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-on-surface">{t('filterAndSort')}</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 bg-surface-container-low rounded-full hover:bg-on-surface/5">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sort By */}
                <section>
                  <h3 className="text-sm font-black text-on-surface mb-3 uppercase tracking-widest">{t('sortBy')}</h3>
                  <div className="space-y-2">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors"
                      >
                        <span className={`text-sm font-medium ${sortBy === option.id ? 'text-primary' : 'text-on-surface'}`}>
                          {t(option.key)}
                        </span>
                        {sortBy === option.id && <Check size={18} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Categories */}
                <section>
                  <h3 className="text-sm font-black text-on-surface mb-3 uppercase tracking-widest">{t('category')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : `${darkMode ? 'bg-surface-container-high' : 'bg-white'} border border-on-surface/5 text-on-surface-variant hover:bg-surface-container-low`
                        }`}
                      >
                        {t(cat.key)}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={resetFilters}
                  className="flex-1 py-4 rounded-2xl font-black text-sm bg-surface-container-low text-on-surface hover:bg-on-surface/5 transition-colors"
                >
                  {t('reset')}
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-[2] py-4 rounded-2xl font-black text-sm bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  {t('applyFilters')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Scanner UI Overlay */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <button 
                onClick={() => { setShowScanner(false); setIsScanning(false); }}
                className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
              <span className="text-white font-black tracking-widest uppercase text-sm">{t('productScanner')}</span>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Scanner Frame */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>

              {/* Scanning Animation */}
              {isScanning && (
                <>
                  <motion.div 
                    animate={{ y: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.8)] z-10"
                  />
                  <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-xl"></div>
                </>
              )}

              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine size={48} className="text-white/30" />
              </div>
            </div>

            {/* Status Text */}
            <div className="absolute bottom-24 left-0 right-0 text-center px-6">
              <p className="text-white/80 text-sm font-medium">
                {scanStatus === "Analyzing product image with AI..." ? t('analyzingProduct') : scanStatus.startsWith('Found:') ? `${t('found')}: ${scanStatus.split(': ')[1]}` : scanStatus === "Failed to recognize product. Please try again." ? t('failedToRecognize') : scanStatus}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Summary Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 px-4 z-40"
          >
            <div className={`${darkMode ? 'bg-surface-container-high/90' : 'bg-white/90'} backdrop-blur-2xl rounded-2xl p-3 flex items-center justify-between shadow-lg border border-primary/10`}>
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
