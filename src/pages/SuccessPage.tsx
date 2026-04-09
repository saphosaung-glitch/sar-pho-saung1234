import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, MessageCircle, ShoppingBag, MapPin, Clock, FileText, ChevronRight, Receipt, Check, Home, Copy, Wallet, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, Order } from '../context/StoreContext';

export default function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { orders, supportNumber, t, darkMode, formatPrice } = useStore();
  const orderId = searchParams.get('id');
  
  const storeOrder = orders.find(o => o.id === orderId);
  const [order, setOrder] = useState<Order | null>(location.state?.order || storeOrder || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (storeOrder) {
      setOrder(storeOrder);
    }
  }, [storeOrder]);

  const handleWhatsApp = () => {
    const message = encodeURIComponent(t('whatsappSupportMsg').replace('{orderId}', orderId || ''));
    window.open(`https://wa.me/${supportNumber}?text=${message}`, '_blank');
  };

  // Status mapping
  const getStatusProgress = () => {
    if (!order) return '33%';
    switch (order.status) {
      case 'pending': return '33%';
      case 'packing': return '66%';
      case 'delivered': return '100%';
      default: return '33%';
    }
  };

  const getStatusLabel = () => {
    if (!order) return t('pending');
    switch (order.status) {
      case 'pending': return t('pending');
      case 'packing': return t('packing');
      case 'delivered': return t('delivered');
      default: return t('pending');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-primary/20 ${darkMode ? 'bg-surface text-on-surface' : 'bg-surface text-on-surface'}`}>
      {/* Decorative Background Elements */}
      <div className={`absolute top-0 left-0 w-full h-64 bg-gradient-to-b pointer-events-none ${darkMode ? 'from-primary/5 to-transparent' : 'from-primary/10 to-transparent'}`}></div>
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-10 right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-primary/5' : 'bg-primary/10'}`}
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={`absolute bottom-20 left-10 w-48 h-48 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-tertiary-fixed-dim/10' : 'bg-tertiary-fixed-dim/20'}`}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-w-md w-full relative z-10 border border-on-surface/5 ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}
      >
        {/* Success Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className="relative">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150"
            />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
              className="relative bg-gradient-to-br from-primary to-primary-container w-24 h-24 rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Check size={48} className="text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Success Text */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface mb-2 tracking-tight">{t('orderSuccessful')}</h1>
          <p className="text-on-surface-variant font-bold text-sm">
            {t('orderPlacedSuccess')}
          </p>
        </motion.div>

        {/* Order Progress */}
        <motion.div variants={itemVariants} className="mb-8 px-2">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${order?.status === 'pending' ? 'text-primary' : 'text-on-surface-variant/40'}`}>{t('placed')}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${order?.status === 'packing' ? 'text-primary' : 'text-on-surface-variant/40'}`}>{t('preparing')}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${order?.status === 'delivered' ? 'text-primary' : 'text-on-surface-variant/40'}`}>{t('delivering')}</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden flex ${darkMode ? 'bg-surface-container-highest' : 'bg-surface-container-high'}`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: getStatusProgress() }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </motion.div>
        
        {/* Order Details Card */}
        <motion.div variants={itemVariants} className={`p-5 rounded-[1.5rem] mb-8 border border-on-surface/5 ${darkMode ? 'bg-surface-container-highest' : 'bg-surface-container-low'}`}>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-on-surface/10">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-primary" />
              <span className="text-xs font-black text-on-surface uppercase tracking-widest">{t('orderId')}</span>
            </div>
            <div className="flex items-center gap-2 relative">
              <span className="text-sm font-black text-primary font-mono bg-primary/10 px-2 py-1 rounded-md">#{orderId || 'SP-8924'}</span>
              <button 
                onClick={() => copyToClipboard(orderId || 'SP-8924')}
                className={`p-1.5 rounded-lg text-on-surface-variant hover:text-primary transition-colors active:scale-90 ${darkMode ? 'bg-surface-container-high' : 'bg-surface-container-high'}`}
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <AnimatePresence>
                {copied && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-8 right-0 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg"
                  >
                    {t('copied')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="space-y-3">
              <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Home size={16} />
                  <span className="text-xs font-bold">{t('deliveryTo')}</span>
                </div>
                <span className="text-xs font-black text-on-surface ml-4 overflow-hidden text-ellipsis">
                  {order?.address 
                    ? (order.address.split(',').reverse()[2]?.trim() || order.address.split(',')[3]?.trim()) 
                    : 'Kuchai Lama'}
                </span>
              </div>
              <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <ShoppingBag size={16} />
                  <span className="text-xs font-bold">{t('totalAmount')}</span>
                </div>
                <span className="text-sm font-black text-primary ml-4 overflow-hidden text-ellipsis">
                  {order ? formatPrice(order.total) : '...'}
                </span>
              </div>
              <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Clock size={16} />
                  <span className="text-xs font-bold">{t('estimatedDelivery')}</span>
                </div>
                <span className="text-xs font-black text-on-surface ml-4 overflow-hidden text-ellipsis">8:00AM - 10:00AM</span>
              </div>
              <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Wallet size={16} />
                  <span className="text-xs font-bold">{t('payment')}</span>
                </div>
                <span className="text-xs font-black text-on-surface ml-4 overflow-hidden text-ellipsis">
                  {!order ? '...' : (['cash', 'Cash', 'Tunai', 'COD'].includes(order.paymentMethod) ? 'COD' : 'Bank')}
                </span>
              </div>
              <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Trophy size={16} />
                  <span className="text-xs font-bold">{t('pointsEarned')}</span>
                </div>
                <span className="text-xs font-black text-amber-600 ml-4 overflow-hidden text-ellipsis">
                  {order ? `+${order.earnedPoints}` : '...'} pts
                </span>
              </div>
              <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <MapPin size={16} />
                  <span className="text-xs font-bold">{t('deliveryStatus')}</span>
                </div>
                <span className="text-[10px] font-black text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 px-2 py-1 rounded-md uppercase tracking-widest ml-4 overflow-hidden text-ellipsis">{getStatusLabel()}</span>
              </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="space-y-3">
          <button 
            onClick={() => navigate('/orders', { state: { from: 'success' } })}
            className="w-full bg-primary text-white py-4 rounded-full font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            <FileText size={18} />
            {t('trackOrder')}
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/menu')}
              className={`text-on-surface border border-on-surface/10 py-3.5 rounded-full font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${darkMode ? 'bg-surface-container-highest hover:bg-surface-container-high' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
            >
              <ShoppingBag size={16} className="text-primary" />
              {t('continueShopping')}
            </button>
            <button 
              onClick={handleWhatsApp}
              className={`text-on-surface border border-on-surface/10 py-3.5 rounded-full font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${darkMode ? 'bg-surface-container-highest hover:bg-surface-container-high' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
            >
              <MessageCircle size={16} className="text-[#25D366]" />
              {t('contactSupport')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

