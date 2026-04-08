import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Trophy, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function PointsPage() {
  const navigate = useNavigate();
  const { points, orders, t, darkMode, formatPrice } = useStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const transactions = useMemo(() => {
    const history: { id: string; type: 'earned' | 'spent'; amount: number; title: string; date: string; status?: string }[] = [];
    
    orders.forEach(order => {
      // Earned points: Use the stored earnedPoints from the order
      if (order.earnedPoints > 0) {
        history.push({
          id: `earned-${order.id}`,
          type: 'earned',
          amount: order.earnedPoints,
          title: `${t('order')} #${order.id}`,
          date: new Date(order.timestamp).toLocaleString(),
          status: order.status === 'delivered' ? undefined : 'Pending'
        });
      }

      // Spent points: Use the stored pointsUsed from the order
      if (order.pointsUsed > 0) {
        history.push({
          id: `spent-${order.id}`,
          type: 'spent',
          amount: order.pointsUsed,
          title: `${t('discountApplied')} (${t('order')} #${order.id})`,
          date: new Date(order.timestamp).toLocaleString()
        });
      }
    });

    return history.sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, t]);

  return (
    <div className={`min-h-screen pb-12 font-sans selection:bg-primary/20 transition-colors duration-300 ${darkMode ? 'bg-surface' : 'bg-surface'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 h-[72px] flex items-center gap-4 transition-colors duration-300 ${darkMode ? 'bg-surface/80 border-on-surface/5' : 'bg-surface/80 border-on-surface/5'}`}>
        <button
          onClick={() => navigate(-1)}
          className={`flex-none w-10 h-10 shadow-sm rounded-full flex items-center justify-center transition-all active:scale-90 ${darkMode ? 'bg-surface-container-high border-on-surface/10 hover:bg-surface-container-highest' : 'bg-surface-container-lowest border-on-surface/5 hover:bg-surface-container-low'}`}
        >
          <ChevronLeft size={20} className="text-on-surface-variant" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-on-surface tracking-tight leading-tight">{t('myPoints')}</h2>
          <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">{t('rewardsHistory')}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Trophy size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-orange-100 uppercase tracking-widest mb-1">{t('availableBalance')}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black tracking-tight">{points.toLocaleString()}</h3>
              <span className="text-lg font-bold text-orange-200">pts</span>
            </div>
            <p className="text-sm font-bold text-orange-100 mt-2">({formatPrice(points / 500)})</p>
            <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl">
              <Trophy size={14} className="text-yellow-200" />
              <span className="text-xs font-bold text-white">{t('goldMember')}</span>
            </div>
          </div>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-black text-on-surface uppercase tracking-widest px-2">{t('pointsHistory')}</h3>
          
          <div className={`rounded-3xl border shadow-sm overflow-hidden divide-y transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-on-surface/5 divide-on-surface/5' : 'bg-surface-container-lowest border-on-surface/5 divide-on-surface/5'}`}>
            {transactions.map((tx) => (
              <div key={tx.id} className={`p-4 flex items-center justify-between transition-colors ${darkMode ? 'hover:bg-surface-container-highest' : 'hover:bg-surface-container-low'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'earned' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tx.type === 'earned' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1 text-on-surface-variant/60">
                        <Clock size={10} />
                        <p className="text-[10px] font-bold">{tx.date}</p>
                      </div>
                      {tx.status && (
                        <span className="text-[8px] font-black bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {tx.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-black ${tx.type === 'earned' ? 'text-emerald-500' : 'text-on-surface'}`}>
                  {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
