import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Product, Order } from '../context/StoreContext';
import OrdersTab from '../components/admin/OrdersTab';
import { LogOut, Package, Clock, CheckCircle2, LayoutDashboard, ShoppingBag, ListChecks, ChevronRight, MapPin, Settings, Phone, Save, CreditCard, DollarSign, Database, RefreshCw, Plus, Trash2, Sparkles, Image as ImageIcon, Tag, Hash, ShieldCheck, Menu, X, Search, SlidersHorizontal, Eye, Printer, User, Users, Calendar, BarChart3, TrendingUp, PieChart as PieChartIcon, AlertTriangle, Download, Bell, Ticket, History, MessageSquare, ToggleLeft, ToggleRight, FileText, KeyRound, Moon, Sun, Truck } from 'lucide-react';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  updateStatus: (id: string, s: any) => Promise<void>,
  t: any 
}) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  if (!order) return null;

  const handleStatusUpdate = async (id: string, status: any) => {
    setIsUpdating(status);
    try {
      await updateStatus(id, status);
    } catch (e) {
      console.error("Status update error:", e);
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePrint = (format: 'a4' | 'thermal') => {
    console.log('handlePrint called with format:', format);
    // To bypass sandbox restrictions where iframes and window.open are blocked or have cross-origin errors,
    // we inject the print layout directly into the DOM, hide everything else via print CSS, trigger print, then clean up.
    const itemsSubtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    
    // Add print-specific styles
    const styleEl = document.createElement('style');
    styleEl.id = 'print-style';

    let printHtml = '';

    if (format === 'thermal') {
      const itemsHtml = order.items.map(item => `
        <tr>
          <td style="padding: 4px 0; font-size: 11px;">
            ${item.name}<br>
            <span style="font-size: 9px; color: #555;">${item.quantity} x ${formatPrice(item.price)}</span>
          </td>
          <td style="padding: 4px 0; text-align: right; font-size: 11px; vertical-align: top;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `).join('');

      styleEl.innerHTML = `
        @media print {
          body > *:not(#print-container) { display: none !important; }
          #print-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          @page { size: 58mm auto; margin: 0; }
          .thermal-print-body { font-family: monospace; margin: 0 auto; padding: 2mm; width: 54mm; max-width: 58mm; color: #000; -webkit-font-smoothing: antialiased; }
          .thermal-header { text-align: center; margin-bottom: 12px; }
          .thermal-header h1 { margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase; }
          .thermal-header p { margin: 2px 0; font-size: 10px; color: #333; }
          .thermal-divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .thermal-details { font-size: 10px; margin-bottom: 12px; }
          .thermal-details p { margin: 3px 0; display: flex; justify-content: space-between; }
          .thermal-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .thermal-table th { text-align: left; padding-bottom: 6px; border-bottom: 1px dashed #000; font-size: 10px; text-transform: uppercase; }
          .thermal-table th.right { text-align: right; }
          .thermal-totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; font-weight: bold; }
          .thermal-total-final { font-size: 15px; font-weight: bold; padding-top: 6px; border-top: 1px dashed #000; margin-top: 6px; }
          .thermal-footer { text-align: center; margin-top: 20px; font-size: 10px; color: #333; }
        }
        @media screen {
          #print-container { display: none !important; }
        }
      `;

      printHtml = `
        <div class="thermal-print-body">
          <div class="thermal-header">
            <h1>Sar Taw Set</h1>
            <p>Fresh Grocery & Meat</p>
            <p>Mandalay, Myanmar</p>
          </div>
          <div class="thermal-details">
            <p><span>Order:</span><span>#${order.id.slice(-8).toUpperCase()}</span></p>
            <p><span>Date:</span><span>${new Date(order.createdAt).toLocaleDateString()}</span></p>
            <p><span>Customer:</span><span>${order.customerName}</span></p>
            <p><span>Room:</span><span>${order.roomNumber}</span></p>
            ${order.paymentMethod ? `<p><span>Pay:</span><span style="text-transform: uppercase;">${order.paymentMethod}</span></p>` : ''}
            ${order.address ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dotted #ccc;">
              <strong style="display:block; margin-bottom: 2px;">Address:</strong>
              <span style="line-height: 1.3;">${order.address}</span>
            </div>` : ''}
            ${order.note ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dotted #ccc;">
              <strong style="display:block; margin-bottom: 2px;">Note:</strong>
              <span style="line-height: 1.3;">${order.note}</span>
            </div>` : ''}
          </div>
          <div class="thermal-divider"></div>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="thermal-divider"></div>
          <div class="thermal-totals-row">
            <span>Subtotal</span>
            <span>${formatPrice(itemsSubtotal)}</span>
          </div>
          ${order.pointDiscount > 0 ? `
            <div class="thermal-totals-row" style="font-weight: normal;">
              <span>Points Disc.</span>
              <span>-${formatPrice(order.pointDiscount)}</span>
            </div>
          ` : ''}
          ${order.deliveryFee > 0 ? `
            <div class="thermal-totals-row" style="font-weight: normal;">
              <span>Delivery Fee</span>
              <span>+${formatPrice(order.deliveryFee)}</span>
            </div>
          ` : ''}
          <div class="thermal-totals-row thermal-total-final">
            <span>Total</span>
            <span>${formatPrice(order.total)}</span>
          </div>
          <div class="thermal-footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </div>
      `;
    } else {
      const itemsHtml = order.items.map(item => `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
            <div style="font-weight: 600; font-size: 13px; color: #111827;">${item.name}</div>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #6b7280; font-size: 13px;">${formatPrice(item.price)}</td>
          <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #6b7280; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111827; font-size: 13px;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `).join('');

      styleEl.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @media print {
          body > *:not(#print-container) { display: none !important; }
          #print-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4; margin: 15mm; }
          body { background: white; margin: 0; padding: 0; width: 100%; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
          
          .a4-print-body { padding: 0; margin: 0; color: #374151; }
          .invoice-box { width: 100%; max-width: 100%; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f3f4f6; padding-bottom: 40px; margin-bottom: 40px; }
          .brand h1 { margin: 0; font-size: 28px; font-weight: 700; color: #000; letter-spacing: -0.5px; }
          .brand p { margin: 4px 0 0; color: #6b7280; font-size: 13px; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #666; }
          .invoice-title p { margin: 8px 0 0; font-size: 20px; font-weight: 600; color: #000; font-family: monospace; }
          .meta-grid { display: flex; justify-content: space-between; margin-bottom: 50px; }
          .meta-section { width: 45%; }
          .meta-section h3 { margin: 0 0 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #666; }
          .meta-section p { margin: 0 0 4px; font-size: 14px; color: #000; font-weight: 500; }
          .meta-section .sub-text { font-size: 13px; color: #6b7280; font-weight: 400; margin-top: 4px; }
          .a4-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .a4-table th { text-align: left; padding: 0 0 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #ccc; }
          .a4-table th.right { text-align: right; }
          
          .totals-container { display: flex; justify-content: flex-end; }
          .totals-table { width: 320px; }
          .a4-totals-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 13px; color: #4b5563; border-bottom: 1px solid #f3f4f6; }
          .a4-totals-row.discount { color: #000; }
          .a4-totals-row.delivery { color: #000; }
          .a4-totals-row.final { border-bottom: none; border-top: 2px solid #000; padding-top: 20px; margin-top: 8px; color: #000; font-size: 16px; font-weight: 700; align-items: center; }
          .final-amount { font-size: 28px; letter-spacing: -1px; }
          
          .a4-footer { margin-top: 80px; padding-top: 30px; border-top: 1px solid #f3f4f6; color: #666; font-size: 12px; text-align: center; }
        }
        @media screen {
          #print-container { display: none !important; }
        }
      `;

      printHtml = `
        <div class="a4-print-body">
          <div class="invoice-box">
            <div class="invoice-header">
              <div class="brand">
                <h1>Sar Taw Set</h1>
                <p>Fresh Grocery & Meat Delivery</p>
                <p>Mandalay, Myanmar</p>
              </div>
              <div class="invoice-title">
                <h2>Invoice</h2>
                <p>#${order.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            
            <div class="meta-grid">
              <div class="meta-section">
                <h3>Billed To</h3>
                <p>${order.customerName}</p>
                <div class="sub-text">Room ${order.roomNumber}</div>
                ${order.address ? `<div class="sub-text" style="line-height: 1.4;">${order.address}</div>` : ''}
              </div>
              <div class="meta-section" style="text-align: right;">
                <h3>Invoice Details</h3>
                <div style="display: flex; justify-content: space-between; max-width: 250px; margin-left: auto; margin-bottom: 8px;">
                  <span class="sub-text">Date Of Issue:</span>
                  <span style="font-weight: 500; font-size: 13px;">${invoiceDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; max-width: 250px; margin-left: auto; margin-bottom: 8px;">
                  <span class="sub-text">Phone:</span>
                  <span style="font-weight: 500; font-size: 13px;">${order.customerPhone}</span>
                </div>
                <div style="display: flex; justify-content: space-between; max-width: 250px; margin-left: auto;">
                  <span class="sub-text">Payment Method:</span>
                  <span style="font-weight: 500; font-size: 13px; text-transform: uppercase;">${order.paymentMethod}</span>
                </div>
              </div>
            </div>

            ${order.note ? `
            <div style="margin-top: -10px; margin-bottom: 40px;">
              <h3 style="margin: 0 0 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #666;">Customer Note</h3>
              <div style="padding: 16px; border: 1px dashed #ccc; font-size: 13px; color: #000; font-style: italic;">
                "${order.note}"
              </div>
            </div>
            ` : ''}

            <table class="a4-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="right">Unit Price</th>
                  <th class="right">Qty</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals-container">
              <div class="totals-table">
                <div class="a4-totals-row">
                  <span>Subtotal</span>
                  <span style="font-weight: 600; color: #000;">${formatPrice(itemsSubtotal)}</span>
                </div>
                ${order.pointDiscount > 0 ? `
                  <div class="a4-totals-row discount">
                    <span>Points Discount</span>
                    <span style="font-weight: 600;">-${formatPrice(order.pointDiscount)}</span>
                  </div>
                ` : ''}
                ${order.deliveryFee > 0 ? `
                  <div class="a4-totals-row delivery">
                    <span>Delivery Fee</span>
                    <span style="font-weight: 600;">+${formatPrice(order.deliveryFee)}</span>
                  </div>
                ` : ''}
                <div class="a4-totals-row final">
                  <span>Amount Due</span>
                  <span class="final-amount">${formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div class="a4-footer">
              <p>Thank you for your business. For any inquiries, please contact our support.</p>
            </div>
          </div>
        </div>
      `;
    }

    printContainer.innerHTML = printHtml;
    document.head.appendChild(styleEl);
    document.body.appendChild(printContainer);

    // Call print immediately
    window.print();

    // Clean up after print dialog has captured the page
    setTimeout(() => {
      try {
        if (styleEl && document.head.contains(styleEl)) {
          document.head.removeChild(styleEl);
        }
        if (printContainer && document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }, 1000);
  };

  const statusConfig = {
    pending: { color: 'amber', icon: Clock, label: t('statusPending'), bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50', border: 'border-amber-100', dark: 'bg-amber-500/10' },
    packing: { color: 'blue', icon: Package, label: t('statusPacking'), bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-100', dark: 'bg-blue-500/10' },
    delivered: { color: 'emerald', icon: CheckCircle2, label: t('statusDelivered'), bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-100', dark: 'bg-emerald-500/10' },
    cancelled: { color: 'rose', icon: X, label: t('statusCancelled'), bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50', border: 'border-rose-100', dark: 'bg-rose-500/10' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 lg:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row ${
              darkMode ? 'bg-[#0f1111] border border-white/5' : 'bg-[#fdfdfd]'
            }`}
          >
            {/* Left Side: Order Info & Status (Compact vertical bar) */}
            <div className={`lg:w-[280px] shrink-0 flex flex-col border-r ${darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
              {/* Top Banner with ID */}
              <div className="px-6 py-3 pb-0.5">
                <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 ${
                  order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
                  order.status === 'packing' ? 'bg-blue-500/10 text-blue-500' : 
                  order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === 'pending' ? 'bg-amber-500' : order.status === 'packing' ? 'bg-blue-500' : order.status === 'cancelled' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  {statusConfig[order.status].label}
                </div>
                <h2 className={`text-2xl font-black tracking-tighter mb-1 ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>
                  #{order.id.slice(-6).toUpperCase()}
                </h2>
                <div className="flex items-center gap-2 opacity-40">
                  <Calendar size={10} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Scrollable Details */}
              <div className="flex-grow overflow-y-auto no-scrollbar p-4 pt-1 space-y-2.5">
                {/* Customer Section */}
                <section>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1.5 ml-1">Customer</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-white/5 text-primary' : 'bg-white shadow-sm text-emerald-700'}`}>
                        <User size={14} />
                      </div>
                      <div>
                        <p className="font-black text-sm tracking-tight leading-tight mb-0.5">{order.customerName}</p>
                        <p className={`text-[9px] font-bold font-mono opacity-50`}>{order.customerPhone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-white/5 text-primary' : 'bg-white shadow-sm text-emerald-700'}`}>
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5 leading-none">Location</p>
                        <p className="font-bold text-xs tracking-tight">Room {order.roomNumber}</p>
                        {order.address && (
                          <p className={`text-[9px] font-medium mt-0.5 leading-relaxed opacity-60`}>{order.address}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-white/5 text-primary' : 'bg-white shadow-sm text-emerald-700'}`}>
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5 leading-none">Payment</p>
                        <p className="font-bold text-xs tracking-tight uppercase">{order.paymentMethod}</p>
                      </div>
                    </div>

                    {order.paymentMethod.toLowerCase().includes('bank') && (
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-white/5 text-primary' : 'bg-white shadow-sm text-emerald-700'}`}>
                          <ImageIcon size={14} />
                        </div>
                        <div className="flex-grow">
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1 leading-none">Screenshot</p>
                          {order.paymentScreenshot ? (
                            <button 
                              onClick={() => window.open(order.paymentScreenshot, '_blank')}
                              className="group relative w-full h-20 rounded-xl overflow-hidden border border-dashed border-inherit bg-black/5 hover:bg-black/10 transition-all"
                            >
                              <img 
                                src={order.paymentScreenshot} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                alt="Payment Screenshot"
                              />
                            </button>
                          ) : (
                            <div className={`w-full py-2 px-2 rounded-xl border border-dashed text-center ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                              <p className="text-[8px] font-bold opacity-30 italic">No upload</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Delivery schedule */}
                <section>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1.5 ml-1">Schedule</p>
                  <div className={`px-3 py-2.5 rounded-xl border border-dashed ${darkMode ? 'bg-primary/5 border-primary/20' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Clock size={12} className="text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">{order.deliveryDay}</span>
                    </div>
                    <p className="text-[10px] font-bold opacity-80">{order.deliveryDate}</p>
                  </div>
                </section>

                {/* Quick Comms */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all hover:scale-[1.02] ${
                      darkMode ? 'bg-white/5 hover:bg-white/10 text-on-surface' : 'bg-white text-emerald-950 shadow-sm border border-gray-100'
                    }`}
                  >
                    <Phone size={12} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Call</span>
                  </a>
                  <a 
                    href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all hover:scale-[1.02] ${
                      darkMode ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-[#e7f9ee] text-[#128C7E] shadow-sm border border-[#25D366]/20'
                    }`}
                  >
                    <MessageSquare size={12} />
                    <span className="text-[7px] font-black uppercase tracking-widest">WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Status Actions at bottom of sidebar */}
              <div className={`p-3 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleStatusUpdate(order.id, 'packing')}
                    disabled={isUpdating !== null}
                    className={`h-10 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest ${
                      order.status === 'packing' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : darkMode 
                          ? 'bg-white/5 text-white/40 hover:bg-white/10' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    } ${isUpdating === 'packing' ? 'opacity-50' : ''}`}
                  >
                    {isUpdating === 'packing' ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Package size={12} />
                    )}
                    Ready
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    disabled={isUpdating !== null}
                    className={`h-10 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest ${
                      order.status === 'delivered' 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                        : darkMode 
                          ? 'bg-white/5 text-white/40 hover:bg-white/10' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    } ${isUpdating === 'delivered' ? 'opacity-50' : ''}`}
                  >
                    {isUpdating === 'delivered' ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                    Done
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Items List & Total Summary */}
            <div className={`flex-grow flex flex-col min-w-0 ${darkMode ? 'bg-transparent' : 'bg-white'}`}>
              {/* Header Content */}
              <div className="px-6 py-2.5 flex items-center justify-between relative border-b border-inherit">
                <div>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mb-0.5">Invoice Details</h3>
                  <p className="text-base font-black truncate max-w-md">Order Summary • {order.customerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                        darkMode ? 'bg-white shadow-xl text-black hover:bg-gray-200' : 'bg-emerald-950 text-white shadow-xl hover:bg-emerald-900'
                      }`}
                    >
                      <Printer size={14} />
                      Print
                      <ChevronRight size={10} className={`${isPrintMenuOpen ? '-rotate-90' : 'rotate-90'} opacity-50`} />
                    </button>
                    {isPrintMenuOpen && (
                      <div className={`absolute right-0 mt-2 w-44 p-1.5 rounded-xl shadow-2xl z-[150] border ${
                        darkMode ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-100'
                      }`}>
                        <button
                          onClick={() => { console.log('A4 button clicked'); setIsPrintMenuOpen(false); handlePrint('a4'); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                            darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-emerald-50 text-emerald-950'
                          }`}
                        >
                          <FileText size={14} className={darkMode ? 'text-white/50' : 'text-emerald-700/50'} />
                          A4 Invoice
                        </button>
                        <button
                          onClick={() => { console.log('Thermal button clicked'); setIsPrintMenuOpen(false); handlePrint('thermal'); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                            darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-emerald-50 text-emerald-950'
                          }`}
                        >
                          <Ticket size={14} className={darkMode ? 'text-white/50' : 'text-emerald-700/50'} />
                          Thermal Receipt
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={onClose}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      darkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Items List (Scrollable) */}
              <div className="flex-grow overflow-y-auto px-6 no-scrollbar py-3">
                <div className="space-y-2 pb-4">
                  {order.items.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-300 ${
                        darkMode ? 'bg-white/2 border-white/5 hover:bg-white/5' : 'bg-white border-gray-100 hover:border-emerald-100 shadow-sm'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-500">
                          <img src={item.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary text-white rounded-full flex items-center justify-center text-[7px] font-black shadow-lg border-2 border-surface">
                          {item.quantity}
                        </div>
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/10 text-on-surface-variant' : 'bg-emerald-100/50 text-emerald-800'}`}>
                            {item.unit || 'Unit'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black tracking-tight truncate leading-none mb-1">{item.name}</h4>
                        <div className="flex items-center gap-1 opacity-50">
                          <Tag size={10} />
                          <span className="text-[9px] font-bold">{formatPrice(item.price)} each</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mb-0.5 leading-none">Subtotal</p>
                        <p className="text-base font-black tracking-tighter leading-none">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Order total footer */}
              <div className={`px-6 py-2 border-t mt-auto ${darkMode ? 'border-white/5 bg-white/[0.01]' : 'border-gray-100 bg-gray-50/30'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-2">
                    {order.note && (
                      <div className="max-w-md">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1">Note from Customer</p>
                        <p className="text-xs font-bold opacity-70 leading-relaxed italic line-clamp-1">"{order.note}"</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(order.id, 'pending')}
                        disabled={isUpdating !== null}
                        className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                          order.status === 'pending' ? 'bg-amber-500 text-white shadow-lg' : darkMode ? 'bg-white/5 text-white/30 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-900'
                        } ${isUpdating === 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUpdating === 'pending' && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Keep on Hold
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        disabled={isUpdating !== null}
                        className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent flex items-center gap-2 ${
                          order.status === 'cancelled' ? 'bg-rose-600 text-white shadow-lg' : 'text-rose-500/40 hover:text-rose-500 border-rose-500/10 hover:bg-rose-500/5'
                        } ${isUpdating === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUpdating === 'cancelled' && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Cancel
                      </button>
                    </div>
                  </div>                  <div className="text-right min-w-[200px]">
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center justify-between gap-4 opacity-40">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Subtotal</span>
                        <span className="text-[10px] font-bold font-mono">{formatPrice(order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                      </div>
                      
                      {order.deliveryFee > 0 && (
                        <div className={`flex items-center justify-between gap-4 px-2 py-1 rounded-lg border border-dashed ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                          <div className="flex items-center gap-1">
                            <Truck size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Delivery Fee</span>
                          </div>
                          <span className="text-[10px] font-black">+{formatPrice(order.deliveryFee)}</span>
                        </div>
                      )}
                      
                      {order.pointDiscount > 0 && (
                        <div className={`flex items-center justify-between gap-4 px-2 py-1 rounded-lg border border-dashed ${darkMode ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                          <div className="flex items-center gap-1">
                            <Sparkles size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Points Disc.</span>
                          </div>
                          <span className="text-[10px] font-black">-{formatPrice(order.pointDiscount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between border-t border-dashed pt-2 mt-2 gap-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                        <Sparkles size={9} className="animate-pulse" />
                        <span className="text-[7px] font-black uppercase tracking-widest">+{order.earnedPoints || 0} PTS</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30 mb-0.5">Final Amount</p>
                        <h4 className={`text-2xl font-black tracking-tighter leading-none ${darkMode ? 'text-primary' : 'text-emerald-950'}`}>
                          {formatPrice(order.total)}
                        </h4>
                      </div>
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

function BannerManagement({ banners, add, update, remove, darkMode, globalSearch }: any) {
  const filteredBanners = banners.filter((b: any) => {
    const s = globalSearch?.toLowerCase() || '';
    return (b.title?.toLowerCase().includes(s) || b.description?.toLowerCase().includes(s));
  });

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
        {filteredBanners.map((banner: any) => (
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

function DealManagement({ deals, add, update, remove, darkMode, formatPrice, globalSearch }: any) {
  const filteredDeals = deals.filter((d: any) => {
    const s = globalSearch?.toLowerCase() || '';
    return (d.title?.toLowerCase().includes(s) || d.titleMm?.toLowerCase().includes(s) || d.discount?.toLowerCase().includes(s));
  });

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
        {filteredDeals.map((deal: any) => (
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

function BundleManagement({ bundles, add, update, remove, darkMode, formatPrice, globalSearch }: any) {
  const filteredBundles = bundles.filter((b: any) => {
    const s = globalSearch?.toLowerCase() || '';
    return (b.title?.toLowerCase().includes(s) || b.titleMm?.toLowerCase().includes(s) || b.description?.toLowerCase().includes(s));
  });

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
        {filteredBundles.map((bundle: any) => (
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

function CategoriesTab({ categories, updateCategory, addCategory, deleteCategory, darkMode, t, globalSearch }: { categories: any[], updateCategory: any, addCategory: any, deleteCategory: any, darkMode: boolean, t: any, globalSearch?: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState({ key: '', order: categories.length });

  const filteredCategories = categories.filter(c => {
    const s = globalSearch?.toLowerCase() || '';
    return c.key.toLowerCase().includes(s) || t(c.key).toLowerCase().includes(s);
  });

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
        {filteredCategories.filter(c => c.id !== 'all').sort((a, b) => a.order - b.order).map((cat) => (
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

function SpecialOffersTab({ darkMode, t, globalSearch }: { darkMode: boolean, t: any, globalSearch?: string }) {
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
              globalSearch={globalSearch}
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
              globalSearch={globalSearch}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AdBannersTab({ darkMode, t, globalSearch }: { darkMode: boolean, t: any, globalSearch?: string }) {
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
        globalSearch={globalSearch}
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

function UsersTab({ users, darkMode, updateUserPoints, globalSearch }: { users: any[], darkMode: boolean, updateUserPoints: (uid: string, p: number) => Promise<void>, globalSearch?: string }) {
  const filteredUsers = users.filter(u => {
    const s = globalSearch?.toLowerCase() || '';
    return u.name?.toLowerCase().includes(s) || 
           u.phone?.includes(s) ||
           u.room?.includes(s) ||
           u.id?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Customer Management</h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">{users.length} Total Customers</p>
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
                  <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={async () => {
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        if (confirm(`Generate reset code for ${user.phone}?`)) {
                          try {
                            // uid is the sanitized phone number here, but let's double check it. Wait, uid is the doc id
                            await updateDoc(doc(db, 'users', user.uid), { resetCode: code });
                            prompt(`Reset Code Generated. Copy and send this to the user:`, code);
                          } catch (e) {
                            alert("Failed to generate code.");
                          }
                        }
                      }}
                      className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-amber-500/10 text-amber-500' : 'hover:bg-amber-100 text-amber-600'}`}
                      title="Generate Reset Password Code"
                    >
                      <KeyRound size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        const newPoints = prompt('Enter new points:', user.points);
                        if (newPoints !== null) updateUserPoints(user.uid, parseInt(newPoints));
                      }}
                      className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                      title="Edit Points"
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

function CouponsTab({ coupons, addCoupon, updateCoupon, deleteCoupon, darkMode, formatPrice, globalSearch }: { coupons: any[], addCoupon: any, updateCoupon: any, deleteCoupon: any, darkMode: boolean, formatPrice: any, globalSearch?: string }) {
  const filteredCoupons = coupons.filter(c => {
    const s = globalSearch?.toLowerCase() || '';
    return c.code.toLowerCase().includes(s);
  });

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
        {filteredCoupons.map(coupon => (
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

function NotificationsTab({ sendBroadcast, broadcastNotifications, darkMode, globalSearch }: { sendBroadcast: any, broadcastNotifications: any[], darkMode: boolean, globalSearch?: string }) {
  const filteredNotifications = broadcastNotifications.filter(n => {
    const s = globalSearch?.toLowerCase() || '';
    return n.title?.toLowerCase().includes(s) || n.message?.toLowerCase().includes(s);
  });

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
        {filteredNotifications.map(notif => (
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

function ProductsTab({ products, categories, addProduct, updateProduct, deleteProduct, darkMode, t, formatPrice, globalSearch }: { 
  products: Product[], 
  categories: any[],
  addProduct: any, 
  updateProduct: any, 
  deleteProduct: any, 
  darkMode: boolean, 
  t: any,
  formatPrice: any,
  globalSearch?: string
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => {
    const s = globalSearch?.toLowerCase() || '';
    const matchesSearch = p.name.toLowerCase().includes(s) || 
                         p.mmName.toLowerCase().includes(s);
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

function AuditLogsTab({ auditLogs, darkMode, globalSearch }: { auditLogs: any[], darkMode: boolean, globalSearch?: string }) {
  const filteredLogs = auditLogs.filter(log => {
    const s = globalSearch?.toLowerCase() || '';
    return log.adminName?.toLowerCase().includes(s) || 
           log.action?.toLowerCase().includes(s) || 
           log.target?.toLowerCase().includes(s) ||
           log.details?.toLowerCase().includes(s);
  });

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
              {filteredLogs.map((log) => (
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

function AdminsTab({ admins, addAdmin, updateAdminRole, removeAdmin, darkMode, globalSearch }: { admins: any[], addAdmin: any, updateAdminRole: any, removeAdmin: any, darkMode: boolean, globalSearch?: string }) {
  const filteredAdmins = admins.filter(admin => {
    const s = globalSearch?.toLowerCase() || '';
    return admin.name?.toLowerCase().includes(s) || admin.email?.toLowerCase().includes(s);
  });

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
        {filteredAdmins.map(admin => (
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
    adminOrders: orders, updateOrderStatus, 
    supportNumber, setSupportNumber,
    bankName, setBankName,
    bankAccountNumber, setBankAccountNumber,
    bankAccountName, setBankAccountName,
    currency, setCurrency, formatPrice,
    darkMode, setDarkMode, t,
    isDeliveryEnabled, setIsDeliveryEnabled,
    deliveryFee, setDeliveryFee,
    isLowStockAlertEnabled, setIsLowStockAlertEnabled,
    isMaintenanceMode, updateMaintenanceMode,
    cutoffTime, setCutoffTime,
    isBankEnabled, setIsBankEnabled,
    estimatedDeliveryTime, setEstimatedDeliveryTime,
    signInWithGoogle, authUid, userEmail,
    users, updateUserPoints,
    coupons, addCoupon, updateCoupon, deleteCoupon,
    auditLogs, logAudit,
    broadcastNotifications, sendBroadcast,
    admins, addAdmin, updateAdminRole, removeAdmin,
    isAdmin, categories, updateCategory, addCategory, deleteCategory,
    products, addProduct, updateProduct, deleteProduct,
    isQuotaExceeded, resetQuotaExceeded
  } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'market' | 'products' | 'banners' | 'special-offers' | 'categories' | 'settings' | 'analytics' | 'users' | 'coupons' | 'notifications' | 'audit' | 'admins'>('analytics');
  const [tempSupportNumber, setTempSupportNumber] = useState(supportNumber);
  const [tempCutoffTime, setTempCutoffTime] = useState(cutoffTime);
  const [tempEstimatedDeliveryTime, setTempEstimatedDeliveryTime] = useState(estimatedDeliveryTime);
  const [tempDeliveryFee, setTempDeliveryFee] = useState(deliveryFee || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [tempBankDetails, setTempBankDetails] = useState({ name: bankName, number: bankAccountNumber, accountName: bankAccountName });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState({ start: '', end: '' });

  // Sync selected order with latest order data from context to reflect status changes immediately
  useEffect(() => {
    if (selectedOrder && isOrderModalOpen) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder && (updatedOrder.status !== selectedOrder.status || updatedOrder.paymentScreenshot !== selectedOrder.paymentScreenshot)) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, isOrderModalOpen, selectedOrder]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    if (selectedDateFilter.start) result = result.filter(o => new Date(o.createdAt).toISOString().split('T')[0] >= selectedDateFilter.start);
    if (selectedDateFilter.end) result = result.filter(o => new Date(o.createdAt).toISOString().split('T')[0] <= selectedDateFilter.end);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.customerName.toLowerCase().includes(q) || 
        o.id.toLowerCase().includes(q) ||
        o.roomNumber.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q)
      );
    }
    
    return result;
  }, [orders, statusFilter, selectedDateFilter, searchQuery]);
  
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
  }, [isAdmin]);
  
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
  const marketListOrders = useMemo(() => {
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
    marketListOrders.forEach(order => {
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
        animate={{ 
          width: isMenuOpen ? 280 : 88,
          boxShadow: isMenuOpen ? '20px 0 50px rgba(0,0,0,0.1)' : 'none'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 flex-shrink-0 overflow-hidden ${darkMode ? 'bg-[#0c0e0e]/80 backdrop-blur-xl border-r border-white/5' : 'bg-white/80 backdrop-blur-xl border-r border-gray-100'}`}
      >
        <div className="w-full h-full flex flex-col py-6">
          {/* Menu Toggle & Logo Area */}
          <div className="flex items-center h-12 px-6 mb-8">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`p-2.5 rounded-2xl transition-all ${darkMode ? 'hover:bg-white/5 text-primary' : 'hover:bg-emerald-50 text-emerald-600'}`}
            >
              <Menu size={22} />
            </button>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 ml-4 overflow-hidden whitespace-nowrap"
              >
                <h1 className={`text-xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>Sar Taw Set</h1>
              </motion.div>
            )}
          </div>

          {/* Gmail-style "Compose" Button with Popover */}
          <div className="px-2 mb-6">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className={`flex items-center gap-4 h-14 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl ${
                  isMenuOpen ? 'w-full px-6' : 'w-12 mx-auto px-0 justify-center'
                } ${darkMode ? 'bg-surface-container-highest text-primary' : 'bg-white text-emerald-700 border border-gray-100'}`}>
                  <Plus size={24} strokeWidth={2.5} />
                  {isMenuOpen && <span className="font-bold text-sm whitespace-nowrap">Create New</span>}
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
          <nav className="flex-grow px-3 space-y-8 overflow-y-auto no-scrollbar pb-6">
            <div>
              {isMenuOpen && <p className="px-6 mb-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Management</p>}
              <div className="space-y-1">
              {[
                { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                { id: 'orders', icon: ShoppingBag, label: t('orders') },
                { id: 'products', icon: Package, label: t('products') },
                { id: 'banners', icon: ImageIcon, label: 'Ad Banners' },
                { id: 'special-offers', icon: Tag, label: 'Specials' },
                { id: 'categories', icon: SlidersHorizontal, label: 'Categories' },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center h-12 rounded-2xl transition-all duration-300 group relative ${
                    activeTab === item.id 
                      ? darkMode 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-emerald-50 text-emerald-700' 
                      : darkMode 
                        ? 'text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-900'
                  } ${ isMenuOpen ? 'px-6 gap-4' : 'px-0 justify-center' }`}
                >
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="navPill"
                      className={`absolute left-0 w-1 h-6 rounded-r-full ${darkMode ? 'bg-primary' : 'bg-emerald-600'}`}
                    />
                  )}
                  <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-current' : ''} />
                  {isMenuOpen && (
                    <span className={`font-bold text-xs whitespace-nowrap transition-transform duration-300 ${activeTab === item.id ? 'translate-x-1' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  {activeTab === item.id && isMenuOpen && item.id === 'orders' && stats.pending > 0 && (
                    <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full ring-4 ring-rose-500/10">
                      {stats.pending}
                    </span>
                  )}
                </button>
              ))}
              </div>
            </div>

            <div>
              {isMenuOpen && <p className="px-6 mb-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">System</p>}
              <div className="space-y-1">
              {[
                { id: 'users', icon: Users, label: 'Customers' },
                { id: 'coupons', icon: Ticket, label: 'Coupons' },
                { id: 'notifications', icon: Bell, label: 'Broadcast' },
                { id: 'audit', icon: History, label: 'Audit Logs' },
                { id: 'admins', icon: ShieldCheck, label: 'Admins' },
                { id: 'settings', icon: Settings, label: t('settings') },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center h-12 rounded-2xl transition-all duration-300 group relative ${
                    activeTab === item.id 
                      ? darkMode 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-emerald-50 text-emerald-700' 
                      : darkMode 
                        ? 'text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-900'
                  } ${ isMenuOpen ? 'px-6 gap-4' : 'px-0 justify-center' }`}
                >
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="navPill"
                      className={`absolute left-0 w-1 h-6 rounded-r-full ${darkMode ? 'bg-primary' : 'bg-emerald-600'}`}
                    />
                  )}
                  <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-current' : ''} />
                  {isMenuOpen && (
                    <span className={`font-bold text-xs whitespace-nowrap transition-transform duration-300 ${activeTab === item.id ? 'translate-x-1' : ''}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
              </div>
            </div>
          </nav>

          {/* Logout at bottom */}
          <div className="px-2 pt-4 border-t border-gray-100 dark:border-white/5">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center h-12 rounded-full transition-all duration-200 group relative ${
                darkMode ? 'text-red-400/60 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
              } ${ isMenuOpen ? 'px-6 gap-4' : 'px-0 justify-center' }`}
            >
              <LogOut size={20} />
              {isMenuOpen && <span className="font-bold text-sm whitespace-nowrap">{t('logout')}</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        animate={{ 
          marginLeft: isMenuOpen ? 280 : 88 
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-grow overflow-y-auto max-h-screen no-scrollbar"
      >
        {/* Header */}
        <header className={`sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 py-3 border-b ${darkMode ? 'bg-[#0c0e0e]/80 backdrop-blur-md border-white/5' : 'bg-white/80 backdrop-blur-md border-gray-100'}`}>
          <div className="flex items-center gap-4 flex-grow max-w-2xl">
            {/* Gmail-style Search Bar */}
            <div className="relative flex-grow">
              <div className={`flex items-center gap-3 px-5 py-2 rounded-full transition-all group ${
                darkMode ? 'bg-surface-container-high/40 focus-within:bg-surface-container-high border border-white/5 focus-within:border-primary/30 focus-within:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-gray-100 focus-within:bg-white border border-transparent focus-within:border-emerald-200 focus-within:shadow-xl focus-within:shadow-emerald-900/5 transition-all'
              }`}>
                <Search className={darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'} size={16} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'users' ? 'Search customers by name, phone or room...' :
                    activeTab === 'products' ? 'Search products by name...' :
                    activeTab === 'categories' ? 'Search categories...' :
                    activeTab === 'coupons' ? 'Search coupons by code...' :
                    activeTab === 'notifications' ? 'Search notifications...' :
                    activeTab === 'audit' ? 'Search audit logs...' :
                    activeTab === 'admins' ? 'Search admins...' :
                    activeTab === 'special-offers' ? 'Search deals and bundles...' :
                    activeTab === 'banners' ? 'Search banners...' :
                    'Search orders by customer or ID...'
                  }
                  className="bg-transparent border-none outline-none w-full text-xs font-bold"
                />
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSelectedDateFilter({ start: '', end: '' });
                    toast.info('Filters and search cleared');
                  }}
                  title="Clear all filters"
                  className={`p-1.5 rounded-lg transition-all ${
                    (searchQuery || statusFilter !== 'all' || selectedDateFilter.start) 
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 animate-pulse' 
                      : darkMode ? 'hover:bg-white/5 text-on-surface-variant/40' : 'hover:bg-gray-200 text-gray-400'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-8">
            {/* Real-time Status Indicator */}
            {isQuotaExceeded ? (
              <div className="flex items-center gap-3">
                <div className={`flex flex-col items-end px-4 py-2 rounded-xl border shadow-sm ${
                  darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Quota Exceeded</span>
                  </div>
                  <div className="flex flex-col items-end mt-1">
                    <span className="text-[9px] font-medium opacity-80">Daily Firestore Write Limit Reached</span>
                    <span className="text-[8px] opacity-60">Resets at 1:30 PM Myanmar Time (Midnight Pacific)</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    resetQuotaExceeded();
                    toast.success("Quota status reset locally. You can try saving again.");
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm ${
                    darkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' 
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                  }`}
                >
                  <RefreshCw size={14} />
                  <span>Force Retry</span>
                </button>
              </div>
            ) : (
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
              </div>
            )}

            <button className={`relative p-2.5 rounded-xl transition-all ${
              darkMode ? 'hover:bg-white/5 text-on-surface-variant/60' : 'hover:bg-gray-100 text-gray-500'
            }`}>
              <Bell size={20} />
              {stats.pending > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0c0e0e]" />
              )}
            </button>
            
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-primary text-surface shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-emerald-600'}`}
              >
                <Moon size={18} />
              </button>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl transition-all ${!darkMode ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-on-surface-variant/40 hover:text-white'}`}
              >
                <Sun size={18} />
              </button>
            </div>

            <div className={`flex items-center gap-3 pl-3 pr-5 py-1.5 rounded-full border transition-all hover:shadow-lg ${
              darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-inner ${
                darkMode ? 'bg-primary/20 text-primary' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {auth.currentUser?.email?.[0].toUpperCase() || 'A'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-0.5">Administrator</p>
                <p className="text-[11px] font-bold truncate max-w-[120px]">{auth.currentUser?.email?.split('@')[0]}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow min-w-0 transition-opacity duration-300">
          <div className="p-4 md:p-10 max-w-[1600px] mx-auto">

        {/* Low Stock Alerts */}
        {isLowStockAlertEnabled && stats.lowStock > 0 && activeTab === 'analytics' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-10 p-8 rounded-[3rem] border flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden ${
              darkMode ? 'bg-red-500/10 border-red-500/10 shadow-2xl shadow-red-900/10' : 'bg-red-50 border-red-100 shadow-xl shadow-red-900/5'
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50`} />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-red-400' : 'text-red-800'}`}>Inventory Warning</h3>
                <p className={`text-sm font-bold ${darkMode ? 'text-red-400/50' : 'text-red-600/60'}`}>
                  {stats.lowStock} essential products are critically low.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 relative z-10">
              {products.filter(p => p.stock <= 5).map(p => (
                <motion.span 
                  whileHover={{ y: -2 }}
                  key={p.id} 
                  className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-colors ${
                    darkMode ? 'bg-white/5 border-white/10 text-red-300 hover:bg-white/10' : 'bg-white/80 backdrop-blur-sm border-red-100 text-red-700 hover:bg-white'
                  }`}
                >
                  {p.name}: {p.stock} {p.unit}
                </motion.span>
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
                <div className="flex flex-col">
                  <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('orderManagement')}</h2>
                  <p className="text-[10px] font-medium opacity-50 -mt-1">Manage, filter, and track all customer orders in real-time.</p>
                </div>
                <button 
                  onClick={() => {
                    const doc = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4'
                    });

                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    // Header: Company Name
                    doc.setFontSize(22);
                    doc.setTextColor(16, 185, 129); // Emerald-500
                    doc.setFont('helvetica', 'bold');
                    doc.text('Sar Taw Set', 14, 20);

                    // Header: Title
                    doc.setFontSize(16);
                    doc.setTextColor(40);
                    doc.text('Order Management Report', 14, 30);

                    // Header: Timestamp
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.setFont('helvetica', 'normal');
                    const timestamp = new Date().toLocaleString();
                    doc.text(`Generated on: ${timestamp}`, 14, 37);

                    const tableData = filteredOrders.map(o => [
                      `#${o.id.slice(-6).toUpperCase().padStart(6, '0')}`,
                      o.customerName,
                      formatPrice(o.total),
                      o.status.toUpperCase(),
                      new Date(o.createdAt).toLocaleDateString()
                    ]);

                    autoTable(doc, {
                      head: [['Order ID', 'Customer Name', 'Total Amount', 'Status', 'Order Date']],
                      body: tableData,
                      startY: 45,
                      theme: 'grid',
                      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                      styles: { fontSize: 9, cellPadding: 3, lineColor: [230, 230, 230], lineWidth: 0.1 },
                      margin: { bottom: 20 },
                      didDrawPage: (data) => {
                        // Footer: Page Number
                        doc.setFontSize(8);
                        doc.setTextColor(150);
                        const str = `Page ${doc.getNumberOfPages()}`;
                        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
                      }
                    });

                    doc.save(`SarTawSet_Orders_${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                    darkMode ? 'bg-white/5 text-on-surface-variant/60 hover:bg-white/10' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <FileText size={16} />
                  Export PDF
                </button>
              </div>

              {/* Status Filter Chips & Date Range Inline */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-grow md:flex-grow-0">
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

                <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-colors ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <Calendar size={12} className="opacity-40" />
                  <input 
                    type="date" 
                    className="bg-transparent text-[10px] font-bold outline-none cursor-pointer" 
                    onChange={e => setSelectedDateFilter(prev => ({...prev, start: e.target.value}))} 
                  />
                  <span className="opacity-20 text-[10px]">—</span>
                  <input 
                    type="date" 
                    className="bg-transparent text-[10px] font-bold outline-none cursor-pointer" 
                    onChange={e => setSelectedDateFilter(prev => ({...prev, end: e.target.value}))} 
                  />
                </div>
              </div>

              {/* Compact Enhanced Orders Grid */}
              <div className="grid gap-2">
                {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.01, duration: 0.2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setIsOrderModalOpen(true);
                    }}
                    className={`group px-4 py-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      order.status === 'pending' 
                        ? 'bg-amber-950/5 border-amber-500/20 hover:bg-amber-950/10' 
                        : 'bg-surface-container-high/20 border-white/5 hover:bg-surface-container-high/40'
                    }`}
                  >
                     <div className="flex items-center gap-4 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                          order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                        }`}>
                          {order.customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs text-on-surface truncate">{order.customerName}</p>
                          <p className="font-mono text-[10px] font-bold text-on-surface-variant/40">#{order.id.slice(-6).toUpperCase().padStart(6, '0')}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-6">
                         <div className="text-right hidden sm:block">
                           <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/40 font-bold">Ordered On</p>
                           <p className="font-bold text-[10px] text-on-surface">{new Date(order.createdAt).toLocaleDateString()}</p>
                         </div>

                         <div className="text-right">
                           <p className="font-black text-xs text-on-surface">{formatPrice(order.total)}</p>
                           <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/40 font-bold">{order.items.length} items</p>
                         </div>
                         
                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 
                            order.status === 'packing' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-amber-500/10 text-amber-500'
                         }`}>{order.status}</span>
                         
                         <div className="text-on-surface-variant/20 group-hover:text-primary transition-colors">
                            <ChevronRight size={14} />
                         </div>
                     </div>
                  </motion.div>
                )) : (
                  <div className="p-10 text-center rounded-2xl border border-dashed border-white/5">
                     <p className="font-bold text-xs opacity-30">No orders found.</p>
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
                globalSearch={searchQuery}
              />
            </motion.div>
          ) : activeTab === 'banners' ? (
            <motion.div key="banners" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div>
                <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>Ad Banners</h2>
                <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Manage full-image advertisements</p>
              </div>
              <AdBannersTab darkMode={darkMode} t={t} globalSearch={searchQuery} />
            </motion.div>
          ) : activeTab === 'special-offers' ? (
            <motion.div key="special-offers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div>
                <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-on-surface' : 'text-emerald-950'}`}>Special Offers</h2>
                <p className={`text-xs font-bold ${darkMode ? 'text-on-surface-variant/60' : 'text-gray-500'}`}>Manage daily deals and product bundles</p>
              </div>
              <SpecialOffersTab darkMode={darkMode} t={t} globalSearch={searchQuery} />
            </motion.div>
          ) : activeTab === 'categories' ? (
            <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <CategoriesTab categories={categories} updateCategory={updateCategory} addCategory={addCategory} deleteCategory={deleteCategory} darkMode={darkMode} t={t} globalSearch={searchQuery} />
            </motion.div>
          ) : activeTab === 'users' ? (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UsersTab users={users} darkMode={darkMode} updateUserPoints={updateUserPoints} globalSearch={searchQuery} />
            </motion.div>
          ) : activeTab === 'coupons' ? (
            <motion.div 
              key="coupons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CouponsTab coupons={coupons} addCoupon={addCoupon} updateCoupon={updateCoupon} deleteCoupon={deleteCoupon} darkMode={darkMode} formatPrice={formatPrice} globalSearch={searchQuery} />
            </motion.div>
          ) : activeTab === 'notifications' ? (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <NotificationsTab sendBroadcast={sendBroadcast} broadcastNotifications={broadcastNotifications} darkMode={darkMode} globalSearch={searchQuery} />
            </motion.div>
          ) : activeTab === 'audit' ? (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AuditLogsTab auditLogs={auditLogs} darkMode={darkMode} globalSearch={searchQuery} />
            </motion.div>
          ) : activeTab === 'admins' ? (
            <motion.div 
              key="admins"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminsTab admins={admins} addAdmin={addAdmin} updateAdminRole={updateAdminRole} removeAdmin={removeAdmin} darkMode={darkMode} globalSearch={searchQuery} />
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
                              Delivery Fee
                            </label>
                            <div className="flex gap-3">
                              <input 
                                type="number"
                                min="0"
                                step="100"
                                value={tempDeliveryFee}
                                onChange={(e) => setTempDeliveryFee(Number(e.target.value))}
                                className={`flex-grow border rounded-2xl px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? 'bg-white/5 border-white/10 text-on-surface focus:border-primary/50' : 'bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50'}`}
                              />
                              <button 
                                onClick={() => {
                                  setDeliveryFee(tempDeliveryFee);
                                  alert('Delivery fee updated successfully!');
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>{t('bankTransferSettings')}</h4>
                            <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{t('bankTransferSettingsDesc')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => authUid && setIsBankEnabled(!isBankEnabled)}
                          disabled={!authUid}
                          className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                            !authUid ? 'opacity-50 cursor-not-allowed bg-gray-300' :
                            isBankEnabled ? 'bg-blue-500' : (darkMode ? 'bg-white/10' : 'bg-gray-200')
                          }`}
                        >
                          <motion.div 
                            animate={{ x: isBankEnabled ? 28 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-7 h-7 bg-white rounded-full shadow-xl" 
                          />
                        </button>
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

                      <div className="grid grid-cols-1 gap-4">
                        <div className={`p-6 rounded-2xl border flex items-center justify-between ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                          <div>
                            <h4 className={`font-black uppercase tracking-widest text-xs ${darkMode ? 'text-on-surface' : 'text-emerald-900'}`}>Maintenance Mode</h4>
                            <p className={`text-[10px] font-bold ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>Pause all new orders</p>
                          </div>
                          <button
                            onClick={() => updateMaintenanceMode(!isMaintenanceMode)}
                            className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                              isMaintenanceMode ? 'bg-rose-500' : (darkMode ? 'bg-white/10' : 'bg-gray-200')
                            }`}
                          >
                            <motion.div 
                              animate={{ x: isMaintenanceMode ? 28 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="w-7 h-7 bg-white rounded-full shadow-xl" 
                            />
                          </button>
                        </div>
                        <button 
                          onClick={handleSeed}
                          disabled={isSeeding}
                          className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                            isSeeding ? 'opacity-50 cursor-not-allowed' : ''
                          } ${darkMode ? 'bg-amber-600 text-white shadow-amber-900/20 hover:bg-amber-500' : 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'}`}
                        >
                          <Database size={16} className={isSeeding ? 'animate-bounce' : ''} />
                          {isSeeding ? 'Seeding...' : 'Seed Products & Categories'}
                        </button>
                        <button 
                          onClick={async () => {
                            setIsSeeding(true);
                            try {
                              await seedSampleOrders();
                              toast.success("Sample orders seeded!");
                            } catch (e) {
                              toast.error("Failed to seed sample orders.");
                            } finally {
                              setIsSeeding(false);
                            }
                          }}
                          disabled={isSeeding}
                          className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                            isSeeding ? 'opacity-50 cursor-not-allowed' : ''
                          } ${darkMode ? 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500' : 'bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600'}`}
                        >
                          <ShoppingBag size={16} className={isSeeding ? 'animate-bounce' : ''} />
                          {isSeeding ? 'Seeding Orders...' : 'Seed Sample Orders'}
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
        </div>
      </motion.main>
    </div>
  );
}
