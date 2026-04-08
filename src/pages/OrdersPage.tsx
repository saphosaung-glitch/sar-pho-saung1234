import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function OrdersPage() {
  const { orders, t, darkMode, formatPrice } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (location.state?.from === 'success') {
      navigate('/menu');
    } else if (location.state?.from === 'profile') {
      navigate('/profile');
    } else {
      navigate(-1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'packing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'delivered': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'cancelled': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-on-surface-variant bg-on-surface/5 border-on-surface/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return Clock;
      case 'packing': return Package;
      case 'delivered': return CheckCircle2;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  // Sort orders so newest are at the top
  const sortedOrders = [...(orders || [])].sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return timeB - timeA; // Descending: newest first
  });

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#F8FAFC]'}`}>
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b border-on-surface/5 px-4 h-[72px] flex items-center gap-4 ${darkMode ? 'bg-surface/80' : 'bg-white/80'}`}>
        <button 
          onClick={handleBack}
          className={`flex-none w-10 h-10 border border-on-surface/10 shadow-sm rounded-full flex items-center justify-center transition-all active:scale-90 ${darkMode ? 'bg-surface-container-high hover:bg-surface-container-highest' : 'bg-white hover:bg-slate-50'}`}
        >
          <ChevronLeft size={20} className="text-on-surface" />
        </button>
        <h2 className="text-lg font-black text-on-surface tracking-tight">{t('orderHistory')}</h2>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-200'}`}>
              <Package size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-on-surface">{t('noOrdersYet')}</h3>
            <p className="text-sm text-on-surface-variant max-w-[200px]">{t('noOrdersDesc')}</p>
            <button 
              onClick={() => navigate('/menu')}
              className="mt-4 px-8 py-3 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              {t('goShopping')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOrders.map((order, idx) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className={`p-4 rounded-[2rem] border shadow-sm active:scale-[0.98] transition-all cursor-pointer ${darkMode ? 'bg-surface-container-high border-on-surface/5' : 'bg-white border-slate-100'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${getStatusColor(order.status)}`}>
                        <StatusIcon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-on-surface">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">
                          {new Date(order.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{formatPrice(order.total)}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">
                        {order.items?.length || 0} {t('items')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-on-surface/5">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${getStatusColor(order.status)}`}>
                      {t(order.status?.toLowerCase()) || order.status}
                    </span>
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span className="text-[10px] font-bold">{t('viewDetails')}</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </main>
    </div>
  );
}
