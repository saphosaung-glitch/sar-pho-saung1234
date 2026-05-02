import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, Receipt, Clock, CheckCircle2, Package, MapPin, Phone, User, Home, Wallet, Calendar, ArrowRight, MessageCircle, MessageSquare, RotateCcw, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const { orders, estimatedDeliveryTime, supportNumber, cancelOrder, reorder, t, darkMode, formatPrice, getMainName, getSecondaryName } = useStore();
  const navigate = useNavigate();
  
  const order = orders.find(o => o.id === id);
  const orderTime = order ? order.timestamp : 0;
  const isWithin5Minutes = Date.now() - orderTime < 5 * 60 * 1000;
  const isCancellable = isWithin5Minutes && order?.status === 'pending';

  if (!order) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#F8FAFC]'}`}>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-200'}`}>
          <Receipt size={40} className="text-slate-200" />
        </div>
        <h2 className="text-xl font-black mb-2">{t('orderNotFound')}</h2>
        <p className="text-on-surface-variant text-sm mb-8 text-center max-w-xs">{t('orderNotFoundDesc')}</p>
        <button 
          onClick={() => navigate('/orders')}
          className="bg-primary text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          {t('backToOrders')}
        </button>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: t('pending'),
          color: 'text-amber-600',
          bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50',
          icon: <Clock size={16} />,
          border: darkMode ? 'border-amber-500/20' : 'border-amber-100',
          desc: t('orderWaitingConfirmation')
        };
      case 'packing':
        return {
          label: t('packing'),
          color: 'text-blue-600',
          bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
          icon: <Package size={16} />,
          border: darkMode ? 'border-blue-500/20' : 'border-blue-100',
          desc: t('preparingItems')
        };
      case 'delivered':
        return {
          label: t('delivered'),
          color: 'text-emerald-600',
          bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
          icon: <CheckCircle2 size={16} />,
          border: darkMode ? 'border-emerald-500/20' : 'border-emerald-100',
          desc: t('orderDeliveredSuccess')
        };
      case 'cancelled':
        return {
          label: t('cancelled'),
          color: 'text-red-600',
          bg: darkMode ? 'bg-red-500/10' : 'bg-red-50',
          icon: <Receipt size={16} />,
          border: darkMode ? 'border-red-500/20' : 'border-red-100',
          desc: t('orderCancelled')
        };
      default:
        return {
          label: t('pending'),
          color: 'text-gray-600',
          bg: darkMode ? 'bg-surface-container-high' : 'bg-gray-50',
          icon: <Clock size={16} />,
          border: darkMode ? 'border-on-surface/10' : 'border-gray-100',
          desc: t('processingOrder')
        };
    }
  };

  const status = getStatusConfig(order.status);

  const shareOrder = async () => {
    if (!order) return;
    const { formatOrderInquiry, openWhatsApp } = await import('../lib/messaging');
    const message = formatOrderInquiry(order);
    openWhatsApp(supportNumber, message);
  };

  const generateInvoice = async () => {
    if (!order) return;
    
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF();
      const invoiceDate = new Date(order.timestamp).toLocaleDateString();
      const itemsSubtotal = order.items.reduce(
        (acc, item) => acc + item.price * (item.quantity || 1),
        0,
      );

      // --- Header Section ---
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.text("SAR TAW SET", 20, 30);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Grocery & Meat Delivery Service", 20, 38);

      // --- Invoice Details (Top Right) ---
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(11);
      doc.text("INVOICE", 190, 25, { align: "right" });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`#${order.id}`, 190, 35, { align: "right" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Issued: ${invoiceDate}`, 190, 42, { align: "right" });

      // --- Divider ---
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.line(20, 55, 190, 55);

      // --- Meta Info Grid ---
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("BILLED TO", 20, 70);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(order.customerName, 20, 78);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Room ${order.roomNumber}`, 20, 85);
      doc.text(order.customerPhone, 20, 91);
      if (order.address) {
        const splitAddr = doc.splitTextToSize(order.address, 90);
        doc.setFontSize(11);
        doc.text(splitAddr, 20, 98);
      }

      // Payment
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("PAYMENT", 190, 70, { align: "right" });
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(order.paymentMethod.toUpperCase(), 190, 78, { align: "right" });

      // --- Items Table ---
      const itemsData = order.items.map((item) => [
        item.name,
        formatPrice(item.price),
        item.quantity.toString(),
        formatPrice(item.price * (item.quantity || 1)),
      ]);

      autoTable(doc, {
        startY: 115,
        head: [["Description", "Unit Price", "Qty", "Total"]],
        body: itemsData,
        theme: "plain",
        headStyles: {
          fontSize: 11,
          fontStyle: "bold",
          textColor: [100, 100, 100],
          cellPadding: { bottom: 5, top: 0, left: 0, right: 0 },
          lineColor: [200, 200, 200],
          lineWidth: { bottom: 0.5 },
        },
        bodyStyles: {
          fontSize: 12,
          textColor: [0, 0, 0],
          cellPadding: { bottom: 3, top: 3, left: 0, right: 0 },
        },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
      });

      // --- Totals ---
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      const totalsX = 130;
      const amountX = 190;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal", totalsX, finalY);
      doc.setTextColor(0, 0, 0);
      doc.text(formatPrice(itemsSubtotal), amountX, finalY, { align: "right" });

      let nextY = finalY + 8;
      if (order.deliveryFee > 0) {
        doc.setTextColor(100, 100, 100);
        doc.text("Delivery Fee", totalsX, nextY);
        doc.setTextColor(0, 0, 0);
        doc.text(`+${formatPrice(order.deliveryFee)}`, amountX, nextY, { align: "right" });
        nextY += 8;
      }

      if (order.pointDiscount && order.pointDiscount > 0) {
        doc.setTextColor(100, 100, 100);
        doc.text("Discount", totalsX, nextY);
        doc.setTextColor(0, 0, 0);
        doc.text(`-${formatPrice(order.pointDiscount)}`, amountX, nextY, { align: "right" });
        nextY += 8;
      }

      // Grand Total
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount", totalsX, nextY + 5);
      doc.setTextColor(0, 0, 0);
      doc.text(formatPrice(order.totalAmount), amountX, nextY + 5, { align: "right" });

      // Footer
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for shopping with SAR TAW SET!", 105, 280, { align: "center" });

      doc.save(`Invoice_${order.id}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF invoice");
    }
  };

  const handleWhatsApp = async (isSupport: boolean) => {
    const { openWhatsApp } = await import('../lib/messaging');
    const message = isSupport 
      ? `Hello! I need assistance with my order #${order.id}.`
      : `Hello! I would like to request a cancellation for my order #${order.id}.`;
    openWhatsApp(supportNumber, message);
  };

  const handleCancel = () => {
    cancelOrder(order.id);
    setShowCancelModal(false);
  };

  const handleReorder = async () => {
    setIsReordering(true);
    const result = await reorder(order);
    setIsReordering(false);
    
    if (result.success) {
      if (result.message) {
        toast.info(result.message);
      } else {
        toast.success(t('addedToCart'));
      }
      navigate('/checkout');
    } else {
      toast.error(result.message || 'Failed to reorder');
    }
  };

  return (
    <div className={`min-h-screen pb-24 font-sans selection:bg-primary/20 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#F8FAFC]'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b border-on-surface/5 px-4 h-[72px] flex items-center justify-between ${darkMode ? 'bg-surface/80' : 'bg-white/80'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className={`flex-none w-10 h-10 border border-on-surface/10 shadow-sm rounded-full flex items-center justify-center transition-all active:scale-90 touch-manipulation ${darkMode ? 'bg-surface-container-high hover:bg-surface-container-highest' : 'bg-white hover:bg-slate-50'}`}
          >
            <ChevronLeft size={20} className="text-on-surface" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-on-surface tracking-tight leading-tight">{t('orderDetails')}</h2>
            <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">#{order.id}</p>
          </div>
        </div>

        <button 
          onClick={generateInvoice}
          className={`flex items-center justify-center transition-all active:scale-90 p-2 rounded-xl ${darkMode ? 'hover:bg-on-surface/5' : 'hover:bg-slate-50'}`}
          title="Download Invoice PDF"
        >
          <FileText size={22} className="text-primary" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Status Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-[2rem] border ${status.bg} ${status.border} shadow-sm relative overflow-hidden`}
        >
          <div className="relative z-10 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${status.bg} border ${status.border} flex items-center justify-center ${status.color} shadow-inner`}>
              {status.icon}
            </div>
            <div>
              <h3 className={`font-black text-xs uppercase tracking-widest ${status.color}`}>{status.label}</h3>
              <p className="text-[10px] font-medium text-on-surface-variant mt-0.5">{status.desc}</p>
            </div>
          </div>
        </motion.section>

        {/* Delivery Info */}
        <section className={`rounded-[2rem] py-3 px-4 border border-on-surface/5 shadow-sm space-y-2 ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <h3 className="font-black text-on-surface text-[10px] uppercase tracking-widest">{t('deliveryInformation')}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <div className={`flex items-start gap-3 py-2 px-3 rounded-xl border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/40 border flex-shrink-0 ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-100'}`}>
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('deliveryAddress')}</p>
                <p className="text-[10px] font-black text-on-surface leading-relaxed">
                  {order.address ? (
                    <>
                      {order.address}
                      {order.roomNumber && <span className="block text-on-surface-variant/60 mt-0.5">{order.roomNumber}</span>}
                    </>
                  ) : (
                    order.roomNumber
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 py-1.5 px-2 rounded-xl border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/40 border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-100'}`}>
                  <User size={14} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('recipient')}</p>
                  <p className="text-[10px] font-black text-on-surface">{order.customerName}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 py-1.5 px-2 rounded-xl border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/40 border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-100'}`}>
                  <Phone size={14} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('phone')}</p>
                  <p className="text-[10px] font-black text-on-surface">{order.customerPhone}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 py-1.5 px-2 rounded-xl border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/40 border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-100'}`}>
                  <Wallet size={14} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('payment')}</p>
                  <p className="text-[10px] font-black text-on-surface">{order.paymentMethod}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 py-1.5 px-2 rounded-xl border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/40 border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-100'}`}>
                  <Calendar size={14} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('orderDate')}</p>
                  <p className="text-[10px] font-black text-on-surface">
                    {new Date(order.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 py-1.5 px-2 rounded-xl border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/40 border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-100'}`}>
                  <Calendar size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('deliveryDate')}</p>
                  <p className="text-[10px] font-black text-on-surface">
                    {order.deliveryDate || t('pending')}
                    {order.deliveryDay && <span className="ml-1 opacity-60 text-[8px]">({t(order.deliveryDay.toLowerCase())})</span>}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 py-1.5 px-2 rounded-xl border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/40 border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-100'}`}>
                  <Clock size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('estimatedDelivery')}</p>
                  <p className="text-[10px] font-black text-on-surface">{estimatedDeliveryTime}</p>
                </div>
              </div>
            </div>

            {order.note && (
              <div className={`mt-1 flex items-start gap-3 py-2 px-3 rounded-xl border ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500/80' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border ${darkMode ? 'bg-amber-500/20 border-amber-500/20 text-amber-500' : 'bg-white border-amber-100 text-amber-600'}`}>
                  <FileText size={14} />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{t('orderNote') || 'Order Note'}</p>
                  <p className="text-xs font-bold leading-relaxed">{order.note}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Order Items */}
        <section className={`rounded-[2rem] p-6 border border-on-surface/5 shadow-sm ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-primary" />
              <h3 className="font-black text-on-surface text-xs uppercase tracking-widest">{t('orderSummary')}</h3>
            </div>
            <span className={`text-on-surface-variant text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${darkMode ? 'bg-surface-container-highest' : 'bg-slate-100'}`}>
              {order.items.length} {t('items')}
            </span>
          </div>

          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className={`w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border ${darkMode ? 'bg-surface-container-highest border-on-surface/5' : 'bg-slate-50 border-slate-100'}`}>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-xs font-black text-on-surface leading-tight">{getMainName(item)}</h4>
                  <p className="text-[9px] font-bold text-on-surface-variant/60 mt-0.5">{getSecondaryName(item)}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] font-bold text-on-surface-variant">Qty: {item.quantity} {item.unit}</p>
                      <p className="text-xs font-black text-primary">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-on-surface/5 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-on-surface-variant">{t('subtotal')}</p>
              <p className="text-[10px] font-black text-on-surface">{formatPrice(order.total + (order.pointDiscount || 0))}</p>
            </div>
            {order.pointDiscount > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-on-surface-variant">{t('pointDiscount')}</p>
                <p className="text-[10px] font-black text-red-600">-{formatPrice(order.pointDiscount)}</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-on-surface-variant">{t('deliveryFee')}</p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('free')}</p>
            </div>
            <div className="pt-2 flex justify-between items-center">
              <p className="text-sm font-black text-on-surface">{t('totalAmount')}</p>
              <p className="text-lg font-black text-primary">{formatPrice(order.total)}</p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-2 pb-6">
          {/* Left Dynamic Button */}
          {order.status === 'delivered' || order.status === 'cancelled' ? (
            <button
              onClick={handleReorder}
              disabled={isReordering}
              className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-tight shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 ${darkMode ? 'bg-primary text-white shadow-primary/20' : 'bg-emerald-600 text-white shadow-emerald-900/20'}`}
            >
              {isReordering ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              <span className="truncate">{t('reorder')}</span>
            </button>
          ) : isCancellable ? (
            <button 
              onClick={() => setShowCancelModal(true)}
              className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-tight transition-all active:scale-95 border ${darkMode ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
            >
              <span className="truncate">{t('cancelOrder')}</span>
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => handleWhatsApp(false)}
              className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-tight transition-all active:scale-95 flex items-center justify-center gap-1.5 border ${darkMode ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100/50'}`}
            >
              <MessageCircle size={14} className="text-[#25D366]" />
              <span className="truncate">{t('requestCancellation')}</span>
            </button>
          )}

          {/* Right Support Button (Always visible) */}
          <div className={`flex items-center p-1 rounded-xl border ${darkMode ? 'bg-surface-container-high border-on-surface/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button 
              onClick={() => shareOrder()}
              className={`px-3 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 ${darkMode ? 'hover:bg-white/5 text-on-surface' : 'hover:bg-slate-50 text-slate-900'}`}
              title="Share via WhatsApp"
            >
              <MessageCircle size={18} className="text-[#25D366]" />
              <span className="text-[10px] font-black uppercase">WhatsApp</span>
            </button>
          </div>
        </div>
        
        {/* Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`rounded-[2rem] p-6 max-w-sm w-full shadow-2xl ${darkMode ? 'bg-surface-container-high' : 'bg-white'}`}>
              <h3 className="text-lg font-black text-on-surface mb-2">{t('areYouSure')}</h3>
              <p className="text-sm text-on-surface-variant mb-6">{t('cancelOrderConfirm')}</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${darkMode ? 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {t('noKeep')}
                </button>
                <button 
                  onClick={handleCancel}
                  className="py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  {t('yesCancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
