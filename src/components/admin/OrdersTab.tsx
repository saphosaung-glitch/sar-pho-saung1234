import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Package, Clock, CheckCircle2, X, DollarSign, Search } from 'lucide-react';
import { Order } from '../../context/StoreContext';

export default function OrdersTab({ orders, darkMode, formatPrice, t, updateStatus }: {
  orders: Order[],
  darkMode: boolean,
  formatPrice: (p: number) => string,
  t: (key: string) => string,
  updateStatus: (id: string, s: string) => void
}) {
  const stats = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      revenue: totalRevenue,
      count: orders.length,
      pending: orders.filter(o => o.status === 'pending').length
    };
  }, [orders]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { 
          icon: CheckCircle2, 
          color: 'text-emerald-500', 
          bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
          label: t('delivered')
        };
      case 'packing':
        return { 
          icon: Package, 
          color: 'text-blue-500', 
          bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
          label: t('packing')
        };
      case 'cancelled':
        return { 
          icon: X, 
          color: 'text-rose-500', 
          bg: darkMode ? 'bg-rose-500/10' : 'bg-rose-50',
          label: t('cancelled')
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-amber-500', 
          bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50',
          label: t('pending')
        };
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'revenue', value: formatPrice(stats.revenue), icon: DollarSign, color: 'text-emerald-500', sub: 'From delivered orders' },
          { label: 'totalOrders', value: stats.count, icon: Package, color: 'text-blue-500', sub: 'In current filter' },
          { label: 'pendingOrders', value: stats.pending, icon: Clock, color: 'text-amber-500', sub: 'Requiring action' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 rounded-[2.5rem] border relative overflow-hidden group ${
              darkMode ? 'bg-surface-container-high/40 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]'
            }`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${stat.color.replace('text-', 'bg-')}`} />
            <div className="relative z-10 flex flex-col gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t(stat.label)}</p>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                <p className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-wider">{stat.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Orders List Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-6 mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Showing {orders.length} Records</h3>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>Actions</span>
          </div>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {orders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-16 rounded-[3rem] border border-dashed text-center ${darkMode ? 'border-white/10' : 'border-gray-200'}`}
              >
                <div className="w-20 h-20 rounded-full bg-gray-500/5 flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="opacity-20" />
                </div>
                <h3 className="text-xl font-black opacity-40">No orders found</h3>
                <p className="text-sm opacity-20 font-bold max-w-xs mx-auto mt-2 italic">Try adjusting your filters or search query to find what you're looking for.</p>
              </motion.div>
            ) : orders.map((order, i) => {
              const config = getStatusConfig(order.status);
              return (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group p-6 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 ${
                    darkMode ? 'bg-surface-container/60 border-white/5 hover:bg-surface-container' : 'bg-white border-gray-100 hover:shadow-xl shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${config.bg}`}>
                      <config.icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-primary' : 'text-emerald-600'}`}>
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                        <span className="text-[10px] font-bold opacity-40">
                          {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-lg font-black tracking-tight truncate">{order.customerName}</h4>
                      <p className="text-xs font-bold opacity-40 uppercase tracking-widest text-emerald-500/80">Room {order.roomNumber} • {order.customerPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-gray-50 dark:border-white/5">
                    <div className="text-right">
                      <p className="text-2xl font-black tracking-tighter">{formatPrice(order.total)}</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                        {order.items.length} Items Total
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl gap-1">
                        {['pending', 'packing', 'delivered', 'cancelled'].map((s) => (
                          <motion.button
                            key={s}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, s); }}
                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              order.status === s 
                                ? 'bg-primary text-surface shadow-lg shadow-primary/20' 
                                : 'text-gray-400 hover:text-primary dark:hover:text-white'
                            }`}
                            title={`Mark as ${s}`}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
