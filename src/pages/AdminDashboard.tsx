import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Product, Order } from '../context/StoreContext';
import { LogOut, Package, Clock, CheckCircle2, LayoutDashboard, ShoppingBag, ListChecks, ChevronRight, MapPin, Settings, Phone, Save, CreditCard, DollarSign, Database, RefreshCw, Plus, Trash2, Sparkles, Image as ImageIcon, Tag, Hash, ShieldCheck, Menu, X, Search, SlidersHorizontal, Eye, Printer, User, Users, Calendar, BarChart3, TrendingUp, PieChart as PieChartIcon, AlertTriangle, Download, Bell, Ticket, History, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { seedDatabase, seedSampleOrders, PRODUCTS } from '../lib/seed';
import { CATEGORIES } from '../constants';
import { collection, getDocs, doc, updateDoc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { translateProductName } from '../services/translationService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

function AnalyticsTab({ orders, products, stats, darkMode, formatPrice, isLowStockAlertEnabled, t }: { 
  orders: Order[], 
  products: Product[],
  stats: any,
  darkMode: boolean, 
  formatPrice: (p: number) => string,
  isLowStockAlertEnabled: boolean,
  t: (key: string) => string
}) {
  const chartData = useMemo(() => {
    const dailyData: Record<string, { date: string, revenue: number, orders: number }> = {};
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += order.total;
        dailyData[dateStr].orders += 1;
      }
    });

    return Object.values(dailyData);
  }, [orders]);

  const analyticsStats = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const totalRevenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);
    const aov = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    
    const cancellationRate = orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0;
    const inventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    
    // Growth calculation (Last 7 days vs Previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const prev7Days = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    const currentPeriodRevenue = orders
      .filter(o => new Date(o.createdAt) >= last7Days)
      .reduce((acc, o) => acc + o.total, 0);
      
    const previousPeriodRevenue = orders
      .filter(o => {
        const d = new Date(o.createdAt);
        return d >= prev7Days && d < last7Days;
      })
      .reduce((acc, o) => acc + o.total, 0);
      
    const growth = previousPeriodRevenue > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    return {
      aov,
      growth,
      cancellationRate,
      inventoryValue,
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length
    };
  }, [orders, products]);

  const topCustomers = useMemo(() => {
    const customers: Record<string, { name: string, orders: number, spent: number }> = {};
    orders.forEach(order => {
      if (!customers[order.customerName]) {
        customers[order.customerName] = { name: order.customerName, orders: 0, spent: 0 };
      }
      customers[order.customerName].orders += 1;
      customers[order.customerName].spent += order.total;
    });
    return Object.values(customers)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }, [orders]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        cats[item.category] = (cats[item.category] || 0) + (item.price * item.quantity);
      });
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string, quantity: number, revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!counts[item.id]) {
          counts[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        counts[item.id].quantity += item.quantity;
        counts[item.id].revenue += item.price * item.quantity;
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [orders]);

  const peakHours = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;
    
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    
    return Object.entries(hours).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }));
  }, [orders]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        
        {/* Main Stats - Compact */}
        <div className="lg:col-span-4 xl:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t('pending'), value: stats.pending, color: 'amber', icon: Clock },
            { label: t('packing'), value: stats.packing, color: 'blue', icon: Package },
            { label: t('delivered'), value: stats.delivered, color: 'emerald', icon: CheckCircle2 },
            { label: 'Low Stock', value: stats.lowStock, color: 'red', icon: AlertTriangle }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-[1.5rem] border transition-all duration-300 ${
                darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${
                darkMode ? 'bg-white/5 text-primary' : `bg-${stat.color}-50 text-${stat.color}-600`
              }`}>
                <stat.icon size={16} />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{stat.label}</p>
              <p className={`text-xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue & Growth - Highlighted */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border flex flex-col justify-between relative overflow-hidden ${
            darkMode ? 'bg-primary/10 border-primary/20' : 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-200'
          }`}
        >
          <div className="relative z-10">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${darkMode ? 'text-primary' : 'text-emerald-100'}`}>Total Revenue</p>
            <h3 className="text-3xl font-black tracking-tighter mb-2">{formatPrice(stats.totalRevenue)}</h3>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                analyticsStats.growth >= 0 
                  ? darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {analyticsStats.growth >= 0 ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                {Math.abs(analyticsStats.growth).toFixed(1)}%
              </div>
              <span className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-emerald-100/60'}`}>vs last week</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <DollarSign size={120} />
          </div>
        </motion.div>

        {/* Revenue Chart - Wide Bento */}
        <div className={`md:col-span-2 lg:col-span-3 xl:col-span-4 p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black tracking-tight uppercase tracking-widest">Revenue Flow</h3>
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#161818' : '#fff', 
                    border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AOV & Orders - Small Bento */}
        <div className={`md:col-span-2 lg:col-span-1 xl:col-span-2 p-6 rounded-[2rem] border grid grid-cols-2 gap-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex flex-col justify-center">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Avg. Order</p>
            <h4 className="text-lg font-black tracking-tight">{formatPrice(analyticsStats.aov)}</h4>
          </div>
          <div className="flex flex-col justify-center">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Total Orders</p>
            <h4 className="text-lg font-black tracking-tight">{analyticsStats.totalOrders}</h4>
          </div>
          <div className="flex flex-col justify-center">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Cancel Rate</p>
            <h4 className={`text-lg font-black tracking-tight ${analyticsStats.cancellationRate > 10 ? 'text-rose-500' : ''}`}>
              {analyticsStats.cancellationRate.toFixed(1)}%
            </h4>
          </div>
          <div className="flex flex-col justify-center">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Stock Value</p>
            <h4 className="text-lg font-black tracking-tight">{formatPrice(analyticsStats.inventoryValue)}</h4>
          </div>
        </div>

        {/* Top Products - List Bento */}
        <div className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
          <h3 className="text-xs font-black tracking-widest uppercase mb-6">Top Products</h3>
          <div className="space-y-4">
            {topProducts.slice(0, 4).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    idx < 3 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-xs truncate max-w-[100px]">{product.name}</span>
                </div>
                <span className="font-black text-xs">{product.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Pie - Square Bento */}
        <div className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
          <h3 className="text-xs font-black tracking-widest uppercase mb-4">Categories</h3>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[8px] font-bold uppercase opacity-60">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers - List Bento */}
        <div className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
          <h3 className="text-xs font-black tracking-widest uppercase mb-6">Top Customers</h3>
          <div className="space-y-4">
            {topCustomers.map((customer, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    {customer.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-xs truncate max-w-[80px]">{customer.name}</p>
                    <p className="text-[8px] font-bold opacity-40 uppercase">{customer.orders} orders</p>
                  </div>
                </div>
                <span className="font-black text-xs text-primary">{formatPrice(customer.spent)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours - Wide Bento */}
        <div className={`md:col-span-2 lg:col-span-4 xl:col-span-6 p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black tracking-widest uppercase">Peak Ordering Hours</h3>
            <p className="text-[10px] font-bold opacity-40 uppercase">24 Hour Distribution</p>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function OrderDetailModal({ order, isOpen, onClose, darkMode, formatPrice, updateStatus, t }: { 
  order: Order | null, 
  isOpen: boolean, 
  onClose: () => void, 
  darkMode: boolean, 
  formatPrice: (p: number) => string,
  updateStatus: (id: string, s: any) => void,
  t: any 
}) {
  if (!order) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-size: 14px;">${item.quantity} ${item.unit}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px; font-weight: bold;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: -1px; }
            .header p { margin: 5px 0; color: #666; font-size: 14px; }
            .details { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; }
            .details p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background: #f8f8f8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .total-box { margin-top: 30px; padding: 20px; background: #f8f8f8; border-radius: 12px; text-align: right; }
            .total-label { font-size: 14px; color: #666; }
            .total-amount { font-size: 24px; font-weight: 700; color: #0d631b; display: block; }
            .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sar Taw Set</h1>
            <p>Royal Caterer & Grocery</p>
            <p>Order Receipt</p>
          </div>
          <div class="details">
            <div>
              <p><strong>Order ID:</strong> #${order.id.slice(-8).toUpperCase()}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>Payment:</strong> ${order.paymentMethod}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Customer:</strong> ${order.customerName}</p>
              <p><strong>Phone:</strong> ${order.customerPhone}</p>
              <p><strong>Room:</strong> ${order.roomNumber}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-box">
            <span class="total-label">Total Amount</span>
            <span class="total-amount">${formatPrice(order.total)}</span>
          </div>
          <div class="footer">
            <p>Thank you for your patronage!</p>
            <p>This is a computer generated receipt.</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusConfig = {
    pending: { color: 'amber', icon: Clock, label: t('statusPending') },
    packing: { color: 'blue', icon: Package, label: t('statusPacking') },
    delivered: { color: 'emerald', icon: CheckCircle2, label: t('statusDelivered') },
    cancelled: { color: 'rose', icon: X, label: t('statusCancelled') }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col ${
              darkMode ? 'bg-[#121414] border border-white/10' : 'bg-white'
            }`}
          >
            {/* Header Section (Compacted) */}
            <div className={`px-8 py-5 border-b ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${
                    order.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 
                    order.status === 'packing' ? 'bg-blue-500/20 text-blue-500' : 
                    order.status === 'cancelled' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {statusConfig[order.status].label}
                  </div>
                  <h2 className={`text-xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>
                    Order #{order.id.slice(-8).toUpperCase()}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${
                      darkMode 
                        ? 'bg-white/5 hover:bg-primary/20 text-primary border border-white/10' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    <Printer size={16} className="group-hover:scale-110 transition-transform" />
                    <span>Print</span>
                  </button>
                  <button 
                    onClick={onClose} 
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      darkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Section - Scrollable */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Side: Info Summary (Compact) */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Customer & Address Card */}
                  <div className={`p-5 rounded-[2rem] border transition-all duration-300 ${
                    darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-primary/20 text-primary' : 'bg-emerald-100 text-emerald-700'}`}>
                        <User size={16} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Customer & Delivery</span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-lg font-black tracking-tight leading-tight">{order.customerName}</p>
                      <p className="text-xs font-bold opacity-50">{order.customerPhone}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-inherit">
                      <div className="flex gap-3">
                        <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-0.5">Delivery Address</p>
                          <p className="text-xs font-bold leading-relaxed">
                            Room {order.roomNumber}
                            {(order as any).address && <span className="block opacity-70 font-medium mt-1">{(order as any).address}</span>}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Clock size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-0.5">Order & Delivery</p>
                          <p className="text-xs font-bold">
                            {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[10px] font-bold text-primary mt-1">
                            Scheduled: {order.deliveryDay}, {order.deliveryDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <CreditCard size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-0.5">Payment</p>
                          <p className="text-xs font-bold uppercase">{order.paymentMethod}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-5">
                      <a 
                        href={`tel:${order.customerPhone}`}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white border border-gray-100 hover:bg-gray-50 shadow-sm'
                        }`}
                      >
                        Call
                      </a>
                      <a 
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white border border-gray-100 hover:bg-gray-50 shadow-sm'
                        }`}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Side: Items & Actions (Spacious) */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Items List */}
                  <div className={`rounded-[2rem] border overflow-hidden ${darkMode ? 'bg-white/2 border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="px-6 py-4 border-b border-inherit bg-inherit flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Order Items ({order.items.length})</h3>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto no-scrollbar divide-y divide-inherit">
                      {order.items.map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-4 p-4 group hover:bg-primary/5 transition-colors"
                        >
                          <div className="relative shrink-0">
                            <img src={item.image} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white rounded-lg flex items-center justify-center text-[9px] font-black shadow-lg border-2 border-inherit">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-black text-sm mb-0.5 truncate">{item.name}</p>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.unit} • {formatPrice(item.price)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-sm">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {/* Summary Footer (Now below items) */}
                    <div className={`p-6 bg-inherit border-t border-inherit`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">Total Payable</p>
                          <h4 className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-primary' : 'text-emerald-700'}`}>
                            {formatPrice(order.total)}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">Points Earned</p>
                          <p className="text-sm font-black text-amber-500">+{order.earnedPoints || 0} PTS</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Actions (Compact Grid) */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-4">Update Status</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(statusConfig).map(([id, cfg]) => (
                        <button 
                          key={id}
                          onClick={() => updateStatus(order.id, id as any)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                            order.status === id 
                              ? `bg-${cfg.color}-500 text-white shadow-lg shadow-${cfg.color}-500/20` 
                              : darkMode 
                                ? 'bg-white/5 hover:bg-white/10 border border-white/5' 
                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                          }`}
                        >
                          <cfg.icon size={16} className={order.status === id ? 'text-white' : `text-${cfg.color}-500`} />
                          <span className="text-[8px] font-black uppercase tracking-widest">{cfg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function BannerManagement({ banners, add, update, remove, darkMode }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    isActive: true
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await add({
      ...formData,
      type: 'ad',
      tag: 'promo',
      subtitle: '',
      color: 'bg-transparent'
    });
    setShowAdd(false);
    setFormData({ title: '', image: '', isActive: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Ad Banners</h3>
          <p className="text-xs opacity-40 font-bold uppercase tracking-widest">Full-image advertisements for Menu Page</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className={`p-8 rounded-[2.5rem] border space-y-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Banner Title (Internal Reference)</label>
              <input 
                className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} 
                placeholder="e.g. Summer Special Promotion" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Graphic Image URL (Full Image)</label>
              <input 
                className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} 
                placeholder="https://example.com/banner.jpg" 
                value={formData.image} 
                onChange={e => setFormData({...formData, image: e.target.value})} 
                required 
              />
            </div>
          </div>
          <button type="submit" className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}>
            Add Ad Banner
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner: any) => (
          <div key={banner.id} className={`p-0 rounded-[2rem] border relative overflow-hidden h-[150px] ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <img src={banner.image} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
              <button 
                onClick={() => update(banner.id, { isActive: !banner.isActive })}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${banner.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}
              >
                {banner.isActive ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => remove(banner.id)} className="p-2 bg-red-500 text-white rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="absolute bottom-4 left-6 z-10">
              <h4 className="font-black text-white text-sm drop-shadow-md">{banner.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealManagement({ deals, add, update, remove, darkMode, formatPrice }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    type: 'daily-deal',
    title: '',
    titleMm: '',
    originalPrice: '',
    price: '',
    discount: '',
    image: '',
    endTime: '',
    soldCount: 0,
    totalCount: 100,
    description: '',
    descriptionMm: '',
    isActive: true
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await add({
      ...formData,
      originalPrice: Number(formData.originalPrice),
      price: Number(formData.price),
      totalCount: Number(formData.totalCount)
    });
    setShowAdd(false);
    setFormData({ type: 'daily-deal', title: '', titleMm: '', originalPrice: '', price: '', discount: '', image: '', endTime: '', soldCount: 0, totalCount: 100, description: '', descriptionMm: '', isActive: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Daily Deals</h3>
          <p className="text-xs opacity-40 font-bold uppercase tracking-widest">Time-limited special offers</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}>
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className={`p-8 rounded-[2.5rem] border space-y-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Title (EN)</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Title (EN)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Title (MM)</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Title (MM)" value={formData.titleMm} onChange={e => setFormData({...formData, titleMm: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Original Price</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Original Price" type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Sale Price</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Sale Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Image URL</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Discount Text</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="e.g. 20% OFF" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
            </div>
          </div>
          <button type="submit" className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}>
            Add Deal
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal: any) => (
          <div key={deal.id} className={`p-5 rounded-[2rem] border flex gap-4 items-center ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <img src={deal.image} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
            <div className="flex-grow min-w-0">
              <h4 className="font-black text-sm truncate">{deal.title}</h4>
              <p className="text-xs text-primary font-black mt-1">
                {formatPrice(deal.price)} 
                <span className="text-[10px] text-gray-400 line-through ml-2 font-bold">{formatPrice(deal.originalPrice)}</span>
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => update(deal.id, { isActive: !deal.isActive })} 
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${deal.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}
                >
                  {deal.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => remove(deal.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BundleManagement({ bundles, add, update, remove, darkMode, formatPrice }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    titleMm: '',
    description: '',
    descriptionMm: '',
    originalPrice: '',
    price: '',
    image: '',
    items: '',
    isActive: true
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await add({
      ...formData,
      originalPrice: Number(formData.originalPrice),
      price: Number(formData.price),
      items: formData.items.split(',').map(i => i.trim()),
      type: 'bundle'
    });
    setShowAdd(false);
    setFormData({ title: '', titleMm: '', description: '', descriptionMm: '', originalPrice: '', price: '', image: '', items: '', isActive: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Bundles (Combo Packs)</h3>
          <p className="text-xs opacity-40 font-bold uppercase tracking-widest">Grouped products with special pricing</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}>
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className={`p-8 rounded-[2.5rem] border space-y-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Title (EN)</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Title (EN)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Title (MM)</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Title (MM)" value={formData.titleMm} onChange={e => setFormData({...formData, titleMm: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Original Price</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Original Price" type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Sale Price</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Sale Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Image URL</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Included Items (IDs, comma separated)</label>
              <input className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} placeholder="e.g. prod1, prod2" value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} required />
            </div>
          </div>
          <button type="submit" className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}>
            Add Bundle
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle: any) => (
          <div key={bundle.id} className={`p-5 rounded-[2rem] border flex gap-4 items-center ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <img src={bundle.image} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
            <div className="flex-grow min-w-0">
              <h4 className="font-black text-sm truncate">{bundle.title}</h4>
              <p className="text-xs text-primary font-black mt-1">{formatPrice(bundle.price)}</p>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => update(bundle.id, { isActive: !bundle.isActive })} 
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${bundle.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}
                >
                  {bundle.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => remove(bundle.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab({ categories, updateCategory, addCategory, deleteCategory, darkMode, t }: { categories: any[], updateCategory: any, addCategory: any, deleteCategory: any, darkMode: boolean, t: any }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState({ key: '', order: categories.length });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.key) return;
    await addCategory({
      key: newCategory.key,
      isActive: true,
      order: Number(newCategory.order)
    });
    setNewCategory({ key: '', order: categories.length + 1 });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Category Management</h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">Toggle visibility or add new categories</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (window.confirm('This will restore all default categories. Continue?')) {
                try {
                  await seedDatabase();
                  toast.success('Default categories restored');
                } catch (err) {
                  toast.error('Failed to restore categories');
                }
              }
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-white/5 text-on-surface hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <RefreshCw size={16} />
            Restore Defaults
          </button>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-primary/10 text-primary' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}
          >
            {showAdd ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className={`p-8 rounded-[2.5rem] border space-y-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Category Key (Translation Key)</label>
              <input 
                className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} 
                placeholder="e.g. frozen-foods" 
                value={newCategory.key} 
                onChange={e => setNewCategory({...newCategory, key: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Display Order</label>
              <input 
                type="number"
                className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-200 focus:border-emerald-500'}`} 
                value={newCategory.order} 
                onChange={e => setNewCategory({...newCategory, order: Number(e.target.value)})} 
                required 
              />
            </div>
          </div>
          <button type="submit" className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}>
            Add Category
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.filter(c => c.id !== 'all').sort((a, b) => a.order - b.order).map((cat) => (
          <div key={cat.id} className={`p-6 rounded-[2rem] border flex items-center justify-between ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-widest">{t(cat.key)}</h4>
                <p className="text-[10px] opacity-40 font-bold">ID: {cat.id} | Order: {cat.order}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const newOrder = prompt(`Update order for ${t(cat.key)}:`, cat.order.toString());
                  if (newOrder !== null) updateCategory(cat.id, { order: parseInt(newOrder) });
                }}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Update Order"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  cat.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/10'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  cat.isActive ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this category?')) {
                    deleteCategory(cat.id);
                  }
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecialOffersTab({ darkMode, t }: { darkMode: boolean, t: any }) {
  const { 
    deals, addDeal, updateDeal, deleteDeal,
    bundles, addBundle, updateBundle, deleteBundle,
    formatPrice
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'deals' | 'bundles'>('deals');

  return (
    <div className="space-y-8">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'deals', label: 'Daily Deals', icon: Tag },
          { id: 'bundles', label: 'Bundles', icon: Package }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-none flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeSubTab === tab.id
                ? darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white'
                : darkMode ? 'bg-white/5 text-on-surface-variant/60' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'deals' && (
            <DealManagement 
              deals={deals} 
              add={addDeal} 
              update={updateDeal} 
              remove={deleteDeal}
              darkMode={darkMode}
              formatPrice={formatPrice}
            />
          )}
          {activeSubTab === 'bundles' && (
            <BundleManagement 
              bundles={bundles} 
              add={addBundle} 
              update={updateBundle} 
              remove={deleteBundle}
              darkMode={darkMode}
              formatPrice={formatPrice}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AdBannersTab({ darkMode, t }: { darkMode: boolean, t: any }) {
  const { 
    promotionBanners, addPromotionBanner, updatePromotionBanner, deletePromotionBanner
  } = useStore();

  return (
    <div className="space-y-8">
      <BannerManagement 
        banners={promotionBanners} 
        add={addPromotionBanner} 
        update={updatePromotionBanner} 
        remove={deletePromotionBanner}
        darkMode={darkMode}
      />
    </div>
  );
}

import { uploadProductImage } from '../services/uploadService';

function AddProductModal({ 
  isOpen, 
  onClose, 
  addProduct, 
  updateProduct,
  product,
  categories, 
  darkMode, 
  t 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  addProduct: (p: any) => Promise<void>, 
  updateProduct?: (id: string, p: any) => Promise<void>,
  product?: any,
  categories: any[], 
  darkMode: boolean, 
  t: any 
}) {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Saving...');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useAI, setUseAI] = useState(true);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    salePrice: product?.salePrice || '',
    category: product?.category || categories[0]?.id || 'meat',
    unit: product?.unit || '1 kg',
    image: product?.image || '',
    stock: product?.stock || '100',
    description: product?.description || '',
    sku: product?.sku || '',
    weight: product?.weight || '',
    status: product?.status || 'published',
    mmName: product?.mmName || '',
    thName: product?.thName || '',
    zhName: product?.zhName || '',
    msName: product?.msName || ''
  });
  const [showUrlInput, setShowUrlInput] = useState(true);

  // Update form data when product prop changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        salePrice: product.salePrice || '',
        category: product.category || categories[0]?.id || 'meat',
        unit: product.unit || '1 kg',
        image: product.image || '',
        stock: product.stock || '100',
        description: product.description || '',
        sku: product.sku || '',
        weight: product.weight || '',
        status: product.status || 'published',
        mmName: product.mmName || '',
        thName: product.thName || '',
        zhName: product.zhName || '',
        msName: product.msName || ''
      });
    }
  }, [product, categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    console.log("Starting upload for file:", file.name, "size:", file.size);

    try {
      const url = await uploadProductImage(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, image: url }));
      toast.success('Image uploaded successfully');
      setShowUrlInput(false); // Hide URL input if upload succeeds
    } catch (error: any) {
      console.error('Upload error in component:', error);
      toast.error(error.message || 'Failed to upload image');
      // If upload fails, suggest using URL but keep upload option visible
      setShowUrlInput(true);
    } finally {
      setUploading(false);
      // Don't reset progress immediately so user can see it reached 100% or where it stopped
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setLoading(true);
    setLoadingText('Saving product...');
    try {
      let translations = {
        mmName: formData.mmName,
        thName: formData.thName,
        zhName: formData.zhName,
        msName: formData.msName
      };

      if (useAI && !product) { // Only auto-translate for new products
        setLoadingText('Translating product name...');
        const aiTranslations = await translateProductName(formData.name);
        translations = {
          mmName: aiTranslations.mmName || formData.name,
          thName: aiTranslations.thName || formData.name,
          zhName: aiTranslations.zhName || formData.name,
          msName: aiTranslations.msName || formData.name
        };
      }

      const productData = {
        ...formData,
        ...translations,
        price: Number(formData.price),
        stock: Number(formData.stock),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      };

      setLoadingText('Uploading to database...');
      if (product && updateProduct) {
        await updateProduct(product.id, productData);
        toast.success('Product updated successfully!');
      } else {
        await addProduct(productData);
        toast.success('Product added successfully!');
      }
      
      onClose();
      if (!product) {
        setFormData({
          name: '', price: '', salePrice: '', category: categories[0]?.id || 'meat',
          unit: '1 kg', image: '', stock: '100', description: '', sku: '',
          weight: '', status: 'published', mmName: '', thName: '', zhName: '', msName: ''
        });
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product.");
    } finally {
      setLoading(false);
      setLoadingText('Saving...');
    }
  };

  const inputClasses = `w-full px-3 py-2 rounded-lg border font-bold transition-all outline-none text-xs ${
    darkMode 
      ? 'bg-white/5 border-white/10 focus:border-primary/50 text-on-surface' 
      : 'bg-gray-50 border-gray-100 focus:bg-white focus:border-emerald-300 text-emerald-950'
  }`;

  const labelClasses = `text-[9px] font-black uppercase tracking-widest mb-1 block ${
    darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'
  }`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[95vh] overflow-hidden rounded-[2rem] shadow-2xl z-[101] animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-surface-container-high border border-white/5' : 'bg-white'}`}>
          <div className="p-6 overflow-y-auto max-h-[95vh] no-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Dialog.Title className="text-xl font-black tracking-tight">Add Product</Dialog.Title>
                <Dialog.Description className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Premium listing details</Dialog.Description>
              </div>
              <Dialog.Close className="p-1.5 rounded-full hover:bg-black/5 transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs.Root defaultValue="general" className="space-y-4">
                <Tabs.List className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                  {['general', 'pricing', 'translations', 'advanced'].map(tab => (
                    <Tabs.Trigger 
                      key={tab} 
                      value={tab}
                      className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"
                    >
                      {tab}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <Tabs.Content value="general" className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelClasses}>Product Name (English)</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Premium Fuji Apple"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className={inputClasses}
                      >
                        {categories.filter(c => c.id !== 'all').map(category => (
                          <option key={category.id} value={category.id}>{category.name || t(category.key)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Unit</label>
                      <input 
                        type="text" 
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                        placeholder="e.g. 1 kg"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelClasses}>Product Image</label>
                        <button 
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          {showUrlInput ? 'Use Upload' : 'Use Image URL'}
                        </button>
                      </div>
                      
                      {showUrlInput ? (
                        <div className="space-y-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
                          <div className="flex items-center justify-between">
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest">Image URL Mode</p>
                            <button 
                              type="button"
                              onClick={() => setShowUrlInput(false)}
                              className="text-[8px] font-bold opacity-40 hover:opacity-100 underline"
                            >
                              Back to Upload
                            </button>
                          </div>
                          <input 
                            type="url"
                            value={formData.image}
                            onChange={e => setFormData({...formData, image: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                            className={inputClasses}
                          />
                          <div className="flex flex-wrap gap-2">
                            <p className="w-full text-[8px] font-bold opacity-40 uppercase tracking-widest">Quick Sample Images:</p>
                            {[
                              { label: 'Apple', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=400&h=400&fit=crop' },
                              { label: 'Meat', url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop' },
                              { label: 'Veggie', url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c12e8c?w=400&h=400&fit=crop' },
                              { label: 'Milk', url: 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=400&h=400&fit=crop' }
                            ].map(sample => (
                              <button
                                key={sample.label}
                                type="button"
                                onClick={() => setFormData({...formData, image: sample.url})}
                                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase border transition-all ${
                                  formData.image === sample.url 
                                    ? 'bg-primary text-white border-primary' 
                                    : 'bg-white dark:bg-black border-black/10 dark:border-white/10 hover:border-primary/30'
                                }`}
                              >
                                {sample.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className={`flex-grow relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all ${
                            uploading ? 'opacity-50 pointer-events-none' : ''
                          } ${
                            darkMode ? 'border-white/10 hover:border-primary/50' : 'border-gray-200 hover:border-emerald-400'
                          }`}>
                            {formData.image ? (
                              <div className="relative w-full h-32 rounded-lg overflow-hidden group">
                                <img src={formData.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, image: ''})}
                                    className="p-2 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                  <ImageIcon className="text-primary" size={20} />
                                </div>
                                <p className="text-[10px] font-bold text-center">
                                  {uploading ? 'Uploading...' : 'Click or Drag to Upload Product Image'}
                                </p>
                                <p className="text-[8px] opacity-40 mt-1 uppercase tracking-widest">Max size: 10MB</p>
                              </>
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={uploading}
                            />
                          </div>
                          
                          {uploading && (
                            <div className="flex flex-col items-center justify-center w-28 p-3 bg-primary/5 rounded-xl border border-primary/10">
                              <div className="relative w-14 h-14 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle
                                    cx="28"
                                    cy="28"
                                    r="24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-black/5 dark:text-white/5"
                                  />
                                  <circle
                                    cx="28"
                                    cy="28"
                                    r="24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={150.8}
                                    strokeDashoffset={150.8 - (150.8 * uploadProgress) / 100}
                                    className="text-primary transition-all duration-500"
                                  />
                                </svg>
                                <span className="absolute text-[10px] font-black text-primary">{uploadProgress}%</span>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-primary mt-2 animate-pulse">Uploading</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="pricing" className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Regular Price</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Sale Price (Optional)</label>
                      <input 
                        type="number" 
                        value={formData.salePrice}
                        onChange={e => setFormData({...formData, salePrice: e.target.value})}
                        placeholder="0.00"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Stock Quantity</label>
                      <input 
                        type="number" 
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: e.target.value})}
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className={inputClasses}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="translations" className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-primary" size={16} />
                      <div>
                        <p className="text-[10px] font-black">AI Auto-Translation</p>
                        <p className="text-[8px] font-bold opacity-60">Translate to 4 languages automatically</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setUseAI(!useAI)}
                      className={`w-10 h-5 rounded-full relative transition-all ${useAI ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${useAI ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {!useAI && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClasses}>Myanmar (Burmese)</label>
                        <input 
                          type="text" 
                          value={formData.mmName}
                          onChange={e => setFormData({...formData, mmName: e.target.value})}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Thai</label>
                        <input 
                          type="text" 
                          value={formData.thName}
                          onChange={e => setFormData({...formData, thName: e.target.value})}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Chinese (Simplified)</label>
                        <input 
                          type="text" 
                          value={formData.zhName}
                          onChange={e => setFormData({...formData, zhName: e.target.value})}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Malay</label>
                        <input 
                          type="text" 
                          value={formData.msName}
                          onChange={e => setFormData({...formData, msName: e.target.value})}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  )}
                </Tabs.Content>

                <Tabs.Content value="advanced" className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>SKU / Barcode</label>
                      <input 
                        type="text" 
                        value={formData.sku}
                        onChange={e => setFormData({...formData, sku: e.target.value})}
                        placeholder="e.g. APP-001"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Weight / Size</label>
                      <input 
                        type="text" 
                        value={formData.weight}
                        onChange={e => setFormData({...formData, weight: e.target.value})}
                        placeholder="e.g. 500g"
                        className={inputClasses}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClasses}>Product Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Describe your product..."
                        className={`${inputClasses} h-20 resize-none`}
                      />
                    </div>
                  </div>
                </Tabs.Content>
              </Tabs.Root>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || uploading}
                  className={`flex-[2] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50' : 'hover:scale-[1.02] active:scale-[0.98]'} ${darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white'}`}
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  {loading ? loadingText : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function UsersTab({ users, darkMode, updateUserPoints }: { users: any[], darkMode: boolean, updateUserPoints: (uid: string, p: number) => Promise<void> }) {
  const [search, setSearch] = useState('');
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.phone?.includes(search) ||
    u.room?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Customer Management</h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">{users.length} Total Customers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-12 pr-6 py-3 rounded-2xl border w-full md:w-80 font-bold text-sm outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-100 focus:border-emerald-500 shadow-sm'
            }`}
          />
        </div>
      </div>

      <div className={`rounded-[2.5rem] border overflow-hidden ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-50'}`}>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Points</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Tier</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-black text-sm">{user.name || 'Anonymous'}</p>
                        <p className="text-[10px] opacity-40 font-bold">Room: {user.room || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-sm">{user.phone}</p>
                    <p className="text-[10px] opacity-40 font-bold">{user.email || 'No email'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" />
                      <span className="font-black text-sm">{user.points || 0}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      user.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                      user.tier === 'Silver' ? 'bg-gray-100 text-gray-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {user.tier || 'Bronze'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => {
                        const newPoints = prompt('Enter new points:', user.points);
                        if (newPoints !== null) updateUserPoints(user.uid, parseInt(newPoints));
                      }}
                      className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CouponsTab({ coupons, addCoupon, updateCoupon, deleteCoupon, darkMode, formatPrice }: { coupons: any[], addCoupon: any, updateCoupon: any, deleteCoupon: any, darkMode: boolean, formatPrice: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    expiryDate: '',
    usageLimit: 0,
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCoupon(newCoupon);
    setIsAdding(false);
    setNewCoupon({ code: '', type: 'percentage', value: 0, minOrderAmount: 0, maxDiscount: 0, expiryDate: '', usageLimit: 0, isActive: true });
    toast.success('Coupon added successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Coupons & Discounts</h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">{coupons.length} Active Coupons</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
            darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
          }`}
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon.id} className={`p-6 rounded-[2rem] border relative overflow-hidden ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-primary/20 text-primary' : 'bg-emerald-100 text-emerald-700'}`}>
                {coupon.code}
              </div>
              <button 
                onClick={() => deleteCoupon(coupon.id)}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-3xl font-black">
                {coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                <span className="text-sm opacity-40 ml-2 font-bold uppercase tracking-widest">OFF</span>
              </p>
              <p className="text-xs opacity-40 font-bold mt-1">Min. Order: {formatPrice(coupon.minOrderAmount)}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
              <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                Used: {coupon.usageCount || 0} / {coupon.usageLimit || '∞'}
              </div>
              <div className={`w-2 h-2 rounded-full ${coupon.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md p-8 rounded-[2.5rem] ${darkMode ? 'bg-surface-container-high text-on-surface' : 'bg-white text-gray-900'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">New Coupon</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Coupon Code</label>
                  <input
                    required
                    type="text"
                    placeholder="SUMMER20"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                    className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Type</label>
                    <select
                      value={newCoupon.type}
                      onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}
                      className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Value</label>
                    <input
                      required
                      type="number"
                      value={newCoupon.value}
                      onChange={e => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                      className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all mt-4 ${
                    darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Create Coupon
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationsTab({ sendBroadcast, broadcastNotifications, darkMode }: { sendBroadcast: any, broadcastNotifications: any[], darkMode: boolean }) {
  const [isSending, setIsSending] = useState(false);
  const [payload, setPayload] = useState({
    title: '',
    message: '',
    type: 'promotion' as 'promotion' | 'system' | 'update',
    image: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendBroadcast(payload);
    setIsSending(false);
    setPayload({ title: '', message: '', type: 'promotion', image: '' });
    toast.success('Broadcast sent successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Broadcast Notifications</h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">Send messages to all customers</p>
        </div>
        <button 
          onClick={() => setIsSending(true)}
          className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
            darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
          }`}
        >
          <Bell size={18} />
          New Broadcast
        </button>
      </div>

      <div className="space-y-4">
        {broadcastNotifications.map(notif => (
          <div key={notif.id} className={`p-6 rounded-[2rem] border flex gap-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              notif.type === 'promotion' ? 'bg-emerald-100 text-emerald-600' :
              notif.type === 'update' ? 'bg-blue-100 text-blue-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              <Bell size={24} />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-black text-lg">{notif.title}</h4>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  {new Date(notif.createdAt?.seconds * 1000).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm opacity-60 font-medium leading-relaxed">{notif.message}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                  notif.type === 'promotion' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {notif.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isSending && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md p-8 rounded-[2.5rem] ${darkMode ? 'bg-surface-container-high text-on-surface' : 'bg-white text-gray-900'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">Send Broadcast</h3>
                <button onClick={() => setIsSending(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Title</label>
                  <input
                    required
                    type="text"
                    placeholder="New Promotion!"
                    value={payload.title}
                    onChange={e => setPayload({...payload, title: e.target.value})}
                    className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Message</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Get 20% off on all items today..."
                    value={payload.message}
                    onChange={e => setPayload({...payload, message: e.target.value})}
                    className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all resize-none ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Type</label>
                  <select
                    value={payload.type}
                    onChange={e => setPayload({...payload, type: e.target.value as any})}
                    className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <option value="promotion">Promotion</option>
                    <option value="system">System Alert</option>
                    <option value="update">App Update</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all mt-4 ${
                    darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Send to All Users
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductsTab({ products, categories, addProduct, updateProduct, deleteProduct, darkMode, t, formatPrice }: { 
  products: Product[], 
  categories: any[],
  addProduct: any, 
  updateProduct: any, 
  deleteProduct: any, 
  darkMode: boolean, 
  t: any,
  formatPrice: any
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.mmName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const bulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      for (const id of selectedProducts) {
        await deleteProduct(id);
      }
      setSelectedProducts([]);
      toast.success('Bulk delete successful');
    }
  };

  const bulkCategoryChange = async () => {
    const newCat = prompt('Enter new category ID:');
    if (newCat) {
      for (const id of selectedProducts) {
        await updateProduct(id, { category: newCat });
      }
      setSelectedProducts([]);
      toast.success('Bulk category update successful');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Product Catalog</h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">{products.length} Total Items</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-12 pr-6 py-3 rounded-2xl border w-full md:w-64 font-bold text-sm outline-none transition-all ${
                darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-100 focus:border-emerald-500 shadow-sm'
              }`}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-6 py-3 rounded-2xl border font-bold text-sm outline-none transition-all appearance-none min-w-[160px] ${
              darkMode ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-white border-gray-100 focus:border-emerald-500 shadow-sm'
            }`}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name || t(cat.key)}</option>
            ))}
          </select>

          <button 
            onClick={() => { setEditingProduct(null); setIsAdding(true); }}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
              isAdding 
                ? 'bg-rose-500 text-white' 
                : darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
            }`}
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
              darkMode ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest">{selectedProducts.length} Selected</span>
              <button onClick={selectAll} className="text-[10px] font-black uppercase tracking-widest hover:underline">
                {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={bulkCategoryChange}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Change Category
              </button>
              <button 
                onClick={bulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AddProductModal 
        isOpen={isAdding || !!editingProduct} 
        onClose={() => { setIsAdding(false); setEditingProduct(null); }} 
        addProduct={addProduct} 
        updateProduct={updateProduct}
        product={editingProduct}
        categories={categories} 
        darkMode={darkMode} 
        t={t} 
      />

      {/* Product Grid/List */}
      <div className={`rounded-[2.5rem] border overflow-hidden ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-50'}`}>
                <th className="px-8 py-6 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={selectAll}
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 checked:bg-primary"
                  />
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Product</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Category</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Price</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Stock</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`group transition-colors ${selectedProducts.includes(product.id) ? 'bg-primary/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/5'}`}>
                  <td className="px-8 py-5">
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-5 h-5 rounded-lg border-2 border-gray-300 checked:bg-primary"
                    />
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                        <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{product.name}</p>
                        <p className="text-[10px] opacity-40 font-bold">{product.mmName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/5 text-on-surface-variant/60' : 'bg-gray-100 text-gray-500'}`}>
                      {categories.find(c => c.id === product.category)?.name || t(CATEGORIES.find(c => c.id === product.category)?.key || product.category)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className={`font-black text-sm ${product.salePrice ? 'text-rose-500' : ''}`}>
                        {formatPrice(product.salePrice || product.price)}
                      </span>
                      {product.salePrice && (
                        <span className="text-[10px] opacity-40 line-through font-bold">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button
                      onClick={() => updateProduct(product.id, { status: product.status === 'published' ? 'draft' : 'published' })}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        product.status === 'published' 
                          ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                      }`}
                    >
                      {product.status || 'published'}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${product.stock <= 5 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className={`font-black text-sm ${product.stock <= 5 ? 'text-rose-500' : ''}`}>
                        {product.stock} {product.unit}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingProduct(product)}
                        className="p-2 rounded-xl hover:bg-blue-500/10 text-blue-500 transition-colors"
                        title="Edit Product"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => updateProduct(product.id, { isAvailable: !product.isAvailable })}
                        className={`p-2 rounded-xl transition-colors ${product.isAvailable === false ? 'hover:bg-amber-500/10 text-amber-500' : 'hover:bg-emerald-500/10 text-emerald-500'}`}
                        title={product.isAvailable === false ? "Set as Available" : "Set as Sold Out"}
                      >
                        {product.isAvailable === false ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Delete ${product.name}?`)) deleteProduct(product.id);
                        }}
                        className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AuditLogsTab({ auditLogs, darkMode }: { auditLogs: any[], darkMode: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Audit Logs</h2>
        <p className="text-sm opacity-40 font-bold uppercase tracking-widest">Track administrative actions</p>
      </div>

      <div className={`rounded-[2.5rem] border overflow-hidden ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-50'}`}>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Admin</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Action</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Target</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4">
                    <p className="font-black text-sm">{log.adminName}</p>
                    <p className="text-[10px] opacity-40 font-bold">{log.adminId}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      log.action.includes('delete') ? 'bg-red-100 text-red-700' :
                      log.action.includes('add') ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-bold text-sm">{log.target}</p>
                    <p className="text-[10px] opacity-40 font-bold truncate max-w-[200px]">{log.details}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-xs font-bold opacity-60">
                      {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminsTab({ admins, addAdmin, updateAdminRole, removeAdmin, darkMode }: { admins: any[], addAdmin: any, updateAdminRole: any, removeAdmin: any, darkMode: boolean }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ uid: '', email: '', name: '', role: 'staff' as 'superadmin' | 'staff' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAdmin(newAdmin);
    setIsAdding(false);
    setNewAdmin({ uid: '', email: '', name: '', role: 'staff' });
    toast.success('Admin added successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Admin Management</h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">{admins.length} Total Admins</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
            darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
          }`}
        >
          <ShieldCheck size={18} />
          Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map(admin => (
          <div key={admin.uid} className={`p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {admin.role}
              </span>
            </div>
            <h4 className="font-black text-lg">{admin.name || 'Admin User'}</h4>
            <p className="text-sm opacity-40 font-bold mb-6">{admin.email}</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => removeAdmin(admin.uid)}
                className="flex-grow py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-500/10 hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md p-8 rounded-[2.5rem] ${darkMode ? 'bg-surface-container-high text-on-surface' : 'bg-white text-gray-900'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">Add New Admin</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">UID</label>
                  <input
                    required
                    type="text"
                    placeholder="Firebase User UID"
                    value={newAdmin.uid}
                    onChange={e => setNewAdmin({...newAdmin, uid: e.target.value})}
                    className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Email</label>
                  <input
                    required
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={e => setNewAdmin({...newAdmin, role: e.target.value as any})}
                    className={`w-full px-6 py-3 rounded-2xl border font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <option value="staff">Staff</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all mt-4 ${
                    darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Grant Access
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboard() {
  const { 
    orders, updateOrderStatus, 
    supportNumber, setSupportNumber,
    bankName, setBankName,
    bankAccountNumber, setBankAccountNumber,
    bankAccountName, setBankAccountName,
    currency, setCurrency, formatPrice,
    darkMode, t,
    isDeliveryEnabled, setIsDeliveryEnabled,
    isLowStockAlertEnabled, setIsLowStockAlertEnabled,
    cutoffTime, setCutoffTime,
    estimatedDeliveryTime, setEstimatedDeliveryTime,
    signInWithGoogle, authUid, userEmail,
    users, updateUserPoints,
    coupons, addCoupon, updateCoupon, deleteCoupon,
    auditLogs, logAudit,
    broadcastNotifications, sendBroadcast,
    admins, addAdmin, updateAdminRole, removeAdmin,
    isAdmin, categories, updateCategory, addCategory, deleteCategory,
    products, addProduct, updateProduct, deleteProduct
  } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'market' | 'products' | 'banners' | 'special-offers' | 'categories' | 'settings' | 'analytics' | 'users' | 'coupons' | 'notifications' | 'audit' | 'admins'>('analytics');
  const [isHovered, setIsHovered] = useState(false);
  const [tempSupportNumber, setTempSupportNumber] = useState(supportNumber);
  const [tempCutoffTime, setTempCutoffTime] = useState(cutoffTime);
  const [tempEstimatedDeliveryTime, setTempEstimatedDeliveryTime] = useState(estimatedDeliveryTime);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [tempBankDetails, setTempBankDetails] = useState({ name: bankName, number: bankAccountNumber, accountName: bankAccountName });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  
  // Real-time Notification for new orders
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(1));
    let initialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (initialLoad) {
        initialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newOrder = change.doc.data() as Order;
          toast.success(`New Order from ${newOrder.customerName}!`, {
            description: `Room ${newOrder.roomNumber} - ${formatPrice(newOrder.total)}`,
            action: {
              label: 'View',
              onClick: () => {
                setSelectedOrder({ ...newOrder, id: change.doc.id });
                setIsOrderModalOpen(true);
              }
            }
          });
          
          // Play notification sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
      });
    });

    return () => unsubscribe();
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin-login');
  };

  // Keyboard listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleSeed = async () => {
    setIsSeeding(true);
    await seedDatabase();
    setIsSeeding(false);
    alert('Database seeded!');
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    // Migration logic
    setIsMigrating(false);
    alert('Migration complete!');
  };

  // Market List Logic: Auto-Sum total weight/quantity of each product
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const marketListByDate = useMemo(() => {
    const grouped: Record<string, Record<string, { id: string; name: string; total: number; unit: string }>> = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      if (!grouped[date]) grouped[date] = {};
      order.items.forEach(item => {
        if (!grouped[date][item.id]) {
          grouped[date][item.id] = { id: item.id, name: item.name, total: 0, unit: t('oneKg') };
        }
        grouped[date][item.id].total += item.quantity;
      });
    });
    return grouped;
  }, [orders, t]);

  React.useEffect(() => {
    const dates = Object.keys(marketListByDate);
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [marketListByDate, selectedDate]);

  const stats = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      packing: orders.filter(o => o.status === 'packing').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + o.total, 0),
      lowStock: products.filter(p => p.stock <= 5).length
    };
  }, [orders, products]);

  return (
    <div className={`min-h-screen font-sans flex transition-all duration-500 ${darkMode ? 'bg-[#0c0e0e] text-on-surface' : 'bg-[#f8faf9]'}`}>
      <Toaster position="top-right" theme={darkMode ? 'dark' : 'light'} richColors />
      
      <OrderDetailModal 
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        darkMode={darkMode}
        formatPrice={formatPrice}
        updateStatus={updateOrderStatus}
        t={t}
      />

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        onMouseEnter={() => !isMenuOpen && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ 
          width: (isMenuOpen || isHovered) ? 280 : 72,
          boxShadow: (isHovered && !isMenuOpen) ? '20px 0 50px rgba(0,0,0,0.1)' : 'none'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 flex-shrink-0 overflow-hidden ${darkMode ? 'bg-[#0c0e0e] border-r border-white/5' : 'bg-white border-r border-gray-100'}`}
      >
        <div className="w-full h-full flex flex-col py-4">
          {/* Menu Toggle & Logo Area */}
          <div className="flex items-center h-12 px-4 mb-4">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
            >
              <Menu size={20} />
            </button>
            {(isMenuOpen || isHovered) && (
              <div className="flex items-center gap-3 ml-4 overflow-hidden whitespace-nowrap">
                <h1 className={`text-lg font-black tracking-tighter ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>စားတော်ဆက်</h1>
              </div>
            )}
          </div>

          {/* Gmail-style "Compose" Button with Popover */}
          <div className="px-2 mb-6">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className={`flex items-center gap-4 h-14 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl ${
                  (isMenuOpen || isHovered) ? 'w-full px-6' : 'w-12 mx-auto px-0 justify-center'
                } ${darkMode ? 'bg-surface-container-highest text-primary' : 'bg-white text-emerald-700 border border-gray-100'}`}>
                  <Plus size={24} strokeWidth={2.5} />
                  {(isMenuOpen || isHovered) && <span className="font-bold text-sm whitespace-nowrap">Create New</span>}
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content 
                  side="right" 
                  align="start" 
                  sideOffset={10}
                  className={`z-[60] w-56 rounded-2xl p-2 shadow-xl border ${darkMode ? 'bg-[#161818] border-white/10' : 'bg-white border-gray-100'}`}
                >
                  <div className="space-y-1">
                    {[
                      { icon: Package, label: 'New Product', action: () => console.log('New Product') },
                      { icon: Ticket, label: 'New Coupon', action: () => console.log('New Coupon') },
                      { icon: Bell, label: 'Broadcast', action: () => console.log('Broadcast') },
                      { icon: User, label: 'New Admin', action: () => console.log('New Admin') },
                    ].map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                          darkMode ? 'text-on-surface hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <Popover.Arrow className={darkMode ? 'fill-[#161818]' : 'fill-white'} />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          {/* Navigation Items */}
          <nav className="flex-grow px-2 space-y-6 overflow-y-auto no-scrollbar pb-6">
            <div>
              {(isMenuOpen || isHovered) && <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40">Features</p>}
              {[
                { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                { id: 'orders', icon: LayoutDashboard, label: t('orders') },
                { id: 'market', icon: ListChecks, label: t('marketList') },
                { id: 'products', icon: Package, label: t('products') },
                { id: 'categories', icon: SlidersHorizontal, label: 'Categories' },
                { id: 'users', icon: Users, label: 'Customers' },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center h-11 rounded-full transition-all duration-200 group relative mb-1 ${
                    activeTab === item.id 
                      ? darkMode 
                        ? 'bg-primary/15 text-primary' 
                        : 'bg-emerald-50 text-emerald-700' 
                      : darkMode 
                        ? 'text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-900'
                  } ${ (isMenuOpen || isHovered) ? 'px-6 gap-4' : 'px-0 justify-center' }`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'text-current' : ''} />
                  {(isMenuOpen || isHovered) && <span className="font-bold text-xs whitespace-nowrap">{item.label}</span>}
                  {!isMenuOpen && !isHovered && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                      {item.label}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div>
              {(isMenuOpen || isHovered) && <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40">Marketing</p>}
              {[
                { id: 'banners', icon: ImageIcon, label: 'Ad Banners' },
                { id: 'special-offers', icon: Tag, label: 'Special Offers' },
                { id: 'coupons', icon: Ticket, label: 'Coupons' },
                { id: 'notifications', icon: Bell, label: 'Broadcast' },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center h-11 rounded-full transition-all duration-200 group relative mb-1 ${
                    activeTab === item.id 
                      ? darkMode 
                        ? 'bg-primary/15 text-primary' 
                        : 'bg-emerald-50 text-emerald-700' 
                      : darkMode 
                        ? 'text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-900'
                  } ${ (isMenuOpen || isHovered) ? 'px-6 gap-4' : 'px-0 justify-center' }`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'text-current' : ''} />
                  {(isMenuOpen || isHovered) && <span className="font-bold text-xs whitespace-nowrap">{item.label}</span>}
                  {!isMenuOpen && !isHovered && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                      {item.label}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div>
              {(isMenuOpen || isHovered) && <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40">System</p>}
              {[
                { id: 'settings', icon: Settings, label: t('settings') },
                { id: 'audit', icon: History, label: 'Audit Logs' },
                { id: 'admins', icon: ShieldCheck, label: 'Admins' },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center h-11 rounded-full transition-all duration-200 group relative mb-1 ${
                    activeTab === item.id 
                      ? darkMode 
                        ? 'bg-primary/15 text-primary' 
                        : 'bg-emerald-50 text-emerald-700' 
                      : darkMode 
                        ? 'text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-900'
                  } ${ (isMenuOpen || isHovered) ? 'px-6 gap-4' : 'px-0 justify-center' }`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'text-current' : ''} />
                  {(isMenuOpen || isHovered) && <span className="font-bold text-xs whitespace-nowrap">{item.label}</span>}
                  {!isMenuOpen && !isHovered && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                      {item.label}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Logout at bottom */}
          <div className="px-2 pt-4 border-t border-gray-100 dark:border-white/5">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center h-12 rounded-full transition-all duration-200 group relative ${
                darkMode ? 'text-red-400/60 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
              } ${ (isMenuOpen || isHovered) ? 'px-6 gap-4' : 'px-0 justify-center' }`}
            >
              <LogOut size={20} />
              {(isMenuOpen || isHovered) && <span className="font-bold text-sm whitespace-nowrap">{t('logout')}</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        animate={{ 
          marginLeft: isMenuOpen ? 280 : 72 
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-grow overflow-y-auto max-h-screen no-scrollbar"
      >
        {/* Header */}
        <header className={`sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 py-3 border-b ${darkMode ? 'bg-[#0c0e0e]/80 backdrop-blur-md border-white/5' : 'bg-white/80 backdrop-blur-md border-gray-100'}`}>
          <div className="flex items-center gap-4 flex-grow max-w-3xl">
            {/* Gmail-style Search Bar */}
            <div className="relative flex-grow">
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                darkMode ? 'bg-surface-container-high/60 focus-within:bg-surface-container-high focus-within:shadow-lg' : 'bg-gray-100 focus-within:bg-white focus-within:shadow-lg focus-within:ring-1 focus-within:ring-emerald-100'
              }`}>
                <Search className={darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'} size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchOrders')}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium"
                />
                <button className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-200'}`}>
                  <SlidersHorizontal size={16} className={darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-8">
            {/* Real-time Status Indicator */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>

            <button className={`relative p-2.5 rounded-xl transition-all ${
              darkMode ? 'hover:bg-white/5 text-on-surface-variant/60' : 'hover:bg-gray-100 text-gray-500'
            }`}>
              <Bell size={20} />
              {stats.pending > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0c0e0e]" />
              )}
            </button>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-transform hover:scale-105 cursor-pointer ${
              darkMode ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {auth.currentUser?.email?.[0].toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8">

        {/* Low Stock Alerts */}
        {isLowStockAlertEnabled && stats.lowStock > 0 && activeTab === 'analytics' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-6 rounded-[2.5rem] border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
              darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className={`text-xl font-black tracking-tight ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Low Stock Alert</h3>
                <p className={`text-xs font-bold ${darkMode ? 'text-red-400/60' : 'text-red-600/60'}`}>
                  {stats.lowStock} products are running low on inventory.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {products.filter(p => p.stock <= 5).map(p => (
                <span key={p.id} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  darkMode ? 'bg-white/5 border-white/10 text-red-400' : 'bg-white border-red-100 text-red-600'
                }`}>
                  {p.name}: {p.stock} {p.unit}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <div className="flex items-center gap-3 mb-6">
            <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Real-time Analytics</h2>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
              darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalyticsTab 
                orders={orders} 
                products={products}
                stats={stats}
                darkMode={darkMode} 
                formatPrice={formatPrice} 
                isLowStockAlertEnabled={isLowStockAlertEnabled}
                t={t}
              />
            </motion.div>
          ) : activeTab === 'orders' ? (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('orderManagement')}</h2>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                    darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Live Sync</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const headers = ['Order ID', 'Customer', 'Room', 'Total', 'Status', 'Date'];
                    const csvContent = [
                      headers.join(','),
                      ...orders.map(o => [
                        o.id,
                        o.customerName,
                        o.roomNumber,
                        o.total,
                        o.status,
                        new Date(o.createdAt).toLocaleString()
                      ].join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                    darkMode ? 'bg-white/5 text-on-surface-variant/60 hover:bg-white/10' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { id: 'all', label: t('all'), color: 'bg-gray-500' },
                  { id: 'pending', label: t('statusPending'), color: 'bg-amber-500' },
                  { id: 'packing', label: t('statusPacking'), color: 'bg-blue-500' },
                  { id: 'delivered', label: t('statusDelivered'), color: 'bg-emerald-500' },
                  { id: 'cancelled', label: t('statusCancelled'), color: 'bg-rose-500' }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setStatusFilter(chip.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${
                      statusFilter === chip.id
                        ? `${chip.color} text-white border-transparent shadow-lg shadow-${chip.color.split('-')[1]}-500/20`
                        : darkMode
                          ? 'bg-white/5 border-white/10 text-on-surface-variant/60 hover:bg-white/10'
                          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === chip.id ? 'bg-white' : chip.color}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{chip.label}</span>
                    {statusFilter === chip.id && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[8px] font-black">
                        {orders.filter(o => chip.id === 'all' ? true : o.status === chip.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      order.status === 'pending' 
                        ? darkMode ? 'bg-amber-950/10 border-amber-900/30' : 'bg-amber-50/50 border-amber-100'
                        : darkMode ? 'bg-surface-container-high/40 border-white/5' : 'bg-white border-gray-100'
                    } hover:shadow-md cursor-pointer`}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsOrderModalOpen(true);
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      order.status === 'pending' ? 'bg-amber-500' : 
                      order.status === 'packing' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />
                    
                    <div className="flex-grow flex items-center gap-6 overflow-hidden">
                      <div className={`w-40 font-bold text-sm truncate ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>
                        {order.customerName}
                      </div>
                      <div className={`flex-grow text-sm truncate ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>
                        <span className="font-bold mr-2">#{order.roomNumber}</span>
                        {order.items.map(item => item.name).join(', ')}
                      </div>
                      <div className={`w-28 text-right font-black text-sm ${darkMode ? 'text-primary' : 'text-emerald-700'}`}>
                        {formatPrice(order.total)}
                      </div>
                      <div className="w-24 text-right text-[10px] font-bold opacity-40">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Contextual Actions (Gmail style) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-4">
                      {[
                        { id: 'pending', icon: Clock, color: 'text-amber-500' },
                        { id: 'packing', icon: Package, color: 'text-blue-500' },
                        { id: 'delivered', icon: CheckCircle2, color: 'text-emerald-500' }
                      ].map((btn) => (
                        <button 
                          key={btn.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, btn.id as any);
                          }}
                          title={t(btn.id)}
                          className={`p-2 rounded-lg transition-all ${
                            order.status === btn.id 
                              ? darkMode ? 'bg-white/10 ' + btn.color : 'bg-gray-100 ' + btn.color
                              : darkMode ? 'hover:bg-white/10 text-on-surface-variant/40' : 'hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          <btn.icon size={18} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )) : (
                  <div className={`rounded-[3rem] p-24 text-center border border-dashed transition-all duration-500 ${darkMode ? 'bg-surface-container-high/20 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <ShoppingBag size={32} className="opacity-20" />
                    </div>
                    <p className={`text-lg font-bold ${darkMode ? 'text-on-surface-variant/30' : 'text-gray-400'}`}>{t('noOrdersYet')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'market' ? (
            <motion.div 
              key="market"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {selectedDate && marketListByDate[selectedDate] ? (
                // Detail View
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedDate(null)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{selectedDate}</h2>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`px-6 py-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('totalItems')}</p>
                        <p className={`text-xl font-black ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{Object.keys(marketListByDate[selectedDate]).length}</p>
                      </div>
                    </div>
                    <button className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}>
                      {t('printList')}
                    </button>
                  </div>

                  <div className={`rounded-[3rem] p-10 border overflow-hidden ${darkMode ? 'bg-surface-container-high/40 border-white/5' : 'bg-white border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]'}`}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">#</th>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('itemName')}</th>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('totalWeightQty')}</th>
                          <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.values(marketListByDate[selectedDate]) as { id: string; name: string; total: number; unit: string }[]).map((item, i) => (
                          <tr key={item.id} className={`border-b last:border-0 transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <td className={`py-6 px-4 text-sm font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>{i + 1}</td>
                            <td className={`py-6 px-4 font-bold ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{item.name}</td>
                            <td className={`py-6 px-4 font-black text-right ${darkMode ? 'text-primary' : 'text-emerald-700'}`}>{item.total} {item.unit}</td>
                            <td className="py-6 px-4 text-center">
                              <input type="checkbox" className={`w-5 h-5 rounded-lg border-2 ${darkMode ? 'border-white/20 checked:bg-primary' : 'border-gray-200 checked:bg-emerald-600'}`} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // Overview Page
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('marketList')}</h2>
                    <div className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ${darkMode ? 'bg-white/5 text-on-surface-variant/60' : 'bg-gray-50 text-gray-500'}`}>
                      {Object.keys(marketListByDate).length} {t('days')}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(marketListByDate).map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`group p-8 rounded-[2rem] border text-left transition-all hover:scale-[1.02] ${darkMode ? 'bg-white/5 border-white/5 hover:border-primary/20' : 'bg-white border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:border-emerald-200'}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`font-black text-xl ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{date}</h4>
                          <ChevronRight className={`transition-transform group-hover:translate-x-1 ${darkMode ? 'text-primary' : 'text-emerald-600'}`} size={20} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-primary' : 'text-emerald-600'}`}>
                          {Object.keys(marketListByDate[date]).length} {t('items')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'products' ? (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProductsTab 
                products={products}
                categories={categories}
                addProduct={addProduct}
                updateProduct={updateProduct}
                deleteProduct={deleteProduct}
                darkMode={darkMode}
                t={t}
                formatPrice={formatPrice}
              />
            </motion.div>
          ) : activeTab === 'banners' ? (
            <motion.div key="banners" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div>
                <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>Ad Banners</h2>
                <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Manage full-image advertisements</p>
              </div>
              <AdBannersTab darkMode={darkMode} t={t} />
            </motion.div>
          ) : activeTab === 'special-offers' ? (
            <motion.div key="special-offers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div>
                <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>Special Offers</h2>
                <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Manage daily deals and product bundles</p>
              </div>
              <SpecialOffersTab darkMode={darkMode} t={t} />
            </motion.div>
          ) : activeTab === 'categories' ? (
            <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <CategoriesTab categories={categories} updateCategory={updateCategory} addCategory={addCategory} deleteCategory={deleteCategory} darkMode={darkMode} t={t} />
            </motion.div>
          ) : activeTab === 'users' ? (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UsersTab users={users} darkMode={darkMode} updateUserPoints={updateUserPoints} />
            </motion.div>
          ) : activeTab === 'coupons' ? (
            <motion.div 
              key="coupons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CouponsTab coupons={coupons} addCoupon={addCoupon} updateCoupon={updateCoupon} deleteCoupon={deleteCoupon} darkMode={darkMode} formatPrice={formatPrice} />
            </motion.div>
          ) : activeTab === 'notifications' ? (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <NotificationsTab sendBroadcast={sendBroadcast} broadcastNotifications={broadcastNotifications} darkMode={darkMode} />
            </motion.div>
          ) : activeTab === 'audit' ? (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AuditLogsTab auditLogs={auditLogs} darkMode={darkMode} />
            </motion.div>
          ) : activeTab === 'admins' ? (
            <motion.div 
              key="admins"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminsTab admins={admins} addAdmin={addAdmin} updateAdminRole={updateAdminRole} removeAdmin={removeAdmin} darkMode={darkMode} />
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>{t('generalSettings')}</h2>
                  <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>System configuration and maintenance</p>
                </div>
              </div>

              <div className={`rounded-[3rem] p-12 border transition-all duration-500 ${darkMode ? 'bg-surface-container-high/40 border-white/5' : 'bg-white border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  {/* Left Column */}
                  <div className="space-y-12">
                    {/* Currency Settings */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Currency Settings</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Active currency for the application</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        {['RM', 'MMK'].map((curr) => (
                          <button
                            key={curr}
                            onClick={() => setCurrency(curr as any)}
                            className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 border ${
                              currency === curr
                                ? darkMode ? 'bg-primary text-surface border-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100 scale-[1.02]'
                                : darkMode ? 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {curr === 'RM' ? 'Malaysia (RM)' : 'Myanmar (MMK)'}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Delivery Service Settings */}
                    <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('deliveryService')}</h4>
                            <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('deliveryServiceDesc')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => authUid && setIsDeliveryEnabled(!isDeliveryEnabled)}
                          disabled={!authUid}
                          className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                            !authUid ? 'opacity-50 cursor-not-allowed bg-gray-300' :
                            isDeliveryEnabled ? 'bg-emerald-500' : (darkMode ? 'bg-white/10' : 'bg-gray-200')
                          }`}
                        >
                          <motion.div 
                            animate={{ x: isDeliveryEnabled ? 28 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-7 h-7 bg-white rounded-full shadow-xl" 
                          />
                        </button>
                      </div>

                      {/* Cutoff Time and Estimated Delivery Time Settings */}
                      {authUid && (
                        <div className="space-y-6 mb-8">
                          <div className="flex flex-col gap-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>
                              Order Cut-off Time
                            </label>
                            <div className="flex gap-3">
                              <input 
                                type="time"
                                value={tempCutoffTime}
                                onChange={(e) => setTempCutoffTime(e.target.value)}
                                className={`flex-grow border rounded-2xl px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'}`}
                              />
                              <button 
                                onClick={() => {
                                  setCutoffTime(tempCutoffTime);
                                  alert('Cut-off time updated successfully!');
                                }}
                                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}
                              >
                                <Save size={16} />
                                {t('save')}
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>
                              Estimated Delivery Time
                            </label>
                            <div className="flex gap-3">
                              <input 
                                type="text"
                                value={tempEstimatedDeliveryTime}
                                onChange={(e) => setTempEstimatedDeliveryTime(e.target.value)}
                                placeholder="e.g. 8:00 AM - 10:00 AM"
                                className={`flex-grow border rounded-2xl px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'}`}
                              />
                              <button 
                                onClick={() => {
                                  setEstimatedDeliveryTime(tempEstimatedDeliveryTime);
                                  alert('Estimated delivery time updated successfully!');
                                }}
                                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}
                              >
                                <Save size={16} />
                                {t('save')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!authUid ? (
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck size={18} className="text-amber-500" />
                            <h5 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-500' : 'text-amber-700'}`}>{t('authRequired')}</h5>
                          </div>
                          <p className={`text-[10px] font-bold mb-4 leading-relaxed ${darkMode ? 'text-on-surface-variant/60' : 'text-amber-600'}`}>
                            {t('authRequiredDesc')}
                          </p>
                          <button 
                            onClick={signInWithGoogle}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest text-gray-600"
                          >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" referrerPolicy="no-referrer" />
                            {t('signInWithGoogle')}
                          </button>
                        </div>
                      ) : (
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black ${darkMode ? 'bg-primary' : 'bg-emerald-600'}`}>
                              {auth.currentUser?.email?.[0].toUpperCase()}
                            </div>
                            <div>
                              <h5 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>{t('signedInAsAdmin')}</h5>
                              <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-emerald-600'}`}>{auth.currentUser?.email}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Low Stock Alert Settings */}
                    <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-red-400' : 'bg-red-50 text-red-600'}`}>
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Low Stock Alerts</h4>
                            <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Show warnings when inventory is low</p>
                          </div>
                        </div>
                        <button
                          onClick={() => authUid && setIsLowStockAlertEnabled(!isLowStockAlertEnabled)}
                          disabled={!authUid}
                          className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                            !authUid ? 'opacity-50 cursor-not-allowed bg-gray-300' :
                            isLowStockAlertEnabled ? 'bg-emerald-500' : (darkMode ? 'bg-white/10' : 'bg-gray-200')
                          }`}
                        >
                          <motion.div 
                            animate={{ x: isLowStockAlertEnabled ? 28 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-7 h-7 bg-white rounded-full shadow-xl" 
                          />
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-12">
                    {/* Support Number */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Phone size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('whatsappSupportNumber')}</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('whatsappSupportNumberDesc')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="relative flex-grow">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className={`font-black text-sm ${darkMode ? 'text-on-surface-variant/30' : 'text-gray-400'}`}>+</span>
                          </div>
                          <input 
                            type="text"
                            value={tempSupportNumber}
                            onChange={(e) => setTempSupportNumber(e.target.value)}
                            className={`w-full border rounded-2xl pl-10 pr-6 py-5 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'}`}
                            placeholder="e.g. 601128096366"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            setSupportNumber(tempSupportNumber);
                            alert(t('supportNumberUpdated'));
                          }}
                          className={`px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}
                        >
                          <Save size={16} />
                          {t('save')}
                        </button>
                      </div>
                    </section>

                    {/* Bank Details */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('bankTransferSettings')}</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('bankTransferSettingsDesc')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: t('bankName'), value: tempBankDetails.name, key: 'name', placeholder: 'e.g. Maybank' },
                          { label: t('accountName'), value: tempBankDetails.accName, key: 'accName', placeholder: 'e.g. SAPHOSAUNG GROCERY' }
                        ].map((field) => (
                          <div key={field.key} className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-3 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{field.label}</label>
                            <input 
                              type="text"
                              value={field.value}
                              onChange={(e) => setTempBankDetails({ ...tempBankDetails, [field.key]: e.target.value })}
                              className={`w-full border rounded-2xl px-6 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50'}`}
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                        <div className="md:col-span-2 space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-3 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('accountNumber')}</label>
                          <input 
                            type="text"
                            value={tempBankDetails.accNum}
                            onChange={(e) => setTempBankDetails({ ...tempBankDetails, accNum: e.target.value })}
                            className={`w-full border rounded-2xl px-6 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50'}`}
                            placeholder="e.g. 1234 5678 9012"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setBankName(tempBankDetails.name);
                          setBankAccountNumber(tempBankDetails.accNum);
                          setBankAccountName(tempBankDetails.accName);
                          alert(t('bankDetailsUpdated'));
                        }}
                        className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${darkMode ? 'bg-primary text-surface shadow-primary/20 hover:bg-primary/90' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'}`}
                      >
                        <Save size={16} />
                        {t('updateBankDetails')}
                      </button>
                    </section>

                    {/* Database Tools */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                          <Database size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Database Tools</h4>
                          <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Maintenance and data management</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={handleSeed}
                          disabled={isSeeding}
                          className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                            isSeeding ? 'opacity-50 cursor-not-allowed' : ''
                          } ${darkMode ? 'bg-amber-600 text-white shadow-amber-900/20 hover:bg-amber-500' : 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'}`}
                        >
                          <Database size={16} className={isSeeding ? 'animate-bounce' : ''} />
                          {isSeeding ? 'Seeding...' : 'Seed Data'}
                        </button>
                        <button 
                          onClick={handleMigrate}
                          disabled={isMigrating}
                          className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                            isMigrating ? 'opacity-50 cursor-not-allowed' : ''
                          } ${darkMode ? 'bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-500' : 'bg-blue-500 text-white shadow-blue-100 hover:bg-blue-600'}`}
                        >
                          <RefreshCw size={16} className={isMigrating ? 'animate-spin' : ''} />
                          {isMigrating ? 'Migrating...' : 'Run Migration'}
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}
