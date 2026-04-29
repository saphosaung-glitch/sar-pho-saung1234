import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Package, Clock, CheckCircle2, X, DollarSign, Search, Eye, FileText, Download, Printer, User, Phone, MapPin, Receipt, Wallet, Calendar } from 'lucide-react';
import { Order } from '../../context/StoreContext';
import OrderInvoice from './OrderInvoice';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function OrdersTab({ orders, darkMode, formatPrice, t, updateStatus }: {
  orders: Order[],
  darkMode: boolean,
  formatPrice: (p: number) => string,
  t: (key: string) => string,
  updateStatus: (id: string, s: string) => void
}) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async (order: Order) => {
    if (!invoiceRef.current) return;
    
    setIsExporting(true);
    try {
      const element = document.getElementById(`invoice-${order.id}`);
      if (!element) throw new Error('Invoice element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${order.id}.pdf`);
      toast.success('Invoice PDF downloaded');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = (order: Order) => {
    const printContent = document.getElementById(`invoice-${order.id}`);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            @media print {
              @page { size: A4; margin: 0; }
              body { margin: 0; padding: 0; }
            }
            body { font-family: sans-serif; }
            ${Array.from(document.styleSheets)
              .filter(s => !s.href || s.href.startsWith(window.location.origin))
              .map(s => {
                try {
                  return Array.from(s.cssRules).map(r => r.cssText).join('');
                } catch (e) {
                  return '';
                }
              })
              .join('\n')}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
                          #{order.id}
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
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                          darkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>

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

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-6xl h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col md:flex-row ${
                darkMode ? 'bg-[#0F172A] text-white border border-white/5' : 'bg-white text-slate-900 border border-slate-200'
              }`}
            >
              {/* Left Side: Premium Management Rail */}
              <div className={`p-10 md:w-[450px] flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar ${
                darkMode ? 'bg-[#1E293B]/50' : 'bg-slate-50/50'
              }`}>
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20 rotate-3">
                      <Receipt size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight leading-tight">Order Management</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Priority Service</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-black opacity-40 uppercase tracking-widest leading-none">#{selectedOrder.id}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8 flex-grow">
                  {/* Status & Actions Section */}
                  <section className={`p-6 rounded-[2.5rem] border ${
                    darkMode ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-white border-slate-100 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Settlement Active</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                        selectedOrder.status === 'delivered' ? 'bg-emerald-500 text-white' : 
                        selectedOrder.status === 'cancelled' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                       <button 
                         onClick={() => handlePrint(selectedOrder)}
                         className="group flex flex-col items-center justify-center gap-3 py-6 rounded-3xl bg-slate-900 text-white transition-all hover:bg-slate-800 active:scale-95 shadow-xl shadow-slate-900/20"
                       >
                         <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                           <Printer size={20} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Generate Printout</span>
                       </button>
                    </div>
                  </section>

                  {/* Customer Intelligence */}
                  <div className="grid gap-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Recipient Intelligence</h3>
                    
                    <div className={`p-5 rounded-3xl border transition-all hover:scale-[1.02] ${
                      darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white shadow-sm'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                          <User size={22} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Primary Contact</p>
                          <p className="text-base font-black tracking-tight">{selectedOrder.customerName}</p>
                          <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-blue-500/10 rounded-md inline-flex">
                            <Phone size={10} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-500 uppercase">{selectedOrder.customerPhone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-3xl border transition-all hover:scale-[1.02] ${
                      darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white shadow-sm'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                          <MapPin size={22} />
                        </div>
                        <div className="flex-grow">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Delivery Point</p>
                          <p className="text-base font-black tracking-tight">Apartment {selectedOrder.roomNumber}</p>
                          {selectedOrder.address && (
                            <p className="text-xs font-bold opacity-40 mt-1 uppercase tracking-wider leading-relaxed">
                              {selectedOrder.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-3xl border transition-all hover:scale-[1.02] ${
                      darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white shadow-sm'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                          <Wallet size={22} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Liquidity Arrangement</p>
                          <p className="text-base font-black tracking-tight uppercase tracking-widest">{selectedOrder.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className={`mt-8 p-10 rounded-[3rem] relative overflow-hidden ${
                  darkMode ? 'bg-slate-900 border border-white/5' : 'bg-slate-900 text-white shadow-2xl'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6 opacity-60">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Gross Settlement</p>
                      <p className="text-sm font-black tabular-nums">{formatPrice(selectedOrder.total + (selectedOrder.pointDiscount || 0))}</p>
                    </div>
                    {selectedOrder.pointDiscount > 0 && (
                      <div className="flex justify-between items-center mb-6 text-rose-400">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Royal Credit Bias</p>
                        <p className="text-sm font-black tabular-nums">-{formatPrice(selectedOrder.pointDiscount)}</p>
                      </div>
                    )}
                    <div className="h-px bg-white/10 mb-6" />
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Final Allocation</p>
                        <p className="text-4xl font-black tracking-tighter text-white tabular-nums leading-none">
                          {formatPrice(selectedOrder.total)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">+{selectedOrder.earnedPoints} PTS</span>
                         <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] border border-emerald-500/20">Verified</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: High-Definition Document Preview */}
              <div className={`flex-grow p-12 overflow-y-auto flex flex-col items-center custom-scrollbar ${
                darkMode ? 'bg-[#0B0F19]' : 'bg-slate-200'
              }`}>
                 <div className="mb-6 flex items-center gap-3 self-start md:self-center">
                   <div className="w-4 h-4 rounded-full bg-emerald-500" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Document Verification Mode / A4 Format</p>
                 </div>
                 
                 <div className="shadow-[0_20px_70px_rgba(0,0,0,0.15)] origin-top hover:shadow-[0_40px_120px_rgba(0,0,0,0.25)] transition-all duration-700 ease-out scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-[0.95] xl:scale-100 mb-40 h-fit rounded-lg overflow-hidden border border-white/10">
                    <OrderInvoice 
                      id={`invoice-${selectedOrder.id}`}
                      order={selectedOrder}
                      formatPrice={formatPrice}
                      t={t}
                    />
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
