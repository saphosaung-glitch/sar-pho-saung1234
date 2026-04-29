import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, MessageCircle, MessageSquare, ShoppingBag, MapPin, Clock, FileText, ChevronRight, Receipt, Check, Home, Copy, Wallet, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, Order } from '../context/StoreContext';
import confetti from 'canvas-confetti';

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

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleShare = async (platform: 'whatsapp' | 'viber') => {
    if (!order) return;
    const { formatOrderForWhatsApp, getWhatsAppLink, getViberLink } = await import('../lib/messaging');
    const message = formatOrderForWhatsApp(order, formatPrice);
    const link = platform === 'whatsapp' 
      ? getWhatsAppLink(supportNumber, message) 
      : getViberLink(supportNumber, message);
    window.open(link, '_blank');
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
    <div className={`min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden font-sans selection:bg-primary/20 ${darkMode ? 'bg-surface text-on-surface' : 'bg-surface text-on-surface'}`}>
      {/* Decorative Background Elements */}
      <div className={`absolute top-0 left-0 w-full h-48 bg-gradient-to-b pointer-events-none ${darkMode ? 'from-primary/5 to-transparent' : 'from-primary/10 to-transparent'}`}></div>
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-5 right-5 w-32 h-32 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-primary/5' : 'bg-primary/10'}`}
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={`absolute bottom-10 left-5 w-40 h-40 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-tertiary-fixed-dim/10' : 'bg-tertiary-fixed-dim/20'}`}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`p-5 sm:p-7 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] max-w-[360px] w-full relative z-10 border border-on-surface/5 flex flex-col ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}
      >
        {/* Success Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-[2vh]">
          <div className="relative">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-125"
            />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
              className="relative bg-gradient-to-br from-primary to-primary-container w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Check size={28} className="text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Success Text */}
        <motion.div variants={itemVariants} className="text-center mb-[2vh]">
          <h1 className="text-xl sm:text-2xl font-black text-on-surface mb-1 tracking-tight leading-tight">{t('orderSuccessful')}</h1>
          <p className="text-on-surface-variant font-bold text-[10px] sm:text-xs">
            {t('orderPlacedSuccess')}
          </p>
        </motion.div>

        {/* Order Progress */}
        <motion.div variants={itemVariants} className="mb-[2.5vh] px-2">
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-[8px] font-black uppercase tracking-tight ${order?.status === 'pending' ? 'text-primary' : 'text-on-surface-variant/40'}`}>{t('placed')}</span>
            <span className={`text-[8px] font-black uppercase tracking-tight ${order?.status === 'packing' ? 'text-primary' : 'text-on-surface-variant/40'}`}>{t('preparing')}</span>
            <span className={`text-[8px] font-black uppercase tracking-tight ${order?.status === 'delivered' ? 'text-primary' : 'text-on-surface-variant/40'}`}>{t('delivering')}</span>
          </div>
          <div className={`h-1 rounded-full overflow-hidden flex ${darkMode ? 'bg-surface-container-highest' : 'bg-surface-container-high'}`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: getStatusProgress() }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </motion.div>
        
        {/* Order Details Card (Receipt Style) */}
        <motion.div 
          variants={itemVariants} 
          className={`p-5 rounded-[2rem] mb-[2.5vh] border border-on-surface/5 shadow-inner flex-grow flex flex-col justify-center ${darkMode ? 'bg-surface-container-highest' : 'bg-slate-50/80'}`}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-on-surface/20">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-primary" />
              <span className="text-[9px] font-black text-on-surface uppercase tracking-widest">{t('orderId')}</span>
            </div>
            <span className="text-xs font-black text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">#{orderId || '........'}</span>
          </div>
          
          <div className="space-y-[1.5vh]">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Home size={14} />
                  <span className="text-[10px] font-bold">{t('deliveryTo')}</span>
                </div>
                <span className="text-[10px] font-black text-on-surface text-right truncate max-w-[120px]">
                  {order?.address 
                    ? (order.address.split(',').reverse()[2]?.trim() || order.address.split(',')[3]?.trim()) 
                    : 'Kuchai Lama'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <ShoppingBag size={14} />
                  <span className="text-[10px] font-bold">{t('totalAmount')}</span>
                </div>
                <span className="text-sm font-black text-primary">
                  {order ? formatPrice(order.total) : '...'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold">{t('estimatedDelivery')}</span>
                </div>
                <span className="text-[10px] font-black text-on-surface">8:00AM - 10:00AM</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Wallet size={14} />
                  <span className="text-[10px] font-bold">{t('payment')}</span>
                </div>
                <span className="text-[10px] font-black text-on-surface">
                  {!order ? '...' : (['cash', 'Cash', 'Tunai', 'COD'].includes(order.paymentMethod) ? 'COD' : 'Bank')}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <Trophy size={14} />
                  <span className="text-[10px] font-bold">{t('pointsEarned')}</span>
                </div>
                <span className="text-[10px] font-black text-amber-600">
                  {order ? `+${order.earnedPoints}` : '...'} pts
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
                  <MapPin size={14} />
                  <span className="text-[10px] font-bold">{t('deliveryStatus')}</span>
                </div>
                <span className="text-[8px] font-black text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 px-2 py-0.5 rounded-md uppercase tracking-tight">{getStatusLabel()}</span>
              </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="space-y-2">
          <button 
            onClick={() => navigate('/orders', { state: { from: 'success' } })}
            className="w-full bg-primary text-white py-3 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            <FileText size={16} />
            <span className="truncate">{t('trackOrder')}</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              <button 
                onClick={() => handleShare('whatsapp')}
                className={`flex-1 text-on-surface border border-on-surface/10 py-2.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${darkMode ? 'bg-surface-container-highest hover:bg-surface-container-high' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
                title="Send via WhatsApp"
              >
                <MessageCircle size={18} className="text-[#25D366]" />
              </button>
              <button 
                onClick={() => handleShare('viber')}
                className={`flex-1 text-on-surface border border-on-surface/10 py-2.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${darkMode ? 'bg-surface-container-highest hover:bg-surface-container-high' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
                title="Send via Viber"
              >
                <MessageSquare size={18} className="text-purple-500" />
              </button>
            </div>
            <button 
              onClick={() => navigate('/menu')}
              className={`text-on-surface border border-on-surface/10 py-2.5 rounded-2xl font-black text-[10px] transition-all active:scale-95 flex items-center justify-center gap-1.5 ${darkMode ? 'bg-surface-container-highest hover:bg-surface-container-high' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
            >
              <ShoppingBag size={14} className="text-primary" />
              <span className="truncate">{t('continueShopping')}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

