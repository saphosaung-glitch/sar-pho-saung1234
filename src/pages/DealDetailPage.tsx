import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Clock, Flame, Package, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode, language, formatPrice, addToCart, cart, deals, bundles } = useStore();

  const item = deals.find(d => d.id === id) || bundles.find(b => b.id === id);

  if (!item) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black text-white' : 'bg-surface text-black'}`}>
        <p>Item not found</p>
        <button onClick={() => navigate(-1)} className="ml-4 text-primary">Go Back</button>
      </div>
    );
  }

  const handleAddToCart = () => {
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

  const isDeal = item.type === 'deal';

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-black text-on-surface' : 'bg-surface text-on-surface'}`}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-4 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <button 
          onClick={() => navigate('/checkout')}
          className="relative p-2 rounded-full bg-white/20 backdrop-blur-md text-white transition-all active:scale-90"
        >
          <ShoppingCart size={20} />
          {cart.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-on-primary-fixed text-[10px] font-bold flex items-center justify-center rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Hero Image */}
      <div className="relative w-full h-[40vh]">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isDeal ? 'bg-red-500' : 'bg-orange-500'}`}>
              {isDeal ? 'Flash Sale' : 'Combo Bundle'}
            </span>
            {isDeal && (item as any).discount && (
              <span className="bg-white text-red-500 px-2 py-1 rounded-md text-[10px] font-bold">
                {(item as any).discount} OFF
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-tight">{language === 'mm' ? item.titleMm : item.title}</h1>
        </div>
      </div>

      {/* Content */}
      <main className="p-4 space-y-6">
        {/* Price Section */}
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-surface-container-low border-on-surface/10' : 'bg-white border-on-surface/5'} shadow-sm`}>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs text-on-surface-variant mb-1">Special Price</p>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${isDeal ? 'text-red-500' : 'text-orange-500'}`}>
                  {formatPrice(item.price)}
                </span>
                <span className="text-sm text-on-surface-variant line-through">
                  {formatPrice(item.originalPrice)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant mb-1">You Save</p>
              <span className="text-sm font-bold text-green-500">
                {formatPrice(item.originalPrice - item.price)}
              </span>
            </div>
          </div>

          {isDeal && (
            <div className="mt-4 pt-4 border-t border-on-surface/10">
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
                <span className="flex items-center gap-1 text-red-500 font-medium"><Flame size={14} /> Selling Fast</span>
                <span>{(item as any).soldCount}/{(item as any).totalCount} Sold</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{ width: `${((item as any).soldCount / (item as any).totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Description</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {language === 'mm' ? (item as any).descriptionMm || item.description : item.description}
          </p>
        </div>

        {/* Bundle Items */}
        {!isDeal && (item as any).items && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Package size={20} className="text-orange-500" />
              What's Included
            </h3>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-surface-container-low border-on-surface/10' : 'bg-surface-container-lowest border-on-surface/5'}`}>
              <ul className="space-y-3">
                {(item as any).items.map((i: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 w-full p-4 border-t ${darkMode ? 'bg-black border-on-surface/10' : 'bg-white border-on-surface/5'} shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40`}>
        <button 
          onClick={handleAddToCart}
          className={`w-full py-4 text-white font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 ${isDeal ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          <ShoppingCart size={20} />
          {language === 'mm' ? 'လှည်းထဲသို့ ထည့်မည်' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
