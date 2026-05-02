import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, PaymentMethod } from '../context/StoreContext';
import { ChevronLeft, Plus, Trash2, CreditCard, CheckCircle2, ShieldCheck, X, Lock, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PaymentMethodsPage() {
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod, t, darkMode } = useStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [newCard, setNewCard] = useState({
    type: 'visa' as PaymentMethod['type'],
    number: '',
    expiry: '',
    cvv: '',
    cardHolder: '',
    isDefault: false
  });

  const detectCardType = (number: string): PaymentMethod['type'] => {
    if (number.startsWith('4')) return 'visa';
    if (number.match(/^5[1-5]/)) return 'mastercard';
    if (number.startsWith('34') || number.startsWith('37')) return 'amex';
    return newCard.type;
  };

  const handleCardNumberChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    const detectedType = detectCardType(cleanVal);
    setNewCard({ ...newCard, number: cleanVal, type: detectedType });
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCard.number.length < 16 || !newCard.expiry || !newCard.cardHolder) return;

    addPaymentMethod({
      type: newCard.type,
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      cardHolder: newCard.cardHolder.toUpperCase(),
      isDefault: newCard.isDefault
    });

    setIsAdding(false);
    setNewCard({
      type: 'visa',
      number: '',
      expiry: '',
      cvv: '',
      cardHolder: '',
      isDefault: false
    });
  };

  const getCardStyles = (type: string) => {
    switch (type) {
      case 'visa': return {
        bg: 'bg-gradient-to-br from-[#1A1F71] via-[#2A3F91] to-[#1A1F71]',
        accent: 'bg-white/10',
        text: 'text-white',
        logo: 'VISA',
        secondary: 'bg-[#F7B600]'
      };
      case 'mastercard': return {
        bg: 'bg-gradient-to-br from-[#222222] via-[#444444] to-[#222222]',
        accent: 'bg-[#EB001B]/20',
        text: 'text-white',
        logo: 'Mastercard',
        secondary: 'bg-[#FF5F00]'
      };
      case 'amex': return {
        bg: 'bg-gradient-to-br from-[#007BC1] via-[#00A3E0] to-[#007BC1]',
        accent: 'bg-white/10',
        text: 'text-white',
        logo: 'AMEX',
        secondary: 'bg-[#C1C1C1]'
      };
      default: return {
        bg: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800',
        accent: 'bg-white/5',
        text: 'text-white',
        logo: 'CARD',
        secondary: 'bg-primary'
      };
    }
  };

  const formattedCardNumber = useMemo(() => {
    const num = newCard.number.padEnd(16, '•');
    return num.match(/.{1,4}/g)?.join(' ') || num;
  }, [newCard.number]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-primary/20">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 h-[80px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white border border-black/5 shadow-sm rounded-full flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
          >
            <ChevronLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <h2 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('paymentMethods')}</h2>
            <div className="flex items-center gap-1.5">
              <Lock size={10} className="text-primary" />
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('secureStorage')}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-black/10 ${darkMode ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
        >
          <Plus size={16} />
          {t('addCard')}
        </button>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8 pb-32">
        {/* Security Info Card */}
        <div className={`border border-on-surface/5 rounded-3xl p-5 shadow-sm flex items-start gap-4 ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}>
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('bankLevelSecurity')}</h4>
            <p className={`text-[11px] leading-relaxed font-medium ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>
              {t('securityDescription')}
            </p>
          </div>
        </div>

        {/* Card List Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">{t('yourSavedCards')}</h3>
            <span className="text-[10px] font-bold text-on-surface-variant/40">{paymentMethods.length} {t('total')}</span>
          </div>

          {paymentMethods.length === 0 ? (
            <div className={`py-24 text-center flex flex-col items-center rounded-[2.5rem] border border-dashed border-on-surface/10 ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-surface-container-low' : 'bg-gray-50'}`}>
                <CreditCard size={24} className="text-on-surface-variant/30" />
              </div>
              <p className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">{t('noCardsFound')}</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                {t('addFirstCard')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((card) => {
                const styles = getCardStyles(card.type);
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={card.id}
                    className={`relative group p-8 rounded-[2.5rem] ${styles.bg} ${styles.text} shadow-xl shadow-black/10 overflow-hidden min-h-[220px] flex flex-col justify-between`}
                  >
                    {/* Premium Card Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none" />
                    
                    {/* Chip & Logo */}
                    <div className="flex justify-between items-start relative z-10">
                      <div className="w-12 h-9 bg-gradient-to-br from-yellow-200/40 to-yellow-500/40 rounded-md backdrop-blur-sm border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-30">
                          {[...Array(9)].map((_, i) => <div key={i} className="border border-white/20" />)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black italic tracking-tighter opacity-90">{styles.logo}</p>
                        {card.isDefault && (
                          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                            <CheckCircle2 size={10} className="text-emerald-400" />
                            <span className="text-[8px] font-bold uppercase tracking-widest">{t('default')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Number */}
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50 mb-2">{t('cardNumber')}</p>
                      <p className="text-2xl font-mono tracking-[0.25em] drop-shadow-md">
                        •••• •••• •••• {card.last4}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end relative z-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">{t('cardHolder')}</p>
                        <p className="text-sm font-bold tracking-tight uppercase">{card.cardHolder}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">{t('expires')}</p>
                        <p className="text-sm font-bold tracking-tight">{card.expiry}</p>
                      </div>
                    </div>

                    {/* Action Buttons (Hover) */}
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!card.isDefault && (
                        <button 
                          onClick={() => setDefaultPaymentMethod(card.id)}
                          className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all border border-white/10"
                          title="Set as Default"
                        >
                          <CheckCircle2 size={18} className="text-white/60" />
                        </button>
                      )}
                      <button 
                        onClick={() => removePaymentMethod(card.id)}
                        className="w-10 h-10 bg-rose-500/20 hover:bg-rose-500/40 backdrop-blur-md rounded-full flex items-center justify-center transition-all border border-rose-500/20 text-rose-100"
                        title="Remove Card"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Premium Add Card Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative bg-white w-full max-w-xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>{t('addNewCard')}</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{t('enterSecureDetails')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-8 space-y-8">
                {/* Live Card Preview with Flip Animation */}
                <div className="relative h-[220px] w-full [perspective:1000px]">
                  <motion.div 
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="relative w-full h-full [transform-style:preserve-3d]"
                  >
                    {/* Front of Card */}
                    <div className={`absolute inset-0 [backface-visibility:hidden] p-8 rounded-[2.5rem] ${getCardStyles(newCard.type).bg} text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-white/10`}>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-24 -mb-24 pointer-events-none" />
                      
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-9 bg-gradient-to-br from-yellow-200/60 to-yellow-500/60 rounded-md backdrop-blur-sm border border-white/20 relative overflow-hidden shadow-inner">
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-30">
                            {[...Array(9)].map((_, i) => <div key={i} className="border border-white/20" />)}
                          </div>
                        </div>
                        <p className="text-xl font-black italic tracking-tighter opacity-90">{getCardStyles(newCard.type).logo}</p>
                      </div>
  
                      <div className="relative z-10">
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-50 mb-2">Card Number</p>
                        <p className="text-xl font-mono tracking-[0.25em] drop-shadow-md">{formattedCardNumber}</p>
                      </div>
  
                      <div className="flex justify-between items-end relative z-10">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-50">Card Holder</p>
                          <p className="text-xs font-bold tracking-tight uppercase truncate max-w-[180px]">
                            {newCard.cardHolder || 'SAR TAW SET'}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-50">Expires</p>
                          <p className="text-xs font-bold tracking-tight">{newCard.expiry || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Back of Card */}
                    <div className={`absolute inset-0 [backface-visibility:hidden] p-0 rounded-[2.5rem] ${getCardStyles(newCard.type).bg} text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-white/10 [transform:rotateY(180deg)]`}>
                      <div className="w-full h-12 bg-black/80 mt-8" />
                      <div className="px-8 pb-12">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-10 bg-white/20 rounded-lg flex items-center justify-end px-4">
                            <p className="text-gray-900 font-mono font-bold italic bg-white px-2 py-0.5 rounded shadow-inner">
                              {newCard.cvv || '•••'}
                            </p>
                          </div>
                          <div className="w-12 h-8 bg-white/10 rounded-md flex items-center justify-center">
                            <p className="text-[8px] font-bold opacity-50">CVV</p>
                          </div>
                        </div>
                        <p className="mt-6 text-[8px] leading-relaxed opacity-40 font-medium">
                          This card is issued by your bank pursuant to license by the respective card network. By using this card, you agree to the terms and conditions.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <form onSubmit={handleAddCard} className="space-y-6">
                  {/* Card Type Selector */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Network</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['visa', 'mastercard', 'amex'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewCard({ ...newCard, type })}
                          className={`py-3 rounded-2xl border-2 transition-all text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-2 ${
                            newCard.type === type 
                              ? 'border-gray-900 bg-gray-900 text-white shadow-lg' 
                              : 'border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-xs">{type === 'visa' ? 'VISA' : type === 'mastercard' ? 'MC' : 'AMEX'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Card Holder */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Card Holder Name</label>
                      <div className="relative">
                        <input 
                          required
                          type="text"
                          placeholder="FULL NAME"
                          value={newCard.cardHolder}
                          onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-gray-900 transition-all placeholder:text-gray-300 uppercase outline-none"
                        />
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Card Number</label>
                      <div className="relative">
                        <input 
                          required
                          type="text"
                          maxLength={16}
                          placeholder="0000 0000 0000 0000"
                          value={newCard.number}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          onFocus={() => setIsFlipped(false)}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-gray-900 transition-all placeholder:text-gray-300 tracking-[0.2em] outline-none"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                          <CreditCard size={18} className="text-gray-300" />
                        </div>
                      </div>
                    </div>
  
                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                        <input 
                          required
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={newCard.expiry}
                          onFocus={() => setIsFlipped(false)}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                            setNewCard({ ...newCard, expiry: val });
                          }}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-gray-900 transition-all placeholder:text-gray-300 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">CVV</label>
                        <input 
                          required
                          type="text"
                          maxLength={3}
                          placeholder="•••"
                          value={newCard.cvv}
                          onFocus={() => setIsFlipped(true)}
                          onBlur={() => setIsFlipped(false)}
                          onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-gray-900 transition-all placeholder:text-gray-300 tracking-widest outline-none"
                        />
                      </div>
                    </div>

                    {/* Default Toggle */}
                    <button 
                      type="button"
                      onClick={() => setNewCard({ ...newCard, isDefault: !newCard.isDefault })}
                      className="flex items-center gap-3 py-2 group"
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newCard.isDefault ? 'bg-gray-900 border-gray-900' : 'border-gray-100 group-hover:border-gray-200'}`}>
                        {newCard.isDefault && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Set as default payment method</span>
                    </button>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-bold text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} />
                    Securely Save Card
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
