import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  ChevronLeft, Upload, CheckCircle2, CreditCard, Wallet, 
  Minus, Plus, Trash2, Receipt, ShieldCheck, ChevronRight, 
  Lock, Copy, Check, Trophy, ShoppingCart, MapPin, Home, 
  Building, Navigation, Edit2, Phone, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { 
    userName, setUserName, 
    userPhone, setUserPhone, 
    roomNumber, setRoomNumber, 
    placeOrder, cartTotal, cart, updateQuantity,
    bankName, bankAccountNumber, bankAccountName,
    points, setPoints,
    addresses,
    selectedAddressId, setSelectedAddressId,
    isDeliveryEnabled, getDeliveryDate, estimatedDeliveryTime,
    t, darkMode, formatPrice, getMainName, getSecondaryName
  } = useStore();

  const { date: deliveryDate, isToday } = getDeliveryDate();

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

  // Update selectedAddressId when addresses load if not set
  useEffect(() => {
    if (!selectedAddressId && defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, defaultAddress, selectedAddressId, setSelectedAddressId]);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || defaultAddress;

  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('COD');
  
  // Redemption Logic: 500 Points = RM 1.00 discount. Max 750 Points (RM 1.50) per order.
  const maxPointsAllowed = Math.min(points, 750);
  const pointsDiscount = usePoints ? (pointsToUse / 500) : 0;
  const finalTotal = cartTotal - pointsDiscount;
  const [isUploading, setIsUploading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();

  const handleFileUpload = () => {
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      setReceiptUploaded(true);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccountNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    // Validation for Delivery Address
    if (!selectedAddress) {
      toast.error(t('pleaseSelectAddress') || 'Please select a delivery address');
      return;
    }

    // Validation for Bank Transfer
    if (paymentMethod === 'Bank' && !receiptUploaded) {
      toast.error(t('pleaseUploadReceipt') || 'Please upload payment receipt');
      return;
    }
    
    // Prepare payment method display string
    const paymentDisplay = paymentMethod === 'COD' ? 'cash' : 'bank';

    const handlePlaceOrder = async () => {
      setIsPlacingOrder(true);
      try {
        const order = await placeOrder({ 
          name: selectedAddress?.name || userName, 
          phone: selectedAddress?.phone || userPhone, 
          room: selectedAddress ? `${selectedAddress.building || ''} ${selectedAddress.room || ''}`.trim() : roomNumber,
          address: selectedAddress ? `${selectedAddress.street}, ${selectedAddress.township}, ${selectedAddress.city}, ${selectedAddress.region}` : undefined,
          paymentMethod: paymentDisplay,
          pointDiscount: pointsDiscount,
          pointsUsed: usePoints ? pointsToUse : 0
        });
        if (order && typeof order === 'object') {
          setShowSuccessOverlay(true);
          // Faster transition to success page
          setTimeout(() => {
            navigate(`/success?id=${order.id}`, { state: { order }, replace: true });
          }, 800);
        } else {
          toast.error(t('orderFailed') + ' (Please check your connection or login status)');
        }
      } catch (error: any) {
        console.error("Checkout error:", error);
        const errorMsg = error?.message || '';
        if (errorMsg.includes('permission') || errorMsg.includes('Missing or insufficient permissions')) {
          toast.error(t('orderFailed') + ' (Permission Error. If you are using a phone number linked to a Google account, please log in.)');
        } else {
          toast.error(t('orderFailed') + ` (${errorMsg || 'Please check your connection'})`);
        }
      } finally {
        setIsPlacingOrder(false);
      }
    };

    handlePlaceOrder();
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-primary/20 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-surface text-on-surface'}`}>
      {/* Premium Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 h-[72px] flex items-center gap-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-white/5' : 'bg-surface/80 border-on-surface/5'}`}>
        <button 
          onClick={() => navigate(-1)}
          className={`flex-none w-10 h-10 border shadow-sm rounded-full flex items-center justify-center transition-all active:scale-95 ${darkMode ? 'bg-slate-800 border-white/10 hover:bg-slate-700' : 'bg-white border-on-surface/5 hover:bg-surface-container-low'}`}
        >
          <ChevronLeft size={20} className={darkMode ? 'text-white' : 'text-on-surface'} />
        </button>
        <div className="flex flex-col flex-grow">
          <h2 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-on-surface'}`}>{t('checkout')}</h2>
          <div className="flex items-center gap-1 text-primary">
            <Lock size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{t('securePayment')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {/* Delivery Service Banner */}
        <div className={`px-4 py-3 border-b flex items-center gap-3 transition-colors ${darkMode ? 'bg-primary/10 border-white/5' : 'bg-primary/5 border-on-surface/5'}`}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Clock size={16} />
          </div>
          <div className="flex-grow">
            <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-primary' : 'text-primary'}`}>
              {t('deliveryNotice')}
            </p>
            <p className={`text-[9px] font-bold ${darkMode ? 'text-white/60' : 'text-on-surface-variant'}`}>
              {t('deliveryScheduleMsg')} {estimatedDeliveryTime}
            </p>
          </div>
        </div>

        {!isDeliveryEnabled && (
          <div className="m-4 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mx-auto">
              <Clock size={24} />
            </div>
            <h3 className="font-black text-red-500 tracking-tight">{t('deliveryPaused')}</h3>
            <p className="text-xs font-bold text-red-500/70 leading-relaxed">
              {t('deliveryPausedDesc')}
            </p>
          </div>
        )}

        {cart.length === 0 && !isPlacingOrder && !showSuccessOverlay ? (
          <div className="py-32 px-6 text-center flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-inner ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-tr from-surface-container-low to-surface-container-highest'}`}
            >
              <ShoppingCart size={48} className={darkMode ? 'text-white/20' : 'text-on-surface-variant/40'} />
            </motion.div>
            <h3 className={`font-black text-2xl mb-3 tracking-tight ${darkMode ? 'text-white' : 'text-on-surface'}`}>{t('yourCartIsEmpty')}</h3>
            <p className={`text-sm mb-10 leading-relaxed max-w-[250px] ${darkMode ? 'text-white/60' : 'text-on-surface-variant'}`}>
              {t('emptyCartDesc')}
            </p>
            <button 
              onClick={() => navigate('/menu')}
              className={`w-full px-8 py-4 rounded-[1.5rem] font-black shadow-xl transition-all active:scale-95 ${darkMode ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-white/5' : 'bg-on-surface text-surface hover:bg-on-surface-variant shadow-on-surface/10'}`}
            >
              {t('startShopping')}
            </button>
          </div>
        ) : (
          <form id="checkout-form" onSubmit={handleSubmit} className="pb-40 pt-4 px-4 space-y-6">
            
            {/* Delivery Address Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  <h3 className={`font-black text-sm uppercase tracking-widest ${darkMode ? 'text-white/60' : 'text-on-surface'}`}>{t('deliveryAddress')}</h3>
                </div>
                {addresses.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => navigate('/address-management?from=checkout')}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    {t('change')}
                  </button>
                )}
              </div>

              {addresses.length === 0 ? (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate('/add-address')}
                  className={`w-full border-2 border-dashed rounded-[2.5rem] p-8 flex items-center gap-5 transition-all group ${
                    darkMode 
                      ? 'border-white/10 bg-slate-900/40 hover:border-primary/40 hover:bg-primary/5' 
                      : 'border-on-surface/10 bg-white hover:border-primary/40 hover:bg-primary/5 shadow-sm'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${
                    darkMode ? 'bg-slate-800 group-hover:bg-primary/20 text-white/20 group-hover:text-primary' : 'bg-surface-container-low group-hover:bg-primary/10 text-on-surface-variant/40 group-hover:text-primary'
                  }`}>
                    <Plus size={24} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-base tracking-tight ${darkMode ? 'text-white' : 'text-on-surface'}`}>{t('addAddress')}</p>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>{t('noAddressSet')}</p>
                  </div>
                </motion.button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-[2.5rem] p-8 border relative overflow-hidden transition-all duration-500 ${
                    darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-on-surface/5 shadow-[0_15px_50px_rgb(0,0,0,0.04)]'
                  }`}
                >
                  {/* Premium Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
                  
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 scale-110">
                          {selectedAddress?.label === 'Home' ? <Home size={24} /> : selectedAddress?.label === 'Office' ? <Building size={24} /> : <MapPin size={24} />}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`font-black text-base tracking-tight ${darkMode ? 'text-white' : 'text-on-surface'}`}>{selectedAddress?.name}</h4>
                            <span className="bg-primary/10 text-primary text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
                              {t(selectedAddress?.label.toLowerCase() || 'other')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone size={10} className="text-emerald-500" />
                            <p className={`text-[10px] font-black tracking-[0.1em] ${darkMode ? 'text-white/40' : 'text-on-surface-variant/60'}`}>{selectedAddress?.phone}</p>
                          </div>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => navigate(`/add-address?edit=${selectedAddress?.id}`)}
                        className={`p-3 rounded-2xl transition-all duration-300 ${darkMode ? 'bg-white/5 text-white/40 hover:text-primary hover:bg-primary/10' : 'bg-slate-50 text-on-surface-variant/40 hover:text-primary hover:bg-primary/5'}`}
                      >
                        <Edit2 size={16} />
                      </motion.button>
                    </div>
 
                    <div className={`h-px w-full transition-colors duration-500 ${darkMode ? 'bg-white/5' : 'bg-on-surface/5'}`}></div>
 
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                        <Navigation size={12} />
                      </div>
                      <p className={`text-xs font-bold leading-relaxed tracking-wide ${darkMode ? 'text-white/70' : 'text-on-surface-variant'}`}>
                        {selectedAddress?.street}, {selectedAddress?.building && `${selectedAddress.building}, `}{selectedAddress?.room && `${selectedAddress.room}, `}
                        {selectedAddress?.township}, {selectedAddress?.city}, {selectedAddress?.region}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </section>

            {/* Order Summary Section */}
            <section>
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-primary" />
                  <h3 className={`font-black text-sm uppercase tracking-widest ${darkMode ? 'text-white/60' : 'text-on-surface'}`}>{t('orderSummary')}</h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${darkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                  {cart.length} {t('items')}
                </span>
              </div>

              <div className={`rounded-[2rem] p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-colors ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-on-surface/5'}`}>
                <div className="px-4 pt-2">
                  <AnimatePresence mode="popLayout">
                    {cart.map(item => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={item.id} 
                        className={`flex gap-3 py-2 border-b last:border-0 transition-colors ${darkMode ? 'border-white/5' : 'border-on-surface/5'}`}
                      >
                        <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border relative ${darkMode ? 'bg-slate-800 border-white/5' : 'bg-surface-container-low border-on-surface/5'}`}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl"></div>
                        </div>
                        <div className="flex-grow flex flex-col justify-center">
                          <p className={`font-black text-xs leading-tight mb-0.5 ${darkMode ? 'text-white' : 'text-on-surface'}`}>{getMainName(item)}</p>
                          <p className={`text-[9px] font-bold leading-tight mb-0.5 ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>{getSecondaryName(item)}</p>
                          <p className={`text-[9px] font-bold text-primary mb-1`}>{t('qty')}: {item.quantity} {item.unit}</p>
                          <div className="flex items-center justify-between mt-auto">
                            <p className="font-black text-primary text-xs">{formatPrice(item.price * item.quantity)}</p>
                            <div className={`rounded-xl p-1 shadow-inner flex items-center ${darkMode ? 'bg-slate-800' : 'bg-surface-container-low'}`}>
                              <button 
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] border ${darkMode ? 'bg-slate-700 text-white border-white/10 hover:bg-slate-600' : 'bg-white text-on-surface border-on-surface/5 hover:bg-surface'}`}
                              >
                                {item.quantity === 1 ? <Trash2 size={16} className="text-error" /> : <Minus size={16} />}
                              </button>
                              <span className={`w-8 text-center font-black text-xs ${darkMode ? 'text-white' : 'text-on-surface'}`}>{item.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => item.isAvailable !== false ? updateQuantity(item.id, 1) : null}
                                disabled={item.isAvailable === false}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] border ${darkMode ? 'bg-slate-700 text-white border-white/10 hover:bg-slate-600' : 'bg-white text-on-surface border-on-surface/5 hover:bg-surface'} ${item.isAvailable === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Point Redemption */}
                <div className={`rounded-[1.5rem] p-4 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-white/5' : 'bg-white border-on-surface/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-on-surface'}`}>{t('usePoints')}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>
                          {points} {t('ptsAvailable')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUsePoints(!usePoints);
                        if (!usePoints) setPointsToUse(maxPointsAllowed);
                        else setPointsToUse(0);
                      }}
                      disabled={points < 1}
                      className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-300 ${
                        usePoints ? 'bg-primary' : (darkMode ? 'bg-slate-700' : 'bg-surface-container-high')
                      } ${points < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <motion.div 
                        animate={{ x: usePoints ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {usePoints && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-4 rounded-xl space-y-3 ${darkMode ? 'bg-slate-900/50' : 'bg-amber-50/50'}`}>
                          <div className="flex items-center justify-between">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-amber-900/60'}`}>
                              Points to Redeem (Max 750)
                            </label>
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                              -{formatPrice(pointsDiscount)}
                            </span>
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              max={maxPointsAllowed}
                              value={pointsToUse}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setPointsToUse(Math.min(val, maxPointsAllowed));
                              }}
                              className={`w-full py-3 px-4 rounded-xl font-black text-sm outline-none border-2 transition-all ${
                                darkMode 
                                  ? 'bg-slate-800 border-white/5 focus:border-amber-500/50 text-white' 
                                  : 'bg-white border-amber-100 focus:border-amber-500/50 text-on-surface'
                              }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => setPointsToUse(maxPointsAllowed)}
                                className="text-[9px] font-black text-amber-600 uppercase tracking-widest hover:underline"
                              >
                                {t('max')}
                              </button>
                            </div>
                          </div>
                          <p className={`text-[9px] font-bold italic ${darkMode ? 'text-white/30' : 'text-amber-900/40'}`}>
                            * 500 Points = RM 1.00. Maximum 750 points (RM 1.50) per order.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subtotal Area */}
                <div className={`rounded-[1.5rem] p-5 mt-2 transition-colors ${darkMode ? 'bg-slate-800/50' : 'bg-surface-container-low'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-xs font-bold ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>{t('deliveryDate')}</p>
                    <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-on-surface'}`}>
                      {isToday ? t('today') : t('tomorrow')}, {deliveryDate}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-xs font-bold ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>{t('subtotal')}</p>
                    <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-on-surface'}`}>{formatPrice(cartTotal)}</p>
                  </div>
                  {usePoints && (
                    <div className="flex justify-between items-center mb-2 text-amber-600">
                      <p className="text-xs font-bold">{t('pointsDiscount')}</p>
                      <p className="text-xs font-black">-{formatPrice(pointsDiscount)}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <p className={`text-xs font-bold ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>{t('deliveryFee')}</p>
                    <p className="text-xs font-black text-primary uppercase tracking-widest">{t('free')}</p>
                  </div>
                  <div className={`h-px w-full mb-4 ${darkMode ? 'bg-white/10' : 'bg-on-surface/5'}`}></div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-on-surface'}`}>{t('totalAmount')}</p>
                    <p className="text-xl font-black text-primary">{formatPrice(finalTotal)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Method Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-primary" />
                  <h3 className={`font-black text-sm uppercase tracking-widest ${darkMode ? 'text-white/60' : 'text-on-surface'}`}>{t('paymentMethod')}</h3>
                </div>
              </div>

              {/* Other Methods */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden flex items-center gap-3 ${
                      paymentMethod === 'COD' 
                        ? 'border-primary bg-primary/5 shadow-[0_4px_12px_rgba(13,99,27,0.06)]' 
                        : (darkMode ? 'border-white/5 bg-slate-900 hover:border-white/10 shadow-sm' : 'border-on-surface/5 bg-white hover:border-on-surface/10 shadow-sm')
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${paymentMethod === 'COD' ? 'bg-primary/10' : (darkMode ? 'bg-slate-800' : 'bg-surface-container-low')}`}>
                      <Wallet size={20} className={paymentMethod === 'COD' ? 'text-primary' : (darkMode ? 'text-white/20' : 'text-on-surface-variant/50')} />
                    </div>
                    <div>
                      <p className={`font-black text-xs leading-tight mb-0.5 ${paymentMethod === 'COD' ? 'text-primary' : (darkMode ? 'text-white' : 'text-on-surface')}`}>{t('cash')}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>{t('payOnDelivery')}</p>
                    </div>
                    {paymentMethod === 'COD' && (
                      <div className="absolute top-3 right-3 text-primary">
                        <CheckCircle2 size={16} className="fill-primary/20" />
                      </div>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('Bank')}
                    className={`p-4 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden flex items-center gap-3 ${
                      paymentMethod === 'Bank' 
                        ? 'border-primary bg-primary/5 shadow-[0_4px_12px_rgba(13,99,27,0.06)]' 
                        : (darkMode ? 'border-white/5 bg-slate-900 hover:border-white/10 shadow-sm' : 'border-on-surface/5 bg-white hover:border-on-surface/10 shadow-sm')
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${paymentMethod === 'Bank' ? 'bg-primary/10' : (darkMode ? 'bg-slate-800' : 'bg-surface-container-low')}`}>
                      <CreditCard size={20} className={paymentMethod === 'Bank' ? 'text-primary' : (darkMode ? 'text-white/20' : 'text-on-surface-variant/50')} />
                    </div>
                    <div>
                      <p className={`font-black text-xs leading-tight mb-0.5 ${paymentMethod === 'Bank' ? 'text-primary' : (darkMode ? 'text-white' : 'text-on-surface')}`}>{t('bank')}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>{t('transfer')}</p>
                    </div>
                    {paymentMethod === 'Bank' && (
                      <div className="absolute top-3 right-3 text-primary">
                        <CheckCircle2 size={16} className="fill-primary/20" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {paymentMethod === 'Bank' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 mt-1">
                      {/* Compact Premium Bank Card Design */}
                      <div className="bg-gradient-to-br from-primary to-primary-container p-4 rounded-[1.5rem] text-white relative overflow-hidden shadow-md">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none"></div>
                        
                        <div className="relative z-10 flex justify-between items-start">
                          <div className="flex-grow">
                            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-0.5">{bankName}</p>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-lg font-black tracking-widest font-mono drop-shadow-sm">{bankAccountNumber}</p>
                              <button 
                                type="button"
                                onClick={handleCopy}
                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors active:scale-90"
                                title={t('copyAccountNumber')}
                              >
                                {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                              </button>
                            </div>
                            <p className="text-[10px] font-bold tracking-wide text-white/90">{bankAccountName}</p>
                          </div>
                          <ShieldCheck size={32} className="text-white/20 flex-shrink-0" />
                        </div>
                        
                        <AnimatePresence>
                          {copied && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-2 right-4 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg"
                            >
                              {t('copied')}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Compact Upload Area */}
                      <div className="relative group">
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                          onChange={handleFileUpload}
                          disabled={isUploading || receiptUploaded}
                        />
                        <div className={`border-2 border-dashed rounded-[1.5rem] p-4 flex items-center gap-4 transition-all shadow-sm ${
                          receiptUploaded 
                            ? 'border-primary bg-primary/5' 
                            : (darkMode ? 'border-white/10 bg-slate-900 group-hover:border-primary/40 group-hover:bg-primary/5' : 'border-on-surface/10 bg-white group-hover:border-primary/40 group-hover:bg-primary/5')
                        }`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                            receiptUploaded ? 'bg-primary text-white' : (darkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-surface-container-low group-hover:bg-white')
                          }`}>
                            {isUploading ? (
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              >
                                <Upload size={18} />
                              </motion.div>
                            ) : receiptUploaded ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Upload size={18} className={`transition-colors ${darkMode ? 'text-white/20 group-hover:text-primary' : 'text-on-surface-variant/40 group-hover:text-primary'}`} />
                            )}
                          </div>
                          <div>
                            <p className={`text-xs font-black transition-colors mb-0.5 ${receiptUploaded ? 'text-primary' : (darkMode ? 'text-white group-hover:text-primary' : 'text-on-surface group-hover:text-primary')}`}>
                              {isUploading ? t('uploading') : receiptUploaded ? t('receiptUploaded') : t('uploadReceipt')}
                            </p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>
                              {receiptUploaded ? t('success') : t('proofOfPayment')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </form>
        )}
      </main>

      {/* Floating Bottom Action Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
          <div className={`backdrop-blur-xl border p-3 pl-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between gap-4 transition-colors ${darkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-on-surface/10'}`}>
            <div className="flex-none">
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${darkMode ? 'text-white/40' : 'text-on-surface-variant'}`}>{t('total')}</p>
              <p className="text-lg font-black text-primary leading-none">{formatPrice(finalTotal)}</p>
            </div>
            <button 
              type="submit"
              form="checkout-form"
              disabled={!isDeliveryEnabled || isPlacingOrder}
              className={`flex-1 py-3.5 px-6 rounded-full font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 group ${
                (!isDeliveryEnabled || isPlacingOrder)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary text-white shadow-primary/20 hover:bg-primary-container active:scale-95'
              }`}
            >
              {isPlacingOrder ? t('processing') || 'Processing...' : t('placeOrder')}
              {!isPlacingOrder && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      )}

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
            >
              <Check size={48} className="text-primary" strokeWidth={4} />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black tracking-tight"
            >
              {t('orderSuccessful')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/70 font-bold mt-2"
            >
              {t('redirecting') || 'Redirecting...'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
