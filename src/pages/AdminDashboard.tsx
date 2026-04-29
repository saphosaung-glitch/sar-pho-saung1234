import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, Product, Order } from "../context/StoreContext";
import OrdersTab from "../components/admin/OrdersTab";
import ProductsTab from "../components/admin/ProductsTab";
import { NotificationsTab } from "../components/admin/NotificationsTab";
import { OrderNotifications } from "../components/admin/OrderNotifications";
import {
  LogOut,
  Package,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  ShoppingBag,
  ListChecks,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MapPin,
  Settings,
  Phone,
  Save,
  CreditCard,
  DollarSign,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Hash,
  ShieldCheck,
  Menu,
  X,
  Search,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Printer,
  User,
  Users,
  Calendar,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  AlertTriangle,
  Download,
  Bell,
  Edit2,
  Ticket,
  History,
  MessageSquare,
  MessageCircle,
  Beef,
  Fish,
  Carrot,
  Egg,
  Soup,
  Wheat,
  UtensilsCrossed,
  Flame,
  Wine,
  Candy,
  Snowflake,
  Baby,
  Dog,
  Home,
  Smile,
  Pill,
  Briefcase,
  Store,
  Zap,
  ToggleLeft,
  ToggleRight,
  FileText,
  KeyRound,
  Moon,
  Sun,
  Truck,
  ClipboardList,
  ExternalLink,
  Mail,
  Ban,
  Check,
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { seedDatabase, seedSampleOrders, PRODUCTS } from "../lib/seed";
import { CATEGORIES } from "../constants";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { translateProductName } from "../services/translationService";
import { formatAdminNotifyMessage, getWhatsAppLink, getViberLink } from "../lib/messaging";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatPhoneNumber } from "../lib/messaging";

function AnalyticsTab({
  orders,
  products,
  stats,
  darkMode,
  formatPrice,
  isLowStockAlertEnabled,
  t,
}: {
  orders: Order[];
  products: Product[];
  stats: any;
  darkMode: boolean;
  formatPrice: (p: number) => string;
  isLowStockAlertEnabled: boolean;
  t: (key: string) => string;
}) {
  const chartData = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; revenue: number; orders: number }
    > = {};

    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dailyData[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
    }

    orders.forEach((order) => {
      const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += order.total;
        dailyData[dateStr].orders += 1;
      }
    });

    return Object.values(dailyData);
  }, [orders]);

  const analyticsStats = useMemo(() => {
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");
    const totalRevenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);
    const aov =
      deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    const cancellationRate =
      orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0;
    const inventoryValue = products.reduce(
      (acc, p) => acc + p.price * p.stock,
      0,
    );

    // Growth calculation (Last 7 days vs Previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentPeriodRevenue = orders
      .filter((o) => new Date(o.createdAt) >= last7Days)
      .reduce((acc, o) => acc + o.total, 0);

    const previousPeriodRevenue = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= prev7Days && d < last7Days;
      })
      .reduce((acc, o) => acc + o.total, 0);

    const growth =
      previousPeriodRevenue > 0
        ? ((currentPeriodRevenue - previousPeriodRevenue) /
            previousPeriodRevenue) *
          100
        : 0;

    return {
      aov,
      growth,
      cancellationRate,
      inventoryValue,
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
    };
  }, [orders, products]);

  const topCustomers = useMemo(() => {
    const customers: Record<
      string,
      { name: string; orders: number; spent: number }
    > = {};
    orders.forEach((order) => {
      if (!customers[order.customerName]) {
        customers[order.customerName] = {
          name: order.customerName,
          orders: 0,
          spent: 0,
        };
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
    orders.forEach((order) => {
      order.items.forEach((item) => {
        cats[item.category] =
          (cats[item.category] || 0) + item.price * item.quantity;
      });
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const counts: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
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

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Object.entries(hours).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
    }));
  }, [orders]);

  const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="space-y-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Main Stats - Compact */}
        <div className="lg:col-span-4 xl:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: t("pending"),
              value: stats.pending,
              color: "amber",
              icon: Clock,
            },
            {
              label: t("packing"),
              value: stats.packing,
              color: "blue",
              icon: Package,
            },
            {
              label: t("delivered"),
              value: stats.delivered,
              color: "emerald",
              icon: CheckCircle2,
            },
            {
              label: "Low Stock",
              value: stats.lowStock,
              color: "red",
              icon: AlertTriangle,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-[1.5rem] border transition-all duration-300 ${
                darkMode
                  ? "bg-white/5 border-white/5"
                  : "bg-white border-gray-100 shadow-sm"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${
                  darkMode
                    ? "bg-white/5 text-primary"
                    : `bg-${stat.color}-50 text-${stat.color}-600`
                }`}
              >
                <stat.icon size={16} />
              </div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
              >
                {stat.label}
              </p>
              <p
                className={`text-xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Revenue & Growth - Highlighted */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border flex flex-col justify-between relative overflow-hidden ${
            darkMode
              ? "bg-primary/10 border-primary/20"
              : "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-200"
          }`}
        >
          <div className="relative z-10">
            <p
              className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${darkMode ? "text-primary" : "text-emerald-100"}`}
            >
              Total Revenue
            </p>
            <h3 className="text-3xl font-black tracking-tighter mb-2">
              {formatPrice(stats.totalRevenue)}
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                  analyticsStats.growth >= 0
                    ? darkMode
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/20 text-white"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {analyticsStats.growth >= 0 ? (
                  <TrendingUp size={10} />
                ) : (
                  <TrendingUp size={10} className="rotate-180" />
                )}
                {Math.abs(analyticsStats.growth).toFixed(1)}%
              </div>
              <span
                className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-emerald-100/60"}`}
              >
                vs last week
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <DollarSign size={120} />
          </div>
        </motion.div>

        {/* Revenue Chart - Wide Bento */}
        <div
          className={`md:col-span-2 lg:col-span-3 xl:col-span-4 p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black tracking-tight uppercase tracking-widest">
              Revenue Flow
            </h3>
            <div
              className={`p-2 rounded-lg ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-600"}`}
            >
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={
                    darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                  }
                />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#161818" : "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AOV & Orders - Small Bento */}
        <div
          className={`md:col-span-2 lg:col-span-1 xl:col-span-2 p-6 rounded-[2rem] border grid grid-cols-2 gap-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <div className="flex flex-col justify-center">
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
            >
              Avg. Order
            </p>
            <h4 className="text-lg font-black tracking-tight">
              {formatPrice(analyticsStats.aov)}
            </h4>
          </div>
          <div className="flex flex-col justify-center">
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
            >
              Total Orders
            </p>
            <h4 className="text-lg font-black tracking-tight">
              {analyticsStats.totalOrders}
            </h4>
          </div>
          <div className="flex flex-col justify-center">
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
            >
              Cancel Rate
            </p>
            <h4
              className={`text-lg font-black tracking-tight ${analyticsStats.cancellationRate > 10 ? "text-rose-500" : ""}`}
            >
              {analyticsStats.cancellationRate.toFixed(1)}%
            </h4>
          </div>
          <div className="flex flex-col justify-center">
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
            >
              Stock Value
            </p>
            <h4 className="text-lg font-black tracking-tight">
              {formatPrice(analyticsStats.inventoryValue)}
            </h4>
          </div>
        </div>

        {/* Top Products - List Bento */}
        <div
          className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <h3 className="text-xs font-black tracking-widest uppercase mb-6">
            Top Products
          </h3>
          <div className="space-y-4">
            {topProducts.slice(0, 4).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                      idx < 3
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-bold text-xs truncate max-w-[100px]">
                    {product.name}
                  </span>
                </div>
                <span className="font-black text-xs">{product.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Pie - Square Bento */}
        <div
          className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <h3 className="text-xs font-black tracking-widest uppercase mb-4">
            Categories
          </h3>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-[8px] font-bold uppercase opacity-60">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers - List Bento */}
        <div
          className={`md:col-span-2 lg:col-span-2 xl:col-span-2 p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <h3 className="text-xs font-black tracking-widest uppercase mb-6">
            Top Customers
          </h3>
          <div className="space-y-4">
            {topCustomers.map((customer, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${darkMode ? "bg-white/5" : "bg-gray-100"}`}
                  >
                    <User size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-xs truncate max-w-[80px]">
                      {customer.name}
                    </p>
                    <p className="text-[8px] font-bold opacity-40 uppercase">
                      {customer.orders} orders
                    </p>
                  </div>
                </div>
                <span className="font-black text-xs text-primary">
                  {formatPrice(customer.spent)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours - Wide Bento */}
        <div
          className={`md:col-span-2 lg:col-span-4 xl:col-span-6 p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black tracking-widest uppercase">
              Peak Ordering Hours
            </h3>
            <p className="text-[10px] font-bold opacity-40 uppercase">
              24 Hour Distribution
            </p>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={
                    darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                  }
                />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 8,
                    fontWeight: 700,
                    fill: darkMode
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(0,0,0,0.4)",
                  }}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({
  order,
  isOpen,
  onClose,
  darkMode,
  formatPrice,
  updateStatus,
  t,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  formatPrice: (p: number) => string;
  updateStatus: (id: string, s: any) => Promise<void>;
  t: any;
}) {
  const { shopPhone, shopEmail } = useStore();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  
  // Update state listener for quota
  const { isQuotaExceeded } = useStore();

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

  const handleDownloadPDF = () => {
    try {
      if (!order || !order.items) return;
      toast.info("Generating PDF Invoice...", { icon: "📄" });

      const doc = new jsPDF();
      const invoiceDate = new Date(order.createdAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );
      const itemsSubtotal = order.items.reduce(
        (acc, item) => acc + item.price * (item.quantity || 1),
        0,
      );

      // --- MATCH A4 PRINT LAYOUT STYLE ---

      // Header Section
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.text("SAR TAW SET", 20, 30);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Grocery & Meat Delivery Service", 20, 38);

      // Invoice Details (Top Right)
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(11);
      doc.text("INVOICE", 190, 25, { align: "right" });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`#${order.id}`, 190, 35, {
        align: "right",
      });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Issued: ${invoiceDate}`, 190, 42, { align: "right" });

      // Divider
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.line(20, 55, 190, 55);

      // Meta Info Grid
      // Billed To
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

      // Items Table
      const itemsData = order.items.map((item) => [
        item.name,
        formatPrice(item.price),
        item.quantity.toString(),
        formatPrice(item.price * item.quantity),
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

      // Totals
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
        doc.text(`+${formatPrice(order.deliveryFee)}`, amountX, nextY, {
          align: "right",
        });
        nextY += 8;
      }

      if (order.pointDiscount > 0) {
        doc.setTextColor(100, 100, 100);
        doc.text("Discount", totalsX, nextY);
        doc.setTextColor(0, 0, 0);
        doc.text(`-${formatPrice(order.pointDiscount)}`, amountX, nextY, {
          align: "right",
        });
        nextY += 8;
      }

      // Final Total Line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.5);
      doc.line(totalsX - 10, nextY, 190, nextY);
      nextY += 12;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL DUE", totalsX, nextY);
      doc.text(formatPrice(order.total), amountX, nextY, { align: "right" });

      // Footer
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Thank you for choosing Sar Taw Set. If you have any questions, please contact us.",
        105,
        h - 25,
        { align: "center" },
      );
      doc.text(
        `Customer Support: ${shopPhone} | Email: ${shopEmail}`,
        105,
        h - 18,
        { align: "center" },
      );

      doc.save(`Invoice_#${order.id}.pdf`);
      toast.success("PDF Downloaded!");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF.");
    }
  };

  const handlePrint = (format: "a4" | "thermal") => {
    try {
      toast.info(`Preparing ${format === "a4" ? "Invoice" : "Receipt"}...`, {
        icon: "🖨️",
      });

      if (!order || !order.items) {
        toast.error("Order data is missing.");
        return;
      }

      const itemsSubtotal = order.items.reduce(
        (acc, item) => acc + item.price * (item.quantity || 1),
        0,
      );
      const invoiceDate = new Date(order.createdAt).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      );

      let styles = "";
      let content = "";

      if (format === "thermal") {
        const itemsHtml = order.items
          .map(
            (item) => `
          <tr>
            <td style="padding: 4px 0; font-size: 11px;">
              ${item.name}<br>
              <span style="font-size: 9px; color: #555;">${item.quantity} x ${formatPrice(item.price)}</span>
            </td>
            <td style="padding: 4px 0; text-align: right; font-size: 11px; vertical-align: top;">${formatPrice(item.price * item.quantity)}</td>
          </tr>
        `,
          )
          .join("");

        styles = `
          @page { size: 58mm auto; margin: 0; }
          body { 
            background: #fff; margin: 0; padding: 0; 
            font-family: 'Courier New', Courier, monospace;
            -webkit-print-color-adjust: exact;
          }
          .thermal-print-body { width: 54mm; margin: 0 auto; color: #000; padding: 2mm; box-sizing: border-box; }
          .thermal-header { text-align: center; margin-bottom: 12px; }
          .thermal-header h1 { margin: 0; font-size: 18px; font-weight: bold; }
          .thermal-divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .thermal-table { width: 100%; border-collapse: collapse; }
          .thermal-table th { text-align: left; font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .thermal-totals { margin-top: 8px; font-size: 11px; font-weight: bold; }
        `;

        content = `
          <div class="thermal-print-body">
            <div class="thermal-header">
              <h1>SAR TAW SET</h1>
              <p style="font-size: 10px; margin: 4px 0;">Fresh Grocery Delivery</p>
              <p style="font-size: 9px; margin: 2px 0;">${shopPhone}</p>
            </div>
            <div style="font-size: 10px; margin-bottom: 8px;">
              <p style="margin: 2px 0;">ID: #${order.id}</p>
              <p style="margin: 2px 0;">Date: ${new Date(order.createdAt).toLocaleString()}</p>
              <p style="margin: 2px 0;">Customer: ${order.customerName}</p>
              <p style="margin: 2px 0;">Room/Phone: ${order.roomNumber} / ${order.customerPhone}</p>
            </div>
            <div class="thermal-divider"></div>
            <table class="thermal-table">
              <thead><tr><th>ITEM</th><th style="text-align:right">TOTAL</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="thermal-divider"></div>
            <div class="thermal-totals">
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>SUBTOTAL</span><span>${formatPrice(itemsSubtotal)}</span></div>
              ${order.deliveryFee > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom: 4px; font-weight:normal;"><span>DELIVERY</span><span>+${formatPrice(order.deliveryFee)}</span></div>` : ""}
              ${order.pointDiscount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom: 4px; font-weight:normal;"><span>POINTS</span><span>-${formatPrice(order.pointDiscount)}</span></div>` : ""}
              <div style="display:flex; justify-content:space-between; font-size:16px; margin-top:8px; border-top:1px dashed #000; padding-top:8px;"><span>TOTAL</span><span>${formatPrice(order.total)}</span></div>
            </div>
            <div style="text-align:center; margin-top:15px; font-size:9px;">Thank you for shopping Sar Taw Set!</div>
          </div>
        `;
      } else {
        const itemsHtml = order.items
          .map(
            (item, index) => `
          <tr style="break-inside: avoid;">
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: #666;">${index + 1}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
              <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${item.quantity} <span style="font-size:10px;color:#888;">${item.unit}</span></td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${formatPrice(item.price * item.quantity)}</td>
          </tr>
        `,
          )
          .join("");

        styles = `
          @page { size: A4; margin: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #fff; margin: 0; padding: 20mm; -webkit-print-color-adjust: exact; color: #111;
          }
          .a4-invoice { width: 100%; display: flex; flex-direction: column; min-height: calc(100vh - 40mm); }
          .header { display: flex; justify-content: space-between; padding-bottom: 20px; margin-bottom: 30px; }
          .brand h1 { margin: 0; font-size: 36px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
          .brand p { margin: 5px 0 0 0; color: #555; text-transform: uppercase; letter-spacing: 2px; font-size: 10px; font-weight: bold; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { margin: 0; color: #111; font-size: 24px; letter-spacing: 3px; font-weight: 900; text-transform: uppercase; }
          .invoice-title-meta { margin-top: 10px; font-size: 12px; color: #444; }
          .invoice-title-meta strong { color: #111; font-weight: bold; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .party-box { width: 48%; }
          .party-title { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .party-details p { margin: 4px 0; font-size: 13px; color: #333; }
          .party-details .name { font-weight: 800; font-size: 18px; color: #111; margin-bottom: 8px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { text-align: left; border-bottom: 2px solid #111; padding-bottom: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555; }
          .summary-section { display: flex; justify-content: flex-end; margin-top: auto; padding-top: 20px; }
          .totals { width: 350px; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; border-bottom: 1px solid #eee; }
          .total-final { padding: 16px 0; font-size: 20px; font-weight: 900; color: #111; margin: 0; border-top: 2px solid #111; border-bottom: none; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
          .sig-box { width: 200px; text-align: center; }
          .sig-line { border-top: 1px solid #111; padding-top: 8px; margin-top: 60px; }
          .sig-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          .sig-desc { font-size: 9px; color: #666; margin-top: 4px; }
          .sig-watermark { position: absolute; font-family: 'Times New Roman', serif; font-style: italic; font-size: 32px; color: #eee; transform: translateY(-70px); font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
        `;

        content = `
          <div class="a4-invoice">
            <div class="header">
              <div class="brand">
                <h1>SAR TAW SET</h1>
                <p>Grocery & Meat Delivery Service</p>
                <div style="margin-top: 10px; font-size: 11px; color: #666;">
                  Phone: ${shopPhone}<br>
                  Email: ${shopEmail}
                </div>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <div class="invoice-title-meta">
                  <p><strong>Invoice No:</strong> #INV-${order.id}</p>
                  <p><strong>Date Issued:</strong> ${invoiceDate}</p>
                </div>
              </div>
            </div>
            
            <div class="parties">
              <div class="party-box">
                <div class="party-title">Client Details</div>
                <div class="party-details">
                  <p class="name">${order.customerName}</p>
                  <p><strong>Contact:</strong> ${order.customerPhone}</p>
                  <p><strong>Delivery Location:</strong></p>
                  <p>Room ${order.roomNumber}</p>
                  ${order.address ? `<p>${order.address}</p>` : ""}
                </div>
              </div>
              <div class="party-box" style="text-align: right;">
                <div class="party-title" style="text-align: right;">Order Information</div>
                <div class="party-details">
                  <p><strong>Status:</strong> <span style="font-weight:bold; text-transform:uppercase; font-size: 13px; color: #111;">${order.status}</span></p>
                  <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                  <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="text-align:center; width:40px;">No.</th>
                  <th>Description</th>
                  <th style="text-align:right; width:100px;">Rate</th>
                  <th style="text-align:right; width:80px;">Qty</th>
                  <th style="text-align:right; width:120px;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div class="summary-section">
              <div class="totals">
                <div class="total-row"><span>Gross Amount</span><strong>${formatPrice(itemsSubtotal)}</strong></div>
                ${order.deliveryFee > 0 ? `<div class="total-row"><span>Delivery Logistics</span><strong>+${formatPrice(order.deliveryFee)}</strong></div>` : ""}
                ${order.pointDiscount > 0 ? `<div class="total-row" style="color: #e11d48;"><span>Loyalty Credit Offset</span><strong>-${formatPrice(order.pointDiscount)}</strong></div>` : ""}
                <div class="total-row total-final"><span>Total Settlement</span><span>${formatPrice(order.total)}</span></div>
              </div>
            </div>
            
            ${
              order.note
                ? `
              <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <strong style="display:block; font-size:10px; text-transform:uppercase; color:#b45309; margin-bottom:5px;">Order Notes</strong>
                <p style="margin:0; font-size:13px; color:#92400e;">${order.note}</p>
              </div>
            `
                : ""
            }

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-watermark">Sar Taw Set</div>
                <div class="sig-line">
                  <div class="sig-title">Authorized Official</div>
                  <div class="sig-desc">For Sar Taw Set Caterer</div>
                </div>
              </div>
              <div class="sig-box">
                <div class="sig-line">
                  <div class="sig-title">Client Signature</div>
                  <div class="sig-desc">Goods Received in Good Order</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              Generated by Sar Taw Set Asset Management System. This is a computer-generated document and requires signatures for validity.
            </div>
          </div>
        `;
      }

      // Try window.open first as it's most reliable for opening print dialogs
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.open();
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice #${order.id}</title>
              <style>${styles}</style>
            </head>
            <body>
              ${content}
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
      } else {
        // Fallback to iframe if window.open is blocked
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);

        const iframeDoc =
          iframe.contentWindow?.document || iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html><html><head><style>${styles}</style></head>
            <body>${content}<script>window.onload = function() { window.print(); };</script></body></html>
          `);
          iframeDoc.close();
          setTimeout(() => {
            if (document.body.contains(iframe))
              document.body.removeChild(iframe);
          }, 5000);
        } else {
          toast.error("Could not prepare print dialog.");
        }
      }
    } catch (err) {
      console.error("[Print] Fatal error:", err);
      toast.error("Could not prepare print document.");
    }
  };

  const statusConfig = {
    pending: {
      color: "amber",
      icon: Clock,
      label: t("statusPending"),
      bg: "bg-amber-500",
      text: "text-amber-500",
      light: "bg-amber-50",
      border: "border-amber-100",
      dark: "bg-amber-500/10",
    },
    packing: {
      color: "blue",
      icon: Package,
      label: t("statusPacking"),
      bg: "bg-blue-500",
      text: "text-blue-500",
      light: "bg-blue-50",
      border: "border-blue-100",
      dark: "bg-blue-500/10",
    },
    delivered: {
      color: "emerald",
      icon: CheckCircle2,
      label: t("statusDelivered"),
      bg: "bg-emerald-500",
      text: "text-emerald-500",
      light: "bg-emerald-50",
      border: "border-emerald-100",
      dark: "bg-emerald-500/10",
    },
    cancelled: {
      color: "rose",
      icon: X,
      label: t("statusCancelled"),
      bg: "bg-rose-500",
      text: "text-rose-500",
      light: "bg-rose-50",
      border: "border-rose-100",
      dark: "bg-rose-500/10",
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full h-full overflow-hidden flex flex-col lg:flex-row ${
              darkMode ? "bg-[#0f1111]" : "bg-[#fdfdfd]"
            }`}
          >
            {/* Left Side: Order Info & Status (Compact vertical bar) */}
            <div
              className={`lg:w-[280px] shrink-0 flex flex-col border-r ${darkMode ? "border-white/5 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50"}`}
            >
              {/* Top Banner with ID */}
              <div className="px-6 py-3 pb-0.5">
                <div
                  className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 ${
                    order.status === "pending"
                      ? "bg-amber-500/10 text-amber-500"
                      : order.status === "packing"
                        ? "bg-blue-500/10 text-blue-500"
                        : order.status === "cancelled"
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === "pending" ? "bg-amber-500" : order.status === "packing" ? "bg-blue-50" : order.status === "cancelled" ? "bg-rose-500" : "bg-emerald-500"}`}
                  />
                  {statusConfig[order.status].label}
                </div>
                <h2
                  className={`text-2xl font-black tracking-tighter mb-1 ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                >
                  #{order.id}
                </h2>
                <div className="flex items-center gap-2 opacity-40">
                  <Calendar size={10} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Scrollable Details */}
              <div className="flex-grow overflow-y-auto no-scrollbar p-4 pt-1 space-y-2.5">
                {/* Customer Section */}
                <section>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1.5 ml-1">
                    Customer
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-primary" : "bg-white shadow-sm text-emerald-700"}`}
                      >
                        <User size={14} />
                      </div>
                      <div>
                        <p className="font-black text-sm tracking-tight leading-tight mb-0.5">
                          {order.customerName}
                        </p>
                        <p
                          className={`text-[9px] font-bold font-mono opacity-50`}
                        >
                          {order.customerPhone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-primary" : "bg-white shadow-sm text-emerald-700"}`}
                      >
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5 leading-none">
                          Location
                        </p>
                        <p className="font-bold text-xs tracking-tight">
                          Room {order.roomNumber}
                        </p>
                        {order.address && (
                          <p
                            className={`text-[9px] font-medium mt-0.5 leading-relaxed opacity-60`}
                          >
                            {order.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-primary" : "bg-white shadow-sm text-emerald-700"}`}
                      >
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5 leading-none">
                          Payment
                        </p>
                        <p className="font-bold text-xs tracking-tight uppercase">
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>

                    {order.paymentMethod.toLowerCase().includes("bank") && (
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-none flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-primary" : "bg-white shadow-sm text-emerald-700"}`}
                        >
                          <ImageIcon size={14} />
                        </div>
                        <div className="flex-grow">
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1 leading-none">
                            Screenshot
                          </p>
                          {order.paymentScreenshot ? (
                            <button
                              onClick={() =>
                                window.open(order.paymentScreenshot, "_blank")
                              }
                              className="group relative w-full h-20 rounded-xl overflow-hidden border border-dashed border-inherit bg-black/5 hover:bg-black/10 transition-all"
                            >
                              <img
                                src={order.paymentScreenshot}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt="Payment Screenshot"
                              />
                            </button>
                          ) : (
                            <div
                              className={`w-full py-2 px-2 rounded-xl border border-dashed text-center ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}
                            >
                              <p className="text-[8px] font-bold opacity-30 italic">
                                No upload
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Delivery schedule */}
                <section>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1.5 ml-1">
                    Schedule
                  </p>
                  <div
                    className={`px-3 py-2.5 rounded-xl border border-dashed ${darkMode ? "bg-primary/5 border-primary/20" : "bg-emerald-50/50 border-emerald-100"}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Clock size={12} className="text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                        {order.deliveryDay}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold opacity-80">
                      {order.deliveryDate}
                    </p>
                  </div>
                </section>
              </div>

              {/* Customer Contact at bottom of sidebar */}
              <div
                className={`p-3 border-t ${darkMode ? "border-white/5 bg-white/[0.01]" : "border-gray-100 bg-gray-50/50"}`}
              >
                  <div className={`grid grid-cols-3 gap-1 p-1 rounded-2xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}>
                    <button
                      onClick={() => {
                        const message = formatAdminNotifyMessage(order, formatPrice);
                        window.open(getWhatsAppLink(order.customerPhone, message), "_blank");
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all active:scale-95 ${darkMode ? "hover:bg-emerald-500/10 text-emerald-500" : "bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"}`}
                    >
                      <MessageCircle size={18} />
                      <span className="text-[8px] font-black uppercase tracking-widest">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => {
                        const message = formatAdminNotifyMessage(order, formatPrice);
                        window.open(getViberLink(order.customerPhone, message), "_blank");
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all active:scale-95 ${darkMode ? "hover:bg-purple-500/10 text-purple-400" : "bg-white text-purple-700 shadow-sm hover:bg-purple-50"}`}
                    >
                      <MessageSquare size={18} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Viber</span>
                    </button>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all active:scale-95 ${darkMode ? "hover:bg-blue-500/10 text-blue-400" : "bg-white text-blue-700 shadow-sm hover:bg-blue-50"}`}
                    >
                      <Phone size={18} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Call</span>
                    </a>
                  </div>
              </div>
            </div>

            {/* Right Side: Items List & Total Summary */}
            <div
              className={`flex-grow flex flex-col min-w-0 ${darkMode ? "bg-transparent" : "bg-white"}`}
            >
              {/* Header Content */}
              <div className="px-6 py-2.5 flex items-center justify-between relative border-b border-inherit">
                <div>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mb-0.5">
                    Invoice Details
                  </h3>
                  <p className="text-base font-black truncate max-w-md">
                    Order Summary • {order.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                        darkMode
                          ? "bg-white shadow-xl text-black hover:bg-gray-200"
                          : "bg-emerald-950 text-white shadow-xl hover:bg-emerald-900"
                      }`}
                    >
                      <Printer size={14} />
                      Print
                      <ChevronRight
                        size={10}
                        className={`${isPrintMenuOpen ? "-rotate-90" : "rotate-90"} opacity-50`}
                      />
                    </button>
                    {isPrintMenuOpen && (
                      <div
                        className={`absolute right-0 mt-2 w-44 p-1.5 rounded-2xl shadow-2xl z-[150] border ${
                          darkMode
                            ? "bg-[#18181b] border-white/10"
                            : "bg-white border-gray-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint("a4");
                            setTimeout(() => setIsPrintMenuOpen(false), 200);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                            darkMode
                              ? "hover:bg-white/10 text-white"
                              : "hover:bg-emerald-50 text-emerald-950"
                          }`}
                        >
                          <FileText
                            size={14}
                            className={
                              darkMode ? "text-white/50" : "text-emerald-700/50"
                            }
                          />
                          A4 Invoice
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint("thermal");
                            setTimeout(() => setIsPrintMenuOpen(false), 200);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                            darkMode
                              ? "hover:bg-white/10 text-white"
                              : "hover:bg-emerald-50 text-emerald-950"
                          }`}
                        >
                          <Ticket
                            size={14}
                            className={
                              darkMode ? "text-white/50" : "text-emerald-700/50"
                            }
                          />
                          Thermal Receipt
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onClose}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      darkMode
                        ? "bg-white/5 text-white/40 hover:bg-white/10"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
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
                        darkMode
                          ? "bg-white/2 border-white/5 hover:bg-white/5"
                          : "bg-white border-gray-100 hover:border-emerald-100 shadow-sm"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-500">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary text-white rounded-full flex items-center justify-center text-[7px] font-black shadow-lg border-2 border-surface">
                          {item.quantity}
                        </div>
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${darkMode ? "bg-white/10 text-on-surface-variant" : "bg-emerald-100/50 text-emerald-800"}`}
                          >
                            {item.unit || "Unit"}
                          </span>
                        </div>
                        <h4 className="text-sm font-black tracking-tight truncate leading-none mb-1">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1 opacity-50">
                          <Tag size={10} />
                          <span className="text-[9px] font-bold">
                            {formatPrice(item.price)} each
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mb-0.5 leading-none">
                          Subtotal
                        </p>
                        <p className="text-base font-black tracking-tighter leading-none">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Order total footer */}
              <div
                className={`px-6 py-2 border-t mt-auto ${darkMode ? "border-white/5 bg-white/[0.01]" : "border-gray-100 bg-gray-50/30"}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-2">
                    {order.note && (
                      <div className="max-w-md">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1">
                          Note from Customer
                        </p>
                        <p className="text-xs font-bold opacity-70 leading-relaxed italic line-clamp-1">
                          "{order.note}"
                        </p>
                      </div>
                    )}
                    <div className={`flex items-center w-full lg:w-auto p-1.5 rounded-2xl border shadow-sm transition-colors ${darkMode ? "bg-surface-container-high border-on-surface/10" : "bg-white border-slate-200"}`}>
                      <button
                        onClick={() => handleStatusUpdate(order.id, "cancelled")}
                        disabled={isUpdating !== null}
                        className={`flex-1 lg:flex-none px-4 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[10px] uppercase tracking-widest ${
                          order.status === "cancelled"
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                            : darkMode
                              ? "text-rose-400 hover:bg-rose-500/10"
                              : "text-rose-600 hover:bg-rose-50"
                        }`}
                      >
                        {isUpdating === "cancelled" ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                      
                      <div className={`w-[1px] h-5 mx-1 ${darkMode ? "bg-on-surface/10" : "bg-slate-200"}`} />
                      
                      <button
                        onClick={() => handleStatusUpdate(order.id, order.status === "pending" ? "packing" : "pending")}
                        disabled={isUpdating !== null}
                        className={`flex-1 lg:flex-none px-4 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[10px] uppercase tracking-widest ${
                          order.status === "pending"
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                            : darkMode
                              ? "text-amber-400 hover:bg-amber-500/10"
                              : "text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        {isUpdating === "pending" ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Clock size={14} />
                        )}
                        <span className="hidden sm:inline">Hold</span>
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(order.id, order.status === "packing" ? "delivered" : "packing")}
                        disabled={isUpdating !== null}
                        className={`flex-1 lg:flex-none px-4 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[10px] uppercase tracking-widest ${
                          order.status === "packing"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : darkMode
                              ? "text-blue-400 hover:bg-blue-500/10"
                              : "text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {isUpdating === "packing" ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Package size={14} />
                        )}
                        <span className="hidden sm:inline">Ready</span>
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(order.id, "delivered")}
                        disabled={isUpdating !== null}
                        className={`flex-1 lg:flex-none px-4 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[10px] uppercase tracking-widest ${
                          order.status === "delivered"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : darkMode
                              ? "text-emerald-400 hover:bg-emerald-500/10"
                              : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {isUpdating === "delivered" ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        <span className="hidden sm:inline">Done</span>
                      </button>
                    </div>
                  </div>{" "}
                  <div className="text-right min-w-[200px]">
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center justify-between gap-4 opacity-40">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                          Subtotal
                        </span>
                        <span className="text-[10px] font-bold font-mono">
                          {formatPrice(
                            order.items.reduce(
                              (acc, item) => acc + item.price * item.quantity,
                              0,
                            ),
                          )}
                        </span>
                      </div>

                      {order.deliveryFee > 0 && (
                        <div
                          className={`flex items-center justify-between gap-4 px-2 py-1 rounded-lg border border-dashed ${darkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}
                        >
                          <div className="flex items-center gap-1">
                            <Truck size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              Delivery Fee
                            </span>
                          </div>
                          <span className="text-[10px] font-black">
                            +{formatPrice(order.deliveryFee)}
                          </span>
                        </div>
                      )}

                      {order.pointDiscount > 0 && (
                        <div
                          className={`flex items-center justify-between gap-4 px-2 py-1 rounded-lg border border-dashed ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-500" : "bg-rose-50 border-rose-100 text-rose-700"}`}
                        >
                          <div className="flex items-center gap-1">
                            <Sparkles size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              Points Disc.
                            </span>
                          </div>
                          <span className="text-[10px] font-black">
                            -{formatPrice(order.pointDiscount)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between border-t border-dashed pt-2 mt-2 gap-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${darkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-amber-50 border-amber-100 text-amber-700"}`}
                      >
                        <Sparkles size={9} className="animate-pulse" />
                        <span className="text-[7px] font-black uppercase tracking-widest">
                          +{order.earnedPoints || 0} PTS
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30 mb-0.5">
                          Final Amount
                        </p>
                        <h4
                          className={`text-2xl font-black tracking-tighter leading-none ${darkMode ? "text-primary" : "text-emerald-950"}`}
                        >
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

function BannerManagement({
  banners,
  add,
  update,
  remove,
  reorder,
  darkMode,
  globalSearch,
}: any) {
  const sortedBannersForAdmin = [...banners].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  const filteredBanners = sortedBannersForAdmin.filter((b: any) => {
    const s = globalSearch?.toLowerCase() || "";
    return b.title?.toLowerCase().includes(s);
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    isActive: true,
  });

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...sortedBannersForAdmin];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newBanners.length) {
      [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
      await reorder(newBanners);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (editingBanner) {
      await update(editingBanner.id, formData);
      setEditingBanner(null);
    } else {
      await add({
        ...formData,
        type: "ad",
        tag: "promo",
        subtitle: "",
        color: "bg-transparent",
      });
    }
    setShowAdd(false);
    setFormData({ title: "", image: "", isActive: true });
  };

  const startEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      image: banner.image || "",
      isActive: banner.isActive !== false,
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-10">
      {/* Header Section with Glassmorphism */}
      <div className={`p-8 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border backdrop-blur-xl ${darkMode ? "bg-white/5 border-white/10" : "bg-white/80 border-emerald-100 shadow-2xl shadow-emerald-900/5"}`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-8 rounded-full ${darkMode ? "bg-primary" : "bg-emerald-600"}`} />
            <h3 className={`text-2xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
              Campaign Studio
            </h3>
          </div>
          <p className="text-[10px] opacity-40 font-bold uppercase tracking-[0.3em] ml-5">
            Craft your store's visual storytelling
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (showAdd) {
              setShowAdd(false);
              setTimeout(() => {
                setEditingBanner(null);
                setFormData({ title: "", image: "", isActive: true });
              }, 300);
            } else {
              setShowAdd(true);
            }
          }}
          className={`px-6 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] ${
            showAdd 
              ? (darkMode ? "bg-red-500/10 text-red-500" : "bg-red-50/80 text-red-600 border border-red-100")
              : (darkMode ? "bg-primary text-surface shadow-lg shadow-primary/20" : "bg-emerald-950 text-white shadow-2xl shadow-emerald-950/20")
          }`}
        >
          {showAdd ? <X size={18} /> : <Plus size={18} />}
          <span>{showAdd ? "Close Editor" : "New Campaign"}</span>
        </motion.button>
      </div>

      {/* Add/Edit Form - Compact & Premium */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="flex justify-center"
          >
            <form
              onSubmit={handleSubmit}
              className={`w-full max-w-2xl p-8 md:p-10 rounded-[3rem] border space-y-8 relative overflow-hidden ${
                darkMode ? "bg-surface-container border-white/10 shadow-3xl" : "bg-white border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]"
              }`}
            >
              {/* Subtle Decorative Element */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
              
              <div className="flex items-center gap-5 relative">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-inner ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-600"}`}>
                  {editingBanner ? <Edit2 size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
                </div>
                <div>
                  <h4 className={`text-xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
                    {editingBanner ? "Refine Campaign" : "Draft New Story"}
                  </h4>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-30 mt-0.5">Campaign identities & visual assets</p>
                </div>
              </div>

              <div className="space-y-6 relative">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">
                    Display Heading
                  </label>
                  <div className="group relative">
                    <input
                      className={`w-full p-5 rounded-2xl border font-bold text-sm outline-none transition-all pl-14 ${
                        darkMode 
                          ? "bg-white/5 border-white/10 focus:border-primary focus:bg-white/10" 
                          : "bg-gray-50/50 border-gray-100 focus:border-emerald-900 focus:bg-white focus:shadow-xl focus:shadow-emerald-900/5"
                      }`}
                      placeholder="Give your campaign a bold title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                    <FileText size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? "opacity-20 group-focus-within:text-primary group-focus-within:opacity-100" : "opacity-30 group-focus-within:text-emerald-900 group-focus-within:opacity-100"}`} />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">
                    Visual Source URL
                  </label>
                  <div className="group relative">
                    <input
                      className={`w-full p-5 rounded-2xl border font-bold text-sm outline-none transition-all pl-14 ${
                        darkMode 
                          ? "bg-white/5 border-white/10 focus:border-primary focus:bg-white/10" 
                          : "bg-gray-50/50 border-gray-100 focus:border-emerald-900 focus:bg-white focus:shadow-xl focus:shadow-emerald-900/5"
                      }`}
                      placeholder="https://images.unsplash.com/promo-banner..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      required
                    />
                    <ImageIcon size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? "opacity-20 group-focus-within:text-primary group-focus-within:opacity-100" : "opacity-30 group-focus-within:text-emerald-900 group-focus-within:opacity-100"}`} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-6 border-t border-on-surface/5 relative">
                <div className={`flex items-center gap-4 p-2 pl-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Visibility</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.isActive 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {formData.isActive ? "Live Now" : "Hidden"}
                  </button>
                </div>
                
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  type="submit"
                  className={`flex-1 w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all ${
                    darkMode 
                      ? "bg-primary text-surface shadow-xl shadow-primary/30 hover:bg-primary/90" 
                      : "bg-emerald-950 text-white hover:bg-emerald-900 shadow-2xl shadow-emerald-950/20"
                  }`}
                >
                  {editingBanner ? "Synchronize Changes" : "Deploy Campaign"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banners Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Active Campaigns</h4>
          <div className="h-px flex-1 mx-6 bg-current opacity-5" />
          <span className="text-[10px] font-black opacity-30">{filteredBanners.length} Objects</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredBanners.map((banner: any, idx: number) => (
              <motion.div
                layout
                key={banner.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group p-0 rounded-[2.5rem] border relative overflow-hidden h-[240px] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] ${
                  darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xl shadow-emerald-900/5"
                }`}
              >
                {/* Visual Content */}
                <div className="absolute inset-0 grayscale-[0.3] scale-105 group-hover:grayscale-0 group-hover:scale-100 transition-all duration-1000">
                  <img
                    src={banner.image}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Depth Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-500 group-hover:opacity-70" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Card Top Branding & Controls */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30 transform -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMove(idx, 'up'); }}
                      disabled={idx === 0}
                      className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white hover:text-black transition-all disabled:opacity-0"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMove(idx, 'down'); }}
                      disabled={idx === filteredBanners.length - 1}
                      className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white hover:text-black transition-all disabled:opacity-0"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-3xl border ${
                    banner.isActive 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                      : "bg-white/10 text-white/40 border-white/10"
                  }`}>
                    {banner.isActive ? "Synchronized" : "Paused"}
                  </div>
                </div>

                {/* Content & Primary Actions */}
                <div className="absolute inset-x-0 bottom-0 p-8 z-30">
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1 min-w-0 transform group-hover:-translate-y-1 transition-transform duration-500">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/50 mb-1.5 flex items-center gap-2">
                        <span className="w-4 h-[1px] bg-primary" />
                        Campaign Asset
                      </p>
                      <h4 className="font-black text-white text-xl leading-tight truncate drop-shadow-2xl">
                        {banner.title}
                      </h4>
                    </div>

                    <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); startEdit(banner); }}
                        className="w-12 h-12 bg-white text-emerald-950 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-primary hover:text-white transition-all"
                      >
                        <Edit2 size={18} strokeWidth={2.5} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); remove(banner.id); }}
                        className="w-12 h-12 bg-red-500/20 backdrop-blur-xl text-red-100 border border-red-500/30 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Full Card Interactive Overlay */}
                <button 
                  onClick={() => update(banner.id, { isActive: !banner.isActive })}
                  className="absolute inset-0 z-10 w-full h-full"
                  title="Quick Toggle"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DealManagement({
  deals,
  add,
  update,
  remove,
  darkMode,
  formatPrice,
  globalSearch,
}: any) {
  const filteredDeals = deals.filter((d: any) => {
    const s = globalSearch?.toLowerCase() || "";
    return (
      d.title?.toLowerCase().includes(s) ||
      d.titleMm?.toLowerCase().includes(s) ||
      d.discount?.toLowerCase().includes(s)
    );
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: "daily-deal",
    title: "",
    titleMm: "",
    originalPrice: "",
    price: "",
    discount: "",
    image: "",
    endTime: "",
    soldCount: 0,
    totalCount: 100,
    description: "",
    descriptionMm: "",
    isActive: true,
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = {
      ...formData,
      originalPrice: Number(formData.originalPrice),
      price: Number(formData.price),
      totalCount: Number(formData.totalCount),
    };

    if (editingDeal) {
      await update(editingDeal.id, payload);
      setEditingDeal(null);
    } else {
      await add(payload);
    }
    
    setShowAdd(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: "daily-deal",
      title: "",
      titleMm: "",
      originalPrice: "",
      price: "",
      discount: "",
      image: "",
      endTime: "",
      soldCount: 0,
      totalCount: 100,
      description: "",
      descriptionMm: "",
      isActive: true,
    });
  };

  const startEdit = (deal: any) => {
    setEditingDeal(deal);
    setFormData({
      ...deal,
      originalPrice: String(deal.originalPrice),
      price: String(deal.price),
      totalCount: String(deal.totalCount),
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className={`p-8 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border backdrop-blur-xl ${darkMode ? "bg-white/5 border-white/10" : "bg-white/80 border-emerald-100 shadow-2xl shadow-emerald-900/5"}`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-8 rounded-full ${darkMode ? "bg-primary" : "bg-orange-500"}`} />
            <h3 className={`text-2xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
              Daily Deals
            </h3>
          </div>
          <p className="text-[10px] opacity-40 font-bold uppercase tracking-[0.3em] ml-5">
            Flash sales & time-limited opportunities
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (showAdd) {
              setShowAdd(false);
              setTimeout(() => { setEditingDeal(null); resetForm(); }, 300);
            } else {
              setShowAdd(true);
            }
          }}
          className={`px-6 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] ${
            showAdd 
              ? (darkMode ? "bg-red-500/10 text-red-500" : "bg-red-50/80 text-red-600 border border-red-100")
              : (darkMode ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-orange-600 text-white shadow-2xl shadow-orange-600/20")
          }`}
        >
          {showAdd ? <X size={18} /> : <Zap size={18} />}
          <span>{showAdd ? "Discard Changes" : "New Flash Deal"}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="flex justify-center"
          >
            <form
              onSubmit={handleSubmit}
              className={`w-full max-w-4xl p-8 md:p-10 rounded-[3rem] border space-y-8 relative overflow-hidden ${
                darkMode ? "bg-surface-container border-white/10 shadow-3xl" : "bg-white border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]"
              }`}
            >
              <div className="flex items-center gap-5 relative">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-inner ${darkMode ? "bg-white/5 text-primary" : "bg-orange-50 text-orange-600"}`}>
                  {editingDeal ? <Edit2 size={24} strokeWidth={2.5} /> : <Zap size={24} strokeWidth={2.5} />}
                </div>
                <div>
                  <h4 className={`text-xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
                    {editingDeal ? "Refine Deal Details" : "Launch Flash Sale"}
                  </h4>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-30 mt-0.5">Define constraints and pricing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Titles</label>
                    <div className="space-y-3">
                      <input
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        placeholder="Deal Title (English)"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                      <input
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        placeholder="Deal Title (မြန်မာ)"
                        value={formData.titleMm}
                        onChange={(e) => setFormData({ ...formData, titleMm: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Original Price</label>
                      <input
                        type="number"
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        placeholder="25000"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Special Price</label>
                      <input
                        type="number"
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        placeholder="18000"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Visual Asset & End Time</label>
                    <div className="space-y-3">
                      <input
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        placeholder="Image URL"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        required
                      />
                      <input
                        type="datetime-local"
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Discount Text</label>
                      <input
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        placeholder="e.g. 50% OFF"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Total Spots</label>
                      <input
                        type="number"
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-gray-50 border-gray-100"}`}
                        placeholder="50"
                        value={formData.totalCount}
                        onChange={(e) => setFormData({ ...formData, totalCount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-6 border-t border-on-surface/5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.isActive ? "bg-emerald-500 text-white" : "bg-gray-400 text-white"
                  }`}
                >
                  {formData.isActive ? "Deal Live" : "Draft Status"}
                </button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  type="submit"
                  className={`flex-1 w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all ${
                    darkMode ? "bg-primary text-surface shadow-xl" : "bg-emerald-950 text-white hover:bg-emerald-900"
                  }`}
                >
                  {editingDeal ? "Update Flash Sale" : "Release Flash Sale"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredDeals.map((deal: any) => (
            <motion.div
              layout
              key={deal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group p-6 rounded-[2.5rem] border relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xl shadow-emerald-900/5"
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                    <img src={deal.image} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm tracking-tight leading-tight max-w-[120px] truncate">{deal.title}</h4>
                    <p className="text-[9px] font-bold text-gray-400 truncate max-w-[120px]">{deal.titleMm}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                    deal.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-500"
                  }`}>
                    {deal.isActive ? "Live" : "Inactive"}
                  </div>
                  <button
                    onClick={() => update(deal.id, { isActive: !deal.isActive })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 border-2 ${
                      deal.isActive 
                        ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                        : `border-transparent ${darkMode ? "bg-white/10" : "bg-gray-200"}`
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${deal.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-on-surface/5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-primary block">{formatPrice(deal.price)}</span>
                  <span className="text-[8px] text-gray-400 line-through font-bold opacity-60 italic">{formatPrice(deal.originalPrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sold Out</span>
                  <div className="h-1 w-20 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(deal.soldCount / deal.totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => startEdit(deal)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                    darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-gray-50 border-gray-100 hover:bg-white hover:border-primary"
                  }`}
                >
                  <Edit2 size={14} />
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => remove(deal.id)}
                  className="w-12 py-3 rounded-xl flex items-center justify-center text-red-500 border border-red-500/10 bg-red-500/5 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BundleManagement({
  bundles,
  add,
  update,
  remove,
  darkMode,
  formatPrice,
  globalSearch,
}: any) {
  const filteredBundles = bundles.filter((b: any) => {
    const s = globalSearch?.toLowerCase() || "";
    return b.title?.toLowerCase().includes(s) || b.titleMm?.toLowerCase().includes(s);
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    titleMm: "",
    description: "",
    descriptionMm: "",
    originalPrice: "",
    price: "",
    image: "",
    items: "",
    isActive: true,
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = {
      ...formData,
      originalPrice: Number(formData.originalPrice),
      price: Number(formData.price),
      items: formData.items.split(",").map((i: string) => i.trim()).filter(Boolean),
      type: "bundle",
    };

    if (editingBundle) {
      await update(editingBundle.id, payload);
      setEditingBundle(null);
    } else {
      await add(payload);
    }
    
    setShowAdd(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      titleMm: "",
      description: "",
      descriptionMm: "",
      originalPrice: "",
      price: "",
      image: "",
      items: "",
      isActive: true,
    });
  };

  const startEdit = (bundle: any) => {
    setEditingBundle(bundle);
    setFormData({
      ...bundle,
      originalPrice: String(bundle.originalPrice || ""),
      price: String(bundle.price || ""),
      items: (bundle.items || []).join(", "),
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className={`p-8 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border backdrop-blur-xl ${darkMode ? "bg-white/5 border-white/10" : "bg-white/80 border-cyan-100 shadow-2xl shadow-cyan-900/5"}`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-8 rounded-full ${darkMode ? "bg-primary" : "bg-cyan-500"}`} />
            <h3 className={`text-2xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
              Combo Bundles
            </h3>
          </div>
          <p className="text-[10px] opacity-40 font-bold uppercase tracking-[0.3em] ml-5">
            Craft high-value product pairings
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (showAdd) {
              setShowAdd(false);
              setTimeout(() => { setEditingBundle(null); resetForm(); }, 300);
            } else {
              setShowAdd(true);
            }
          }}
          className={`px-6 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] ${
            showAdd 
              ? (darkMode ? "bg-red-500/10 text-red-500" : "bg-red-50/80 text-red-600 border border-red-100")
              : (darkMode ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-cyan-700 text-white shadow-2xl shadow-cyan-700/20")
          }`}
        >
          {showAdd ? <X size={18} /> : <Package size={18} />}
          <span>{showAdd ? "Abort Changes" : "Create New Combo"}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <form
              onSubmit={handleSubmit}
              className={`p-10 rounded-[3rem] border space-y-8 relative overflow-hidden ${
                darkMode ? "bg-surface-container border-white/10" : "bg-white border-gray-100 shadow-2xl"
              }`}
            >
              <div className="flex items-center gap-5 relative">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-inner ${darkMode ? "bg-white/5 text-cyan-400" : "bg-cyan-50 text-cyan-600"}`}>
                  <Package size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className={`text-xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
                    {editingBundle ? "Update Combo Recipe" : "Design New Combo"}
                  </h4>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-30 mt-0.5">Bundle your best-sellers together</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Bundle Naming</label>
                    <input
                      className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                      placeholder="Special Family Combo (EN)"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                    <input
                      className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                      placeholder="Special Family Combo (MM)"
                      value={formData.titleMm}
                      onChange={(e) => setFormData({ ...formData, titleMm: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Included Items (Comma separated)</label>
                    <textarea
                      rows={2}
                      className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                      placeholder="Pizza, Coke, Wings..."
                      value={formData.items}
                      onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Normal Value</label>
                      <input
                        type="number"
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Bundle Price</label>
                      <input
                        type="number"
                        className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Cover Asset URL</label>
                    <input
                      className={`w-full p-4 rounded-xl border font-bold text-sm outline-none transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                      placeholder="Cover image link"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all ${
                    darkMode ? "bg-primary text-surface shadow-xl" : "bg-cyan-800 text-white hover:bg-cyan-900"
                  }`}
                >
                  {editingBundle ? "Commit Bundle Updates" : "Activate Bundle Campaign"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredBundles.map((bundle: any) => (
            <motion.div
              layout
              key={bundle.id}
              className={`group p-8 rounded-[3rem] border relative overflow-hidden transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl ${
                darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-xl"
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-3xl overflow-hidden glass shadow-2xl">
                  <img src={bundle.image} className="w-full h-full object-cover" />
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-base truncate">{bundle.title}</h4>
                      <button
                        onClick={() => update(bundle.id, { isActive: !bundle.isActive })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 border-2 ${
                          bundle.isActive 
                            ? "bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
                            : `border-transparent ${darkMode ? "bg-white/10" : "bg-gray-200"}`
                        }`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${bundle.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(bundle.items || []).slice(0, 2).map((item: string, i: number) => (
                        <span key={i} className="text-[7px] font-black uppercase tracking-tighter bg-on-surface/5 px-2 py-1 rounded-full opacity-60 italic">{item}</span>
                      ))}
                      {(bundle.items || []).length > 2 && <span className="text-[7px] font-black opacity-40 ml-1">+{(bundle.items || []).length - 2} more</span>}
                    </div>
                  </div>
              </div>

              <div className="flex items-end justify-between border-t border-on-surface/5 pt-6">
                <div>
                  <span className="text-[10px] font-black text-cyan-500 block mb-1 uppercase tracking-widest leading-none">Price Value</span>
                  <span className="text-xl font-black">{formatPrice(bundle.price)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(bundle)} className="p-3 bg-on-surface/5 rounded-2xl hover:bg-primary hover:text-white transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => remove(bundle.id)} className="p-3 bg-red-500/5 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CategoriesTab({
  darkMode,
  t,
  globalSearch,
}: {
  darkMode: boolean;
  t: any;
  globalSearch?: string;
}) {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    products,
    deals,
    addDeal,
    updateDeal,
    deleteDeal,
    bundles,
    addBundle,
    updateBundle,
    deleteBundle,
    formatPrice,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<"list" | "deals" | "bundles">(
    "list",
  );

  const filteredCategories = categories.filter((c) => {
    const s = globalSearch?.toLowerCase() || "";
    return (
      c.key.toLowerCase().includes(s) || t(c.key).toLowerCase().includes(s)
    );
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategory, setNewCategory] = useState({
    key: "",
    nameEn: "",
    nameMm: "",
    order: categories.length,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.key) return;
    
    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        key: newCategory.key,
        nameEn: newCategory.nameEn,
        nameMm: newCategory.nameMm,
        order: Number(newCategory.order),
      });
      setEditingCategory(null);
    } else {
      await addCategory({
        key: newCategory.key,
        nameEn: newCategory.nameEn,
        nameMm: newCategory.nameMm,
        isActive: true,
        order: Number(newCategory.order),
      });
    }
    
    setNewCategory({ key: "", nameEn: "", nameMm: "", order: categories.length + 1 });
    setShowAdd(false);
  };

  const startEdit = (cat: any) => {
    setEditingCategory(cat);
    setNewCategory({
      key: cat.key,
      nameEn: cat.nameEn || "",
      nameMm: cat.nameMm || "",
      order: cat.order,
    });
    setShowAdd(true);
  };

  const moveOrder = async (cat: any, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? cat.order - 1 : cat.order + 1;
    await updateCategory(cat.id, { order: newOrder });
    toast.success(`Position updated`);
  };

  const getCategoryIcon = (key: string) => {
    const iconSize = 18;
    switch (key) {
      case 'all': return <LayoutDashboard size={iconSize} />;
      case 'deals': return <Zap size={iconSize} className="fill-orange-500 text-orange-500" />;
      case 'bundles': return <Sparkles size={iconSize} className="text-cyan-500" />;
      
      // Core food categories
      case 'meat': 
      case 'poultry':
      case 'meat-poultry': return <Beef size={iconSize} />;
      case 'seafood': 
      case 'fish': return <Fish size={iconSize} />;
      case 'vegetables': 
      case 'fresh-produce': 
      case 'fruits': return <Carrot size={iconSize} />;
      case 'dairy':
      case 'eggs':
      case 'dairy-eggs':
      case 'dairyAndEggs': return <Egg size={iconSize} />;
      case 'ready-to-eat':
      case 'readyToEat': 
      case 'prepared-meals': return <Soup size={iconSize} />;
      case 'dry-goods':
      case 'pantry':
      case 'dryGoods': return <Wheat size={iconSize} />;
      case 'kitchen': 
      case 'home-essentials': return <UtensilsCrossed size={iconSize} />;
      case 'spices': 
      case 'seasonings': return <Flame size={iconSize} className="text-orange-600" />;
      case 'beverages': 
      case 'drinks': return <Wine size={iconSize} />;
      case 'snacks': 
      case 'confectionery': return <Candy size={iconSize} />;
      
      // Legacy/Misc categories
      case 'frozen-foods': return <Snowflake size={iconSize} />;
      case 'baby-care': return <Baby size={iconSize} />;
      case 'pet-care': return <Dog size={iconSize} />;
      case 'household': return <Home size={iconSize} />;
      case 'personal-care': return <Smile size={iconSize} />;
      case 'health-wellness': return <Pill size={iconSize} />;
      case 'office-supplies': return <Briefcase size={iconSize} />;
      
      default: return <Store size={iconSize} />;
    }
  };

  const stats = [
    { label: 'Total', value: categories.length, icon: ListChecks, color: darkMode ? 'text-blue-400' : 'text-blue-600', bg: darkMode ? 'bg-blue-400/10' : 'bg-blue-50' },
    { label: 'Active', value: categories.filter(c => c.isActive !== false).length, icon: CheckCircle2, color: darkMode ? 'text-emerald-400' : 'text-emerald-600', bg: darkMode ? 'bg-emerald-400/10' : 'bg-emerald-50' },
    { label: 'Hidden', value: categories.filter(c => c.isActive === false).length, icon: EyeOff, color: darkMode ? 'text-rose-400' : 'text-rose-600', bg: darkMode ? 'bg-rose-400/10' : 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <div className={`p-1.5 rounded-[1.25rem] flex gap-1 border transition-all duration-300 ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-100/50 border-gray-100"}`}>
        {[
          { id: "list", label: "Category List", icon: ListChecks },
          { id: "deals", label: "Daily Deals", icon: Zap },
          { id: "bundles", label: "Combo Packs", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.9rem] font-black text-[9px] uppercase tracking-[0.15em] transition-all duration-300 ${
              activeSubTab === tab.id
                ? darkMode
                  ? "bg-primary text-surface shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
                  : "bg-white text-emerald-950 shadow-sm border border-black/[0.02]"
                : "text-on-surface/30 hover:text-on-surface/60"
            }`}
          >
            <tab.icon size={12} strokeWidth={3} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === "list" && (
            <div className="space-y-6">
              {/* Compact Header & Stats Row */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className={`flex-1 p-6 rounded-3xl border flex items-center justify-between ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-6 rounded-full ${darkMode ? "bg-primary" : "bg-emerald-500"}`} />
                    <div>
                      <h2 className={`text-lg font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
                        Category Hub
                      </h2>
                      <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest leading-none">Management</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (window.confirm("Restore default categories?")) {
                          try {
                            await seedDatabase();
                            toast.success("Defaults restored");
                          } catch (err) { toast.error("Failed"); }
                        }
                      }}
                      className={`h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${darkMode ? "bg-white/5 text-on-surface border-white/10" : "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      Defaults
                    </button>
                    <button
                      onClick={() => {
                        if (showAdd) {
                          setShowAdd(false);
                          setEditingCategory(null);
                          setNewCategory({ key: "", order: categories.length });
                        } else {
                          setShowAdd(true);
                        }
                      }}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${darkMode ? "bg-primary/10 text-primary border border-primary/20" : "bg-emerald-600 text-white shadow-lg shadow-emerald-200"}`}
                    >
                      {showAdd ? <X size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {stats.map((s, i) => (
                    <div key={i} className={`flex-none min-w-[100px] px-5 py-4 rounded-2xl border flex items-center gap-3 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                        <s.icon size={14} className={s.color} />
                      </div>
                      <div>
                        <p className="text-[7px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">{s.label}</p>
                        <p className={`text-sm font-black tracking-tighter leading-none ${darkMode ? "text-white" : "text-emerald-950"}`}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {showAdd && (
                <form
                  onSubmit={handleAdd}
                  className={`p-6 rounded-3xl border space-y-4 ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Key</label>
                      <input
                        className={`w-full p-4 rounded-xl border font-black text-xs outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-white border-gray-200 focus:border-emerald-500"}`}
                        placeholder="e.g. fresh-fruit"
                        value={newCategory.key}
                        onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Menu Order</label>
                      <input
                        type="number"
                        className={`w-full p-4 rounded-xl border font-black text-xs outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-white border-gray-200 focus:border-emerald-500"}`}
                        value={newCategory.order}
                        onChange={(e) => setNewCategory({ ...newCategory, order: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Name (English)</label>
                      <input
                        className={`w-full p-4 rounded-xl border font-black text-xs outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-white border-gray-200 focus:border-emerald-500"}`}
                        placeholder="Fresh Fruit"
                        value={newCategory.nameEn}
                        onChange={(e) => setNewCategory({ ...newCategory, nameEn: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Name (Myanmar)</label>
                      <input
                        className={`w-full p-4 rounded-xl border font-black text-xs outline-none transition-all ${darkMode ? "bg-white/5 border-white/10 focus:border-primary" : "bg-white border-gray-100 placeholder-opacity-20 font-sans"}`}
                        placeholder="လတ်ဆတ်သော သစ်သီးများ"
                        value={newCategory.nameMm}
                        onChange={(e) => setNewCategory({ ...newCategory, nameMm: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${darkMode ? "bg-primary text-surface shadow-lg" : "bg-emerald-600 text-white shadow-lg shadow-emerald-200"}`}
                  >
                    {editingCategory ? "Update Category" : "Confirm Register"}
                  </button>
                </form>
              )}

              {/* Enhanced Grid/List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredCategories
                  .filter((c) => c.id !== "all")
                  .sort((a, b) => a.order - b.order)
                  .map((cat) => (
                    <motion.div
                      layout
                      key={cat.id}
                      className={`p-4 rounded-2xl border flex flex-col group transition-all duration-300 ${
                        darkMode 
                          ? "bg-white/5 border-white/10 hover:bg-white/[0.08]" 
                          : "bg-white border-gray-100 hover:shadow-lg hover:shadow-gray-200/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              darkMode ? "bg-white/5 text-primary border border-white/5" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                          >
                            {getCategoryIcon(cat.key || cat.id)}
                          </div>
                          <div>
                            <h4 className="font-black text-[11px] uppercase tracking-widest truncate max-w-[120px]">
                              {t(cat.key)}
                            </h4>
                            <div className="flex items-center gap-2">
                              <p className="text-[8px] opacity-40 font-bold tracking-widest leading-none mt-0.5">
                                {cat.key}
                              </p>
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${darkMode ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500"}`}>
                                {products.filter(p => p.category === cat.key).length} Items
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => updateCategory(cat.id, { isActive: cat.isActive === false ? true : false })}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 border-2 ${
                            cat.isActive !== false 
                              ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                              : `border-transparent ${darkMode ? "bg-white/10" : "bg-gray-200"}`
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${cat.isActive !== false ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>

                      <div className="mt-auto pt-3 flex items-center justify-between border-t border-dashed border-on-surface/5">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => moveOrder(cat, 'up')}
                            className={`p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors`}
                          >
                            <ChevronUp size={12} />
                          </button>
                          <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${darkMode ? "bg-white/5 opacity-50" : "bg-gray-50 opacity-60"}`}>
                            {cat.order}
                          </div>
                          <button 
                            onClick={() => moveOrder(cat, 'down')}
                            className={`p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors`}
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(cat)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`}
                            title="Edit"
                          >
                            <Settings size={14} />
                          </button>
                          <button
                            onClick={() => {
                              toast("Delete this category?", {
                                description: "This action cannot be undone.",
                                action: {
                                  label: "Delete",
                                  onClick: () => deleteCategory(cat.id)
                                },
                                cancel: {
                                  label: "Cancel",
                                  onClick: () => {}
                                }
                              });
                            }}
                            className={`p-2 rounded-lg transition-all active:scale-95 ${darkMode ? "text-rose-400 hover:bg-rose-400/10" : "text-rose-600 hover:bg-rose-50"}`}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {activeSubTab === "deals" && (
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
          {activeSubTab === "bundles" && (
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

function SpecialOffersTab() {
  return null;
}

function AdBannersTab({
  darkMode,
  t,
  globalSearch,
}: {
  darkMode: boolean;
  t: any;
  globalSearch?: string;
}) {
  const {
    promotionBanners,
    addPromotionBanner,
    updatePromotionBanner,
    deletePromotionBanner,
    reorderPromotionBanners,
  } = useStore();

  return (
    <div className="space-y-8">
      <BannerManagement
        banners={promotionBanners}
        add={addPromotionBanner}
        update={updatePromotionBanner}
        remove={deletePromotionBanner}
        reorder={reorderPromotionBanners}
        darkMode={darkMode}
        globalSearch={globalSearch}
      />
    </div>
  );
}

import { uploadProductImage } from "../services/uploadService";

function UsersTab({
  users,
  orders = [],
  darkMode,
  updateUserPoints,
  globalSearch,
}: {
  users: any[];
  orders?: any[];
  darkMode: boolean;
  updateUserPoints: (uid: string, p: number) => Promise<void>;
  globalSearch?: string;
}) {
  const [editingPointsId, setEditingPointsId] = React.useState<string | null>(null);
  const [newPointsVal, setNewPointsVal] = React.useState<string>("");

  const filteredUsers = users.filter((u) => {
    const s = globalSearch?.toLowerCase() || "";
    return (
      u.name?.toLowerCase().includes(s) ||
      u.phone?.includes(s) ||
      u.room?.includes(s) ||
      u.id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Customer Management
          </h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">
            {filteredUsers.length} Total Customers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredUsers.map((user, i) => (
          <div
            key={user.uid || user.id || `user-${i}`}
            className={`relative p-3.5 rounded-2xl border overflow-hidden transition-all flex flex-col h-full ${darkMode ? "bg-surface-container-low border-on-surface/5" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}
          >
            {/* Watermark Silhouette */}
            <User className={`absolute -right-4 -bottom-4 w-32 h-32 pointer-events-none ${darkMode ? "text-white opacity-[0.02]" : "text-slate-900 opacity-[0.03]"}`} />

            <div className="flex items-start gap-3 relative z-10">
              <div
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-sm ring-2 ring-offset-1 ${darkMode ? "bg-surface-container-high text-primary ring-surface/10 ring-offset-surface" : "bg-primary/10 text-primary ring-white ring-offset-white"}`}
              >
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm truncate">
                  {user.name || "Anonymous"}
                </h3>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {user.tier && user.tier !== "Bronze" && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          user.tier === "Gold"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            : user.tier === "Silver"
                              ? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/70"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        }`}
                      >
                        {user.tier}
                      </span>
                    )}
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"}`}>
                        Orders: {user.totalOrders !== undefined ? user.totalOrders : orders.filter(o => o.uid === (user.uid || user.id) || (o.customerPhone === user.phone && user.phone)).length}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {user.room && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${darkMode ? "bg-white/5 text-white/50" : "bg-slate-100 text-slate-500"}`}
                          >
                            Rm: {user.room}
                          </span>
                        )}
                        {user.isBlocked && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-primary">
                  <Sparkles size={12} />
                  <span className="font-black text-base leading-none">{user.points || 0}</span>
                </div>
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-1">
                  Points
                </p>
              </div>
            </div>

            <div
              className={`mt-3 space-y-1.5 relative z-10 flex-1 ${user.isBlocked ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="opacity-40" />
                  <span className={`text-xs font-bold ${user.isBlocked ? "line-through" : ""}`}>{user.phone}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://wa.me/${formatPhoneNumber(user.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-1 rounded-md transition-colors ${darkMode ? "hover:bg-emerald-500/20 text-emerald-500/70 hover:text-emerald-400" : "hover:bg-emerald-100 text-emerald-600/70 hover:text-emerald-700"}`}
                      title="WhatsApp"
                    >
                      <MessageCircle size={12} />
                    </a>
                    <a
                      href={`viber://chat?number=${formatPhoneNumber(user.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-1 rounded-md transition-colors ${darkMode ? "hover:bg-purple-500/20 text-purple-400/70 hover:text-purple-300" : "hover:bg-purple-100 text-purple-600/70 hover:text-purple-700"}`}
                      title="Viber"
                    >
                      <MessageSquare size={12} />
                    </a>
                  </div>
                )}
              </div>
              {user.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={12} className="opacity-40" />
                  <span className={`text-[10px] font-bold opacity-60 truncate ${user.isBlocked ? "line-through" : ""}`}>
                    {user.email}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-1.5 mt-auto pt-4 relative z-20">
              {editingPointsId === (user.uid || user.id) ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="number"
                    value={newPointsVal}
                    onChange={(e) => setNewPointsVal(e.target.value)}
                    className={`flex-1 w-full min-w-0 px-2 py-1.5 rounded-lg text-xs font-black outline-none ${darkMode ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"}`}
                    placeholder="Points"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const uid = user.uid || user.id;
                      const parsed = parseInt(newPointsVal);
                      if (!isNaN(parsed) && uid) {
                        try {
                          await updateUserPoints(uid, parsed);
                          toast.success(`Points updated to ${parsed}`);
                        } catch (e) {
                          toast.error("Failed to update points");
                        }
                      }
                      setEditingPointsId(null);
                    }}
                    className={`p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer`}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setEditingPointsId(null);
                    }}
                    className={`p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setEditingPointsId(user.uid || user.id);
                    setNewPointsVal((user.points || 0).toString());
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer ${darkMode ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary/5 text-primary hover:bg-primary/10"}`}
                >
                  <Plus size={12} />
                  Edit Points
                </button>
              )}
              
              {!editingPointsId && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const uid = user.uid || user.id;
                    if (!uid) return;
                    try {
                      // Dynamically importing to ensure it runs
                      const { doc, updateDoc, deleteField } = await import("firebase/firestore");
                      const { db } = await import("../lib/firebase");
                      
                      if (!user.isBlocked) {
                        const message = window.prompt("Enter block message for user:", "Your account has been temporarily suspended.");
                        if (message === null) return; // User cancelled
                        await updateDoc(doc(db, "users", uid), {
                          isBlocked: true,
                          blockMessage: message
                        });
                        toast.success(`User successfully blocked.`);
                      } else {
                        if (window.confirm("Are you sure you want to unblock this user?")) {
                          await updateDoc(doc(db, "users", uid), {
                            isBlocked: false,
                            blockMessage: deleteField()
                          });
                          toast.success(`User successfully unblocked.`);
                        }
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to update user block status.");
                    }
                  }}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                    user.isBlocked 
                      ? darkMode ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-rose-100 text-rose-700 hover:bg-rose-200" 
                      : darkMode ? "bg-white/5 text-white/50 hover:bg-rose-500/10 hover:text-rose-400" : "bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                  title={user.isBlocked ? "Unblock User" : "Block User"}
                >
                  <Ban size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponsTab({
  coupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  darkMode,
  formatPrice,
  globalSearch,
}: {
  coupons: any[];
  addCoupon: any;
  updateCoupon: any;
  deleteCoupon: any;
  darkMode: boolean;
  formatPrice: any;
  globalSearch?: string;
}) {
  const filteredCoupons = coupons.filter((c) => {
    const s = globalSearch?.toLowerCase() || "";
    return c.code.toLowerCase().includes(s);
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    expiryDate: "",
    usageLimit: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCoupon(newCoupon);
    setIsAdding(false);
    setNewCoupon({
      code: "",
      type: "percentage",
      value: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      expiryDate: "",
      usageLimit: 0,
      isActive: true,
    });
    toast.success("Coupon added successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Coupons & Discounts
          </h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">
            {coupons.length} Active Coupons
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className={`px-6 py-3 rounded-none font-bold text-sm flex items-center gap-2 transition-all ${
            darkMode
              ? "bg-primary text-surface"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
          }`}
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`p-6 rounded-[2rem] border relative overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? "bg-primary/20 text-primary" : "bg-emerald-100 text-emerald-700"}`}
              >
                {coupon.code}
              </div>
              <button
                onClick={() => deleteCoupon(coupon.id)}
                className="p-2 rounded-none text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-3xl font-black">
                {coupon.type === "percentage"
                  ? `${coupon.value}%`
                  : formatPrice(coupon.value)}
                <span className="text-sm opacity-40 ml-2 font-bold uppercase tracking-widest">
                  OFF
                </span>
              </p>
              <p className="text-xs opacity-40 font-bold mt-1">
                Min. Order: {formatPrice(coupon.minOrderAmount)}
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
              <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                Used: {coupon.usageCount || 0} / {coupon.usageLimit || "∞"}
              </div>
              <div
                className={`w-2 h-2 rounded-full ${coupon.isActive ? "bg-emerald-500" : "bg-red-500"}`}
              />
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
              className={`w-full max-w-md p-8 rounded-[2.5rem] ${darkMode ? "bg-surface-container-high text-on-surface" : "bg-white text-gray-900"}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">
                  New Coupon
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                    Coupon Code
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="SUMMER20"
                    value={newCoupon.code}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                      Type
                    </label>
                    <select
                      value={newCoupon.type}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          type: e.target.value as any,
                        })
                      }
                      className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                      Value
                    </label>
                    <input
                      required
                      type="number"
                      value={newCoupon.value}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          value: parseFloat(e.target.value),
                        })
                      }
                      className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={`w-full py-4 rounded-none font-black text-sm transition-all mt-4 ${
                    darkMode
                      ? "bg-primary text-surface"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
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

function _DeprecatedNotificationsTab({
  sendBroadcast,
  broadcastNotifications,
  orders,
  darkMode,
  globalSearch,
}: {
  sendBroadcast: any;
  broadcastNotifications: any[];
  orders: any[];
  darkMode: boolean;
  globalSearch?: string;
}) {
  const allHistory = [
    ...broadcastNotifications.map(n => ({...n, type: 'broadcast', date: n.createdAt?.seconds * 1000})),
    ...orders.map(o => ({
      id: o.id,
      title: `New Order: #${o.orderNumber}`,
      message: `Order for ${o.customerName} - ${o.items.length} items`,
      type: 'order',
      date: o.createdAt?.seconds * 1000
    }))
  ].sort((a, b) => b.date - a.date);

  const filteredHistory = allHistory.filter((n) => {
    const s = globalSearch?.toLowerCase() || "";
    return (
      n.title?.toLowerCase().includes(s) || n.message?.toLowerCase().includes(s)
    );
  });

  const [isSending, setIsSending] = useState(false);
  const [payload, setPayload] = useState({
    title: "",
    message: "",
    type: "promotion" as "promotion" | "system" | "update",
    image: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendBroadcast(payload);
    setIsSending(false);
    setPayload({ title: "", message: "", type: "promotion", image: "" });
    toast.success("Broadcast sent successfully");
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this broadcast?")) {
      try {
        await deleteDoc(doc(db, "broadcastNotifications", id));
        toast.success("Broadcast deleted successfully");
      } catch (error) {
        console.error("Error deleting broadcast:", error);
        toast.error("Failed to delete broadcast");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Broadcast Notifications
          </h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">
            Send messages to all customers
          </p>
        </div>
        <button
          onClick={() => setIsSending(true)}
          className={`px-6 py-3 rounded-none font-bold text-sm flex items-center gap-2 transition-all ${
            darkMode
              ? "bg-primary text-surface"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
          }`}
        >
          <Bell size={18} />
          New Broadcast
        </button>
      </div>

      <div className="space-y-4">
        {filteredHistory.map((notif) => (
          <div
            key={notif.id}
            className={`p-6 rounded-[2rem] border flex gap-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
          >
            <div
              className={`w-12 h-12 rounded-none flex items-center justify-center shrink-0 ${
                notif.type === "promotion"
                  ? "bg-emerald-100 text-emerald-600"
                  : notif.type === "update"
                    ? "bg-blue-100 text-blue-600"
                    : notif.type === "order"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-amber-100 text-amber-600"
              }`}
            >
              <Bell size={24} />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-black text-lg">{notif.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    {new Date(notif.date).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleDeleteBroadcast(notif.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-rose-500 rounded-full transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm opacity-60 font-medium leading-relaxed">
                {notif.message}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    notif.type === "promotion"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {notif.type}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredHistory.length === 0 && (
          <div className="p-12 text-center opacity-40 italic">No notifications or order history found.</div>
        )}
      </div>

      <AnimatePresence>
        {isSending && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md p-8 rounded-[2.5rem] ${darkMode ? "bg-surface-container-high text-on-surface" : "bg-white text-gray-900"}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">
                  Send Broadcast
                </h3>
                <button
                  onClick={() => setIsSending(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                    Title
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="New Promotion!"
                    value={payload.title}
                    onChange={(e) =>
                      setPayload({ ...payload, title: e.target.value })
                    }
                    className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Get 20% off on all items today..."
                    value={payload.message}
                    onChange={(e) =>
                      setPayload({ ...payload, message: e.target.value })
                    }
                    className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all resize-none ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                    Type
                  </label>
                  <select
                    value={payload.type}
                    onChange={(e) =>
                      setPayload({ ...payload, type: e.target.value as any })
                    }
                    className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  >
                    <option value="promotion">Promotion</option>
                    <option value="system">System Alert</option>
                    <option value="update">App Update</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className={`w-full py-4 rounded-none font-black text-sm transition-all mt-4 ${
                    darkMode
                      ? "bg-primary text-surface"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
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

function AuditLogsTab({
  auditLogs,
  darkMode,
  globalSearch,
}: {
  auditLogs: any[];
  darkMode: boolean;
  globalSearch?: string;
}) {
  const filteredLogs = auditLogs.filter((log) => {
    const s = globalSearch?.toLowerCase() || "";
    return (
      log.adminName?.toLowerCase().includes(s) ||
      log.action?.toLowerCase().includes(s) ||
      log.target?.toLowerCase().includes(s) ||
      log.details?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Audit Logs</h2>
        <p className="text-sm opacity-40 font-bold uppercase tracking-widest">
          Track administrative actions
        </p>
      </div>

      <div
        className={`rounded-[2.5rem] border overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b ${darkMode ? "border-white/5" : "border-gray-50"}`}
              >
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">
                  Admin
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">
                  Action
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">
                  Target
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest opacity-40">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-8 py-4">
                    <p className="font-black text-sm">{log.adminName}</p>
                    <p className="text-[10px] opacity-40 font-bold">
                      {log.adminId}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        log.action.includes("delete")
                          ? "bg-red-100 text-red-700"
                          : log.action.includes("add")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {log.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-bold text-sm">{log.target}</p>
                    <p className="text-[10px] opacity-40 font-bold truncate max-w-[200px]">
                      {log.details}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-xs font-bold opacity-60">
                      {log.createdAt?.seconds
                        ? new Date(
                            log.createdAt.seconds * 1000,
                          ).toLocaleString()
                        : "Just now"}
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

function AdminsTab({
  admins,
  addAdmin,
  updateAdminRole,
  removeAdmin,
  darkMode,
  globalSearch,
}: {
  admins: any[];
  addAdmin: any;
  updateAdminRole: any;
  removeAdmin: any;
  darkMode: boolean;
  globalSearch?: string;
}) {
  const filteredAdmins = admins.filter((admin) => {
    const s = globalSearch?.toLowerCase() || "";
    return (
      admin.name?.toLowerCase().includes(s) ||
      admin.email?.toLowerCase().includes(s)
    );
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    uid: "",
    email: "",
    name: "",
    role: "staff" as "superadmin" | "staff",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAdmin(newAdmin);
    setIsAdding(false);
    setNewAdmin({ uid: "", email: "", name: "", role: "staff" });
    toast.success("Admin added successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Admin Management
          </h2>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">
            {admins.length} Total Admins
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className={`px-6 py-3 rounded-none font-bold text-sm flex items-center gap-2 transition-all ${
            darkMode
              ? "bg-primary text-surface"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
          }`}
        >
          <ShieldCheck size={18} />
          Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdmins.map((admin) => (
          <div
            key={admin.uid}
            className={`p-6 rounded-[2rem] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  admin.role === "superadmin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {admin.role}
              </span>
            </div>
            <h4 className="font-black text-lg">{admin.name || "Admin User"}</h4>
            <p className="text-sm opacity-40 font-bold mb-6">{admin.email}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeAdmin(admin.uid)}
                className="flex-grow py-2 rounded-none text-xs font-black uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-500/10 hover:bg-red-100 transition-colors"
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
              className={`w-full max-w-md p-8 rounded-[2.5rem] ${darkMode ? "bg-surface-container-high text-on-surface" : "bg-white text-gray-900"}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">
                  Add New Admin
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                    UID
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Firebase User UID"
                    value={newAdmin.uid}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, uid: e.target.value })
                    }
                    className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdmin.email}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, email: e.target.value })
                    }
                    className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-2">
                    Role
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, role: e.target.value as any })
                    }
                    className={`w-full px-6 py-3 rounded-none border font-bold outline-none focus:border-primary transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                  >
                    <option value="staff">Staff</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className={`w-full py-4 rounded-none font-black text-sm transition-all mt-4 ${
                    darkMode
                      ? "bg-primary text-surface"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
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
    adminOrders: orders,
    updateOrderStatus,
    supportNumber,
    setSupportNumber,
    bankName,
    setBankName,
    bankAccountNumber,
    setBankAccountNumber,
    bankAccountName,
    setBankAccountName,
    currency,
    setCurrency,
    formatPrice,
    darkMode,
    setDarkMode,
    t,
    isDeliveryEnabled,
    setIsDeliveryEnabled,
    deliveryFee,
    setDeliveryFee,
    isLowStockAlertEnabled,
    setIsLowStockAlertEnabled,
    isMaintenanceMode,
    updateMaintenanceMode,
    cutoffTime,
    setCutoffTime,
    isBankEnabled,
    setIsBankEnabled,
    estimatedDeliveryTime,
    setEstimatedDeliveryTime,
    signInWithGoogle,
    authUid,
    userEmail,
    users,
    updateUserPoints,
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    auditLogs,
    logAudit,
    broadcastNotifications,
    sendBroadcast,
    admins,
    addAdmin,
    updateAdminRole,
    removeAdmin,
    isAdmin,
    categories,
    updateCategory,
    addCategory,
    deleteCategory,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    isQuotaExceeded,
    resetQuotaExceeded,
    refreshAllData,
    shopPhone,
    setShopPhone,
    shopEmail,
    setShopEmail,
    language,
  } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    | "orders"
    | "market"
    | "products"
    | "banners"
    | "special-offers"
    | "categories"
    | "settings"
    | "analytics"
    | "users"
    | "coupons"
    | "notifications"
    | "audit"
    | "admins"
  >("analytics");
  const [tempSupportNumber, setTempSupportNumber] = useState(supportNumber);
  const [tempCutoffTime, setTempCutoffTime] = useState(cutoffTime);
  const [tempEstimatedDeliveryTime, setTempEstimatedDeliveryTime] = useState(
    estimatedDeliveryTime,
  );
  const [tempDeliveryFee, setTempDeliveryFee] = useState(deliveryFee || 0);
  const [tempShopPhone, setTempShopPhone] = useState(shopPhone);
  const [tempShopEmail, setTempShopEmail] = useState(shopEmail);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [tempBankDetails, setTempBankDetails] = useState({
    name: bankName,
    number: bankAccountNumber,
    accountName: bankAccountName,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState({
    start: "",
    end: "",
  });

  // Sync selected order with latest order data from context to reflect status changes immediately
  useEffect(() => {
    if (selectedOrder && isOrderModalOpen) {
      const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
      if (
        updatedOrder &&
        (updatedOrder.status !== selectedOrder.status ||
          updatedOrder.paymentScreenshot !== selectedOrder.paymentScreenshot)
      ) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, isOrderModalOpen, selectedOrder]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all")
      result = result.filter((o) => o.status === statusFilter);
    if (selectedDateFilter.start)
      result = result.filter(
        (o) =>
          new Date(o.createdAt).toISOString().split("T")[0] >=
          selectedDateFilter.start,
      );
    if (selectedDateFilter.end)
      result = result.filter(
        (o) =>
          new Date(o.createdAt).toISOString().split("T")[0] <=
          selectedDateFilter.end,
      );

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.roomNumber.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q),
      );
    }

    return result;
  }, [orders, statusFilter, selectedDateFilter, searchQuery]);

  // Real-time Notification for new orders
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, "orders"),
      orderBy("timestamp", "desc"),
      limit(1),
    );
    let initialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (initialLoad) {
        initialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newOrder = change.doc.data() as Order;
          toast.success(`New Order from ${newOrder.customerName}!`, {
            description: `Room ${newOrder.roomNumber} - ${formatPrice(newOrder.total)}`,
            action: {
              label: "View",
              onClick: () => {
                setSelectedOrder({ ...newOrder, id: change.doc.id });
                setIsOrderModalOpen(true);
              },
            },
          });

          // Play notification sound
          const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
          );
          audio.play().catch((e) => console.log("Audio play failed:", e));
        }
      });
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin-login");
  };

  // Keyboard listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  // Scroll to top when tab changes
  useEffect(() => {
    const mainContent = document.getElementById("admin-main-content");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  const handleSeed = async () => {
    setIsSeeding(true);
    await seedDatabase();
    setIsSeeding(false);
    alert("Database seeded!");
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    // Migration logic
    setIsMigrating(false);
    alert("Migration complete!");
  };

  // Market List Logic: Auto-Sum total weight/quantity of each product
  const [customMarketDate, setCustomMarketDate] = useState<string>("");

  const normalizeDateKey = (
    dateStr?: string,
    createdAt?: string | number | Date,
  ) => {
    const isLongFormat =
      dateStr && (dateStr.includes(",") || /[a-zA-Z]/.test(dateStr));
    if (!dateStr || !isLongFormat) {
      const dateObj = dateStr ? new Date(dateStr) : new Date(createdAt!);
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        month: "long",
        day: "numeric",
      };
      return dateObj.toLocaleDateString("en-US", options);
    }
    return dateStr;
  };

  const marketListOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = order.status !== "cancelled";

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery]);

  const marketListByDate = useMemo(() => {
    const grouped: Record<
      string,
      Record<
        string,
        {
          id: string;
          name: string;
          total: number;
          unit: string;
          category: string;
        }
      >
    > = {};
    marketListOrders.forEach((order) => {
      const dateKey = normalizeDateKey(order.deliveryDate, order.createdAt);

      if (!grouped[dateKey]) grouped[dateKey] = {};
      order.items.forEach((item) => {
        if (!grouped[dateKey][item.id]) {
          grouped[dateKey][item.id] = {
            id: item.id,
            name: item.name,
            total: 0,
            unit: item.unit || t("oneKg"),
            category: item.category || "Other",
          };
        }
        grouped[dateKey][item.id].total += item.quantity;
      });
    });
    return grouped;
  }, [marketListOrders, t]);

  // Removed auto-redirect useEffect that prevented seeing the date selection overview

  const stats = useMemo(() => {
    return {
      pending: orders.filter((o) => o.status === "pending").length,
      packing: orders.filter((o) => o.status === "packing").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      totalRevenue: orders
        .filter((o) => o.status === "delivered")
        .reduce((acc, o) => acc + o.total, 0),
      lowStock: products.filter((p) => p.stock <= 5).length,
    };
  }, [orders, products]);

  const handlePrintMarketList = () => {
    if (!selectedDate || !marketListByDate[selectedDate]) return;

    const marketItems = Object.values(marketListByDate[selectedDate]) as {
      name: string;
      category: string;
      total: number;
      unit: string;
    }[];
    const doc = new jsPDF();

    // Header Section
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("MARKET PURCHASE LIST", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`Delivery Date: ${selectedDate}`, 14, 28);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 33);
    doc.text(`Total Unique Items: ${marketItems.length}`, 14, 38);

    // Line Separator
    doc.setDrawColor(230);
    doc.line(14, 42, 196, 42);

    const categories = Array.from(
      new Set(marketItems.map((i) => i.category)),
    ).sort();
    let currentY = 50;

    categories.forEach((cat) => {
      const catItems = marketItems.filter((i) => i.category === cat);

      // Check for page overflow before writing category title
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Category Header
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(cat.toUpperCase(), 14, currentY);

      const tableData = catItems.map((item, idx) => [
        idx + 1,
        item.name,
        `${item.total} ${item.unit}`,
        "[  ]",
      ]);

      autoTable(doc, {
        startY: currentY + 4,
        head: [["#", "Description", "Quantity / Weight", "Check"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [250, 250, 250],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
        },
        styles: {
          fontSize: 9,
          cellPadding: 3.5,
          lineColor: [240, 240, 240],
          lineWidth: 0.1,
          textColor: [50, 50, 50],
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 45, halign: "right" },
          3: { cellWidth: 20, halign: "center" },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    });

    // Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: "right" });
    }

    doc.save(`Market_List_${selectedDate.replace(/\//g, "-")}.pdf`);
  };

  return (
    <div
      className={`min-h-screen font-sans flex transition-all duration-500 ${darkMode ? "bg-[#0c0e0e] text-on-surface" : "bg-[#f8faf9]"}`}
    >
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        darkMode={darkMode}
        formatPrice={formatPrice}
        updateStatus={updateOrderStatus}
        t={t}
      />

      {/* Header - Full Width Top */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-2 border-b ${darkMode ? "bg-[#0c0e0e]/80 backdrop-blur-md border-white/5" : "bg-white/80 backdrop-blur-md border-gray-100"}`}
      >
        {/* Logo Left */}
        <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-transform active:scale-95 ${darkMode ? "bg-primary text-white hover:bg-primary/90" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
            >
                S
            </button>
            <h1 className={`text-lg font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}>
                Sar Taw Set
            </h1>
        </div>

        {/* Search Centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
          {/* Gmail-style Search Bar */}
          <div className="relative w-full">
            <div
              className={`flex items-center gap-3 px-3 py-1.5 rounded-full transition-all group ${
                darkMode
                  ? "bg-surface-container-high/40 focus-within:bg-surface-container-high border border-white/5 focus-within:border-primary/30"
                  : "bg-gray-100 focus-within:bg-white border border-transparent focus-within:border-emerald-200"
              }`}
            >
              <Search
                size={16}
                className={darkMode ? "text-on-surface-variant/60" : "text-gray-400"}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className={`w-full bg-transparent outline-none text-sm placeholder:text-gray-400/50 ${
                  darkMode ? "text-on-surface" : "text-gray-900"
                }`}
              />
            </div>
          </div>
        </div>
        
        {/* Buttons Right */}
        <div className="flex items-center gap-2">
          {/* View Public Menu Preview */}
          <button
            onClick={() => window.open('/#/menu', '_blank')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
              darkMode 
                ? "text-primary/70 hover:text-primary hover:bg-primary/10" 
                : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
            }`}
          >
            <ExternalLink size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">View Menu</span>
          </button>

          {/* Notifications */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button className={`p-2 rounded-full transition-colors ${darkMode ? "text-on-surface-variant/60 hover:bg-white/5" : "text-gray-400 hover:bg-gray-100"}`}>
                <Bell size={20} />
              </button>
            </Popover.Trigger>
            <Popover.Content align="end" className="z-50">
              <OrderNotifications orders={orders} darkMode={darkMode} />
            </Popover.Content>
          </Popover.Root>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? "text-primary hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* User Profile */}
          <button className={`p-2 rounded-full transition-colors ${darkMode ? "text-on-surface-variant/60 hover:bg-white/5" : "text-gray-400 hover:bg-gray-100"}`}>
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMenuOpen ? 240 : 70,
          boxShadow: isMenuOpen 
            ? (darkMode ? "0 4px 25px rgba(0,0,0,0.5)" : "0 4px 25px rgba(0,0,0,0.05)") 
            : "none",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-[70px] left-4 bottom-4 z-30 flex-shrink-0 overflow-hidden rounded-2xl border ${darkMode ? "bg-gradient-to-b from-[#0c0e0e]/90 to-black/90 backdrop-blur-2xl border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" : "bg-gradient-to-b from-white/90 to-gray-50/90 backdrop-blur-2xl border-emerald-100 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]"}`}
      >
        <div className="w-full h-full flex flex-col pt-0 pb-6">

          {/* Navigation Items */}
          <nav className="flex-grow px-3 space-y-2 overflow-y-auto no-scrollbar pb-6">
            <div>
              {/* Removed management header */}
              <div className="space-y-1 pt-4">
                {[
                  { id: "analytics", icon: BarChart3, label: "Analytics" },
                  { id: "orders", icon: ShoppingBag, label: t("orders") },
                  { id: "market", icon: ClipboardList, label: "Market List" },
                  { id: "products", icon: Package, label: t("products") },
                  { id: "banners", icon: ImageIcon, label: "Ad Banners" },
                  {
                    id: "categories",
                    icon: SlidersHorizontal,
                    label: "Categories",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center h-12 rounded-xl mx-2 w-[calc(100%-16px)] transition-all duration-300 group relative ${
                      activeTab === item.id
                        ? darkMode
                          ? "bg-primary/15 text-primary font-medium"
                          : "bg-emerald-50 text-emerald-800 font-medium"
                        : darkMode
                          ? "text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface"
                          : "text-gray-500 hover:bg-gray-50 hover:text-emerald-900"
                    } ${isMenuOpen ? "px-4 gap-4" : "px-0 justify-center"}`}
                  >
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="navPill"
                        className={`absolute left-0 w-1 h-6 rounded-r-full ${darkMode ? "bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" : "bg-emerald-600"}`}
                      />
                    )}
                    <item.icon
                      size={20}
                      strokeWidth={activeTab === item.id ? 2.5 : 2}
                      className={activeTab === item.id ? "text-current" : ""}
                    />
                    {isMenuOpen && (
                      <span
                        className={`font-bold text-xs whitespace-nowrap transition-transform duration-300 ${activeTab === item.id ? "translate-x-1" : ""}`}
                      >
                        {item.label}
                      </span>
                    )}
                    {activeTab === item.id &&
                      isMenuOpen &&
                      item.id === "orders" &&
                      stats.pending > 0 && (
                        <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full ring-4 ring-rose-500/10">
                          {stats.pending}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="space-y-1">
                {[
                  { id: "users", icon: Users, label: "Customers" },
                  { id: "coupons", icon: Ticket, label: "Coupons" },
                  { id: "notifications", icon: Bell, label: "Broadcast" },
                  { id: "audit", icon: History, label: "Audit Logs" },
                  { id: "admins", icon: ShieldCheck, label: "Admins" },
                  { id: "settings", icon: Settings, label: t("settings") },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center h-12 rounded-xl mx-2 w-[calc(100%-16px)] transition-all duration-300 group relative ${
                      activeTab === item.id
                        ? darkMode
                          ? "bg-primary/15 text-primary font-medium"
                          : "bg-emerald-50 text-emerald-800 font-medium"
                        : darkMode
                          ? "text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface"
                          : "text-gray-500 hover:bg-gray-50 hover:text-emerald-900"
                    } ${isMenuOpen ? "px-4 gap-4" : "px-0 justify-center"}`}
                  >
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="navPill2"
                        className={`absolute left-0 w-1 h-6 rounded-r-full ${darkMode ? "bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" : "bg-emerald-600"}`}
                      />
                    )}
                    <item.icon
                      size={20}
                      strokeWidth={activeTab === item.id ? 2.5 : 2}
                      className={activeTab === item.id ? "text-current" : ""}
                    />
                    {isMenuOpen && (
                      <span
                        className={`font-bold text-xs whitespace-nowrap transition-transform duration-300 ${activeTab === item.id ? "translate-x-1" : ""}`}
                      >
                        {item.label}
                      </span>
                    )}
                  </button>
                ))}
                
                {/* Refresh Data Button */}
                <button
                  onClick={async () => {
                    toast.loading('Syncing latest cloud data...', { id: 'refresh-data' });
                    await refreshAllData();
                  }}
                  className={`flex items-center h-12 rounded-xl mx-2 w-[calc(100%-16px)] transition-all duration-300 group relative ${
                    darkMode
                      ? "text-on-surface-variant/40 hover:bg-white/5 hover:text-primary"
                      : "text-gray-400 hover:bg-gray-50 hover:text-emerald-700"
                  } ${isMenuOpen ? "px-4 gap-4" : "px-0 justify-center"}`}
                >
                  <RefreshCw size={20} />
                  {isMenuOpen && (
                    <span className="font-bold text-xs whitespace-nowrap">
                      Sync Data
                    </span>
                  )}
                </button>
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={handleLogout}
                  className={`flex items-center h-12 rounded-xl mx-2 w-[calc(100%-16px)] transition-all duration-300 group relative ${
                    darkMode
                      ? "text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
                      : "text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  } ${isMenuOpen ? "px-4 gap-4" : "px-0 justify-center"}`}
                >
                  <LogOut size={20} />
                  {isMenuOpen && (
                    <span className="font-bold text-xs whitespace-nowrap">
                      {t("logout")}
                    </span>
                  )}
                </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        id="admin-main-content"
        animate={{
          marginLeft: isMenuOpen ? 240 : 70,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-grow overflow-y-auto max-h-screen no-scrollbar pt-[52px]"
      >


        {/* Content Area */}
        <div className="flex-grow min-w-0 transition-opacity duration-300 relative before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] before:from-primary/10 before:via-transparent before:to-transparent before:pointer-events-none before:-z-10">
          <div className="p-4 md:p-10 max-w-[1600px] mx-auto relative z-10">
            {/* Low Stock Alerts */}
              {isLowStockAlertEnabled &&
              stats.lowStock > 0 &&
              activeTab === "analytics" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mb-10 p-8 rounded-[3rem] border flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden ${
                    darkMode
                      ? "bg-red-500/10 border-red-500/10 shadow-2xl shadow-red-900/10"
                      : "bg-red-50 border-red-100 shadow-xl shadow-red-900/5"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50`}
                  />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                      <AlertTriangle size={32} />
                    </div>
                    <div>
                      <h3
                        className={`text-2xl font-black tracking-tight ${darkMode ? "text-red-400" : "text-red-800"}`}
                      >
                        Inventory Warning
                      </h3>
                      <p
                        className={`text-sm font-bold ${darkMode ? "text-red-400/50" : "text-red-600/60"}`}
                      >
                        {stats.lowStock} essential products are critically low.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 relative z-10">
                    {products
                      .filter((p) => p.stock <= 5)
                      .map((p) => (
                        <motion.span
                          whileHover={{ y: -2 }}
                          key={p.id}
                          className={`px-5 py-2.5 rounded-none text-[11px] font-black uppercase tracking-widest border transition-colors ${
                            darkMode
                              ? "bg-white/5 border-white/10 text-red-300 hover:bg-white/10"
                              : "bg-white/80 backdrop-blur-sm border-red-100 text-red-700 hover:bg-white"
                          }`}
                        >
                          {p.name}: {p.stock} {p.unit}
                        </motion.span>
                      ))}
                  </div>
                </motion.div>
              )}

            {activeTab === "analytics" && (
              <div className="flex items-center gap-3 mb-6">
                <h2
                  className={`text-2xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                >
                  Real-time Analytics
                </h2>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                    darkMode
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-emerald-50 border-emerald-100 text-emerald-600"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest">
                    Live Sync
                  </span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === "analytics" ? (
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
              ) : activeTab === "orders" ? (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h2
                        className={`text-2xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                      >
                        {t("orderManagement")}
                      </h2>
                      <p className="text-[10px] font-medium opacity-50 -mt-1">
                        Manage, filter, and track all customer orders in
                        real-time.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const doc = new jsPDF({
                          orientation: "portrait",
                          unit: "mm",
                          format: "a4",
                        });

                        const pageWidth = doc.internal.pageSize.getWidth();
                        const pageHeight = doc.internal.pageSize.getHeight();

                        // Header: Company Name
                        doc.setFontSize(22);
                        doc.setTextColor(16, 185, 129); // Emerald-500
                        doc.setFont("helvetica", "bold");
                        doc.text("Sar Taw Set", 14, 20);

                        // Header: Title
                        doc.setFontSize(16);
                        doc.setTextColor(40);
                        doc.text("Order Management Report", 14, 30);

                        // Header: Timestamp
                        doc.setFontSize(10);
                        doc.setTextColor(100);
                        doc.setFont("helvetica", "normal");
                        const timestamp = new Date().toLocaleString();
                        doc.text(`Generated on: ${timestamp}`, 14, 37);

                        const tableData = filteredOrders.map((o) => [
                          `#${o.id.slice(-6).toUpperCase().padStart(6, "0")}`,
                          o.customerName,
                          formatPrice(o.total),
                          o.status.toUpperCase(),
                          new Date(o.createdAt).toLocaleDateString(),
                        ]);

                        autoTable(doc, {
                          head: [
                            [
                              "Order ID",
                              "Customer Name",
                              "Total Amount",
                              "Status",
                              "Order Date",
                            ],
                          ],
                          body: tableData,
                          startY: 45,
                          theme: "grid",
                          headStyles: {
                            fillColor: [16, 185, 129],
                            textColor: 255,
                            fontStyle: "bold",
                          },
                          styles: {
                            fontSize: 9,
                            cellPadding: 3,
                            lineColor: [230, 230, 230],
                            lineWidth: 0.1,
                          },
                          margin: { bottom: 20 },
                          didDrawPage: (data) => {
                            // Footer: Page Number
                            doc.setFontSize(8);
                            doc.setTextColor(150);
                            const str = `Page ${doc.getNumberOfPages()}`;
                            doc.text(str, pageWidth / 2, pageHeight - 10, {
                              align: "center",
                            });
                          },
                        });

                        doc.save(
                          `SarTawSet_Orders_${new Date().toISOString().split("T")[0]}.pdf`,
                        );
                      }}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                        darkMode
                          ? "bg-white/5 text-on-surface-variant/60 hover:bg-white/10"
                          : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-sm"
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
                        { id: "all", label: t("all"), color: "bg-gray-500" },
                        {
                          id: "pending",
                          label: t("statusPending"),
                          color: "bg-amber-500",
                        },
                        {
                          id: "packing",
                          label: t("statusPacking"),
                          color: "bg-blue-500",
                        },
                        {
                          id: "delivered",
                          label: t("statusDelivered"),
                          color: "bg-emerald-500",
                        },
                        {
                          id: "cancelled",
                          label: t("statusCancelled"),
                          color: "bg-rose-500",
                        },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          onClick={() => setStatusFilter(chip.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${
                            statusFilter === chip.id
                              ? `${chip.color} text-white border-transparent shadow-lg shadow-${chip.color.split("-")[1]}-500/20`
                              : darkMode
                                ? "bg-white/5 border-white/10 text-on-surface-variant/60 hover:bg-white/10"
                                : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${statusFilter === chip.id ? "bg-white" : chip.color}`}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {chip.label}
                          </span>
                          {statusFilter === chip.id && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[8px] font-black">
                              {
                                orders.filter((o) =>
                                  chip.id === "all"
                                    ? true
                                    : o.status === chip.id,
                                ).length
                              }
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div
                      className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                    >
                      <Calendar size={12} className="opacity-40" />
                      <input
                        type="date"
                        className="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
                        onChange={(e) =>
                          setSelectedDateFilter((prev) => ({
                            ...prev,
                            start: e.target.value,
                          }))
                        }
                      />
                      <span className="opacity-20 text-[10px]">—</span>
                      <input
                        type="date"
                        className="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
                        onChange={(e) =>
                          setSelectedDateFilter((prev) => ({
                            ...prev,
                            end: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Compact Enhanced Orders Grid */}
                  <div className="grid gap-2">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order, i) => (
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
                          className={`group px-4 py-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                            order.status === "pending"
                              ? "bg-amber-950/5 border-amber-500/20 hover:bg-amber-950/10"
                              : "bg-surface-container-high/20 border-white/5 hover:bg-surface-container-high/40"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                order.status === "pending"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              <User size={14} />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-xs text-on-surface truncate">
                                {order.customerName}
                              </p>
                              <p className="font-mono text-[10px] font-bold text-on-surface-variant/40">
                                #
                                {order.id}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                              <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/40 font-bold">
                                Ordered On
                              </p>
                              <p className="font-bold text-[10px] text-on-surface">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-xs text-on-surface">
                                {formatPrice(order.total)}
                              </p>
                              <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/40 font-bold">
                                {order.items.length} items
                              </p>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                order.status === "delivered"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : order.status === "packing"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {order.status}
                            </span>

                            <div className="text-on-surface-variant/20 group-hover:text-primary transition-colors">
                              <ChevronRight size={14} />
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-10 text-center rounded-3xl border border-dashed border-white/5">
                        <p className="font-bold text-xs opacity-30">
                          No orders found.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : activeTab === "market" ? (
                <motion.div
                  key="market"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {selectedDate ? (
                    // Detail View
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedDate(null)}
                            className={`p-2.5 rounded-full transition-all hover:scale-110 active:scale-95 ${darkMode ? "bg-white/5 hover:bg-white/10 text-primary" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100"}`}
                          >
                            <ChevronRight size={18} className="rotate-180" />
                          </button>
                          <div>
                            <h2
                              className={`text-2xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                            >
                              {selectedDate}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                Market Purchase Summary
                              </span>
                              <span
                                className={`w-1 h-1 rounded-full ${darkMode ? "bg-white/10" : "bg-gray-200"}`}
                              />
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-primary" : "text-emerald-600"}`}
                              >
                                {
                                  Object.keys(
                                    marketListByDate[selectedDate] || {},
                                  ).length
                                }{" "}
                                Products Found
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest ${darkMode ? "bg-primary/5 text-primary/60" : "bg-emerald-50 text-emerald-600/60"}`}
                          >
                            Market Mode
                          </div>
                        </div>
                      </div>

                      {marketListByDate[selectedDate] ? (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div
                              className={`p-4 rounded-none border ${darkMode ? "bg-surface-container-high/40 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}
                            >
                              <p
                                className={`text-[9px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                {t("totalItems")}
                              </p>
                              <p
                                className={`text-xl font-black ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                              >
                                {
                                  Object.keys(marketListByDate[selectedDate])
                                    .length
                                }
                              </p>
                            </div>

                            <div
                              className={`p-4 rounded-none border ${darkMode ? "bg-surface-container-high/40 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}
                            >
                              <p
                                className={`text-[9px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                Categories
                              </p>
                              <p
                                className={`text-xl font-black ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                              >
                                {
                                  new Set(
                                    Object.values(
                                      marketListByDate[selectedDate],
                                    ).map((i: any) => i.category),
                                  ).size
                                }
                              </p>
                            </div>

                            <div
                              className={`p-4 rounded-none border ${darkMode ? "bg-surface-container-high/40 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}
                            >
                              <p
                                className={`text-[9px] font-black uppercase tracking-widest mb-1 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                Orders
                              </p>
                              <p
                                className={`text-xl font-black ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                              >
                                {
                                  marketListOrders.filter(
                                    (o) =>
                                      normalizeDateKey(
                                        o.deliveryDate,
                                        o.createdAt,
                                      ) === selectedDate,
                                  ).length
                                }
                              </p>
                            </div>

                            <button
                              onClick={handlePrintMarketList}
                              className={`p-4 rounded-none border flex flex-col items-center justify-center gap-1 transition-all group active:scale-95 ${
                                darkMode
                                  ? "bg-primary border-primary hover:bg-primary/90 text-surface shadow-lg shadow-primary/20"
                                  : "bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                              }`}
                            >
                              <FileText
                                size={16}
                                className="group-hover:scale-110 transition-transform"
                              />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Export PDF
                              </span>
                            </button>
                          </div>

                          <div
                            className={`rounded-none border overflow-hidden ${darkMode ? "bg-surface-container-high/40 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}
                          >
                            {Object.entries(
                              Object.values(
                                marketListByDate[selectedDate],
                              ).reduce(
                                (acc, item: any) => {
                                  if (!acc[item.category])
                                    acc[item.category] = [];
                                  acc[item.category].push(item);
                                  return acc;
                                },
                                {} as Record<string, any[]>,
                              ),
                            ).map(
                              ([category, items]: [string, any[]], catIdx) => (
                                <div
                                  key={`category-${category}-${catIdx}`}
                                  className={
                                    catIdx > 0
                                      ? "border-t " +
                                        (darkMode
                                          ? "border-white/5"
                                          : "border-gray-100")
                                      : ""
                                  }
                                >
                                  <div
                                    className={`px-5 py-3 flex items-center justify-between ${darkMode ? "bg-white/[0.03]" : "bg-gray-50/80 border-b border-gray-100"}`}
                                  >
                                    <h3
                                      className={`text-[9px] font-black uppercase tracking-[0.25em] ${darkMode ? "text-primary" : "text-emerald-600"}`}
                                    >
                                      {category}
                                    </h3>
                                    <span
                                      className={`text-[9px] font-black px-2 py-0.5 rounded-md ${darkMode ? "bg-white/5 text-on-surface-variant/50" : "bg-white border border-gray-100 text-gray-400 shadow-sm uppercase tracking-tighter text-[8px]"}`}
                                    >
                                      {items.length} Items
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse table-fixed">
                                      <thead>
                                        <tr
                                          className={`border-b ${darkMode ? "border-white/5" : "border-gray-50"}`}
                                        >
                                          <th className="py-2.5 px-6 text-[8px] font-black uppercase tracking-widest text-gray-400 w-[50px] text-center">
                                            #
                                          </th>
                                          <th className="py-2.5 px-0 text-[8px] font-black uppercase tracking-widest text-gray-400">
                                            {t("itemName")}
                                          </th>
                                          <th className="py-2.5 px-6 text-[8px] font-black uppercase tracking-widest text-gray-400 text-right w-[150px]">
                                            {t("totalWeightQty")}
                                          </th>
                                          <th className="py-2.5 px-6 text-[8px] font-black uppercase tracking-widest text-gray-400 text-center w-[80px]">
                                            {t("status")}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {items.map((item, i) => (
                                          <tr
                                            key={item.id}
                                            className={`group border-b last:border-0 transition-colors ${darkMode ? "border-white/5 hover:bg-white/5" : "border-gray-50 hover:bg-emerald-50/30"}`}
                                          >
                                            <td
                                              className={`py-3 px-6 text-[10px] font-bold text-center ${darkMode ? "text-on-surface-variant/30" : "text-gray-300"}`}
                                            >
                                              {i + 1}
                                            </td>
                                            <td
                                              className={`py-3 px-0 text-xs font-bold leading-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                                            >
                                              {item.name}
                                            </td>
                                            <td
                                              className={`py-3 px-6 text-xs font-black text-right ${darkMode ? "text-primary" : "text-emerald-700"}`}
                                            >
                                              <span className="tabular-nums">
                                                {item.total}
                                              </span>{" "}
                                              <span className="text-[9px] opacity-40 ml-0.5 lowercase font-medium">
                                                {item.unit}
                                              </span>
                                            </td>
                                            <td className="py-3 px-6 text-center">
                                              <label className="flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform">
                                                <input
                                                  type="checkbox"
                                                  className={`w-3.5 h-3.5 rounded transition-all cursor-pointer ${
                                                    darkMode
                                                      ? "border-white/10 checked:bg-primary/40 checked:border-primary"
                                                      : "border-gray-200 checked:bg-emerald-500 checked:border-emerald-600 focus:ring-0 appearance-none"
                                                  }`}
                                                />
                                              </label>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="p-20 text-center rounded-[3rem] border border-dashed border-white/5">
                          <p className="font-bold text-lg opacity-30">
                            No items found for this date.
                          </p>
                          <button
                            onClick={() => setSelectedDate(null)}
                            className="mt-4 text-primary font-bold hover:underline"
                          >
                            Go back home
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Overview Page: Date Selection Cards */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <h2
                            className={`text-2xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                          >
                            {t("marketList")}
                          </h2>
                          <p
                            className={`text-xs font-bold ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                          >
                            Choose a date to view summarized purchase list
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const options: Intl.DateTimeFormatOptions = {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              };
                              const today = new Date().toLocaleDateString(
                                "en-US",
                                options,
                              );
                              setSelectedDate(today);
                            }}
                            className={`px-4 py-2.5 rounded-none font-bold text-[10px] uppercase tracking-widest border transition-all ${darkMode ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"}`}
                          >
                            Today
                          </button>
                          <div
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-none border transition-all ${darkMode ? "bg-surface-container-high/40 border-white/5 focus-within:border-primary/50" : "bg-white border-gray-100 shadow-sm focus-within:border-emerald-500 shadow-emerald-500/5"}`}
                          >
                            <Calendar
                              size={16}
                              className={
                                darkMode ? "text-primary" : "text-emerald-600"
                              }
                            />
                            <input
                              type="date"
                              className="bg-transparent border-none outline-none text-xs font-bold w-full"
                              onChange={(e) => {
                                if (e.target.value) {
                                  const date = new Date(e.target.value);
                                  const options: Intl.DateTimeFormatOptions = {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                  };
                                  const formatted = date.toLocaleDateString(
                                    "en-US",
                                    options,
                                  );
                                  setSelectedDate(formatted);
                                }
                              }}
                            />
                          </div>
                          <div
                            className={`px-4 py-2.5 rounded-none font-black text-[10px] uppercase tracking-widest border ${darkMode ? "bg-white/5 border-white/5 text-on-surface-variant/60" : "bg-gray-50 border-gray-100 text-gray-500"}`}
                          >
                            {Object.keys(marketListByDate).length} {t("days")}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Sort dates chronologically if possible */}
                        {Object.keys(marketListByDate)
                          .sort((a, b) => {
                            const da = new Date(a).getTime();
                            const db = new Date(b).getTime();
                            if (isNaN(da) || isNaN(db)) return 0;
                            return db - da; // Newest first
                          })
                          .map((date) => (
                            <button
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className={`group p-4 rounded-none border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                darkMode
                                  ? "bg-surface-container-high/40 border-white/5 hover:bg-white/5"
                                  : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200"
                              }`}
                            >
                              <div className="flex flex-col h-full gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-none flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-600"}`}
                                >
                                  <Calendar size={16} />
                                </div>
                                <div className="mt-1">
                                  <p
                                    className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                                  >
                                    Delivery Date
                                  </p>
                                  <h3
                                    className={`font-black text-sm leading-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                                  >
                                    {date}
                                  </h3>
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-700"}`}
                                  >
                                    {Object.keys(marketListByDate[date]).length}{" "}
                                    {t("items")}
                                  </span>
                                  <ChevronRight
                                    size={14}
                                    className={`transition-transform group-hover:translate-x-1 ${darkMode ? "text-white/20" : "text-emerald-200"}`}
                                  />
                                </div>
                              </div>
                            </button>
                          ))}

                        {Object.keys(marketListByDate).length === 0 && (
                          <div
                            className={`col-span-full py-20 text-center rounded-[2rem] border-2 border-dashed ${darkMode ? "border-white/5" : "border-gray-100"}`}
                          >
                            <div className="flex flex-col items-center gap-4">
                              <div
                                className={`w-16 h-16 rounded-none flex items-center justify-center ${darkMode ? "bg-white/5 text-white/5" : "bg-gray-50 text-gray-200"}`}
                              >
                                <ClipboardList size={32} />
                              </div>
                              <p
                                className={`font-bold text-lg ${darkMode ? "text-white/20" : "text-gray-400"}`}
                              >
                                No market lists generated yet.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === "products" ? (
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
                      language={language}
                      formatPrice={formatPrice}
                      globalSearch={searchQuery}
                    />
                </motion.div>
              ) : activeTab === "banners" ? (
                <motion.div
                  key="banners"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2
                      className={`text-3xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                    >
                      Ad Banners
                    </h2>
                    <p
                      className={`text-xs font-bold ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                    >
                      Manage full-image advertisements
                    </p>
                  </div>
                  <AdBannersTab
                    darkMode={darkMode}
                    t={t}
                    globalSearch={searchQuery}
                  />
                </motion.div>
              ) : activeTab === "categories" ? (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <CategoriesTab
                    darkMode={darkMode}
                    t={t}
                    globalSearch={searchQuery}
                  />
                </motion.div>
              ) : activeTab === "users" ? (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <UsersTab
                    users={users}
                    orders={orders}
                    darkMode={darkMode}
                    updateUserPoints={updateUserPoints}
                    globalSearch={searchQuery}
                  />
                </motion.div>
              ) : activeTab === "coupons" ? (
                <motion.div
                  key="coupons"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CouponsTab
                    coupons={coupons}
                    addCoupon={addCoupon}
                    updateCoupon={updateCoupon}
                    deleteCoupon={deleteCoupon}
                    darkMode={darkMode}
                    formatPrice={formatPrice}
                    globalSearch={searchQuery}
                  />
                </motion.div>
              ) : activeTab === "notifications" ? (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <NotificationsTab
                    broadcastNotifications={broadcastNotifications}
                    sendBroadcast={sendBroadcast}
                    darkMode={darkMode}
                  />
                </motion.div>
              ) : activeTab === "audit" ? (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AuditLogsTab
                    auditLogs={auditLogs}
                    darkMode={darkMode}
                    globalSearch={searchQuery}
                  />
                </motion.div>
              ) : activeTab === "admins" ? (
                <motion.div
                  key="admins"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AdminsTab
                    admins={admins}
                    addAdmin={addAdmin}
                    updateAdminRole={updateAdminRole}
                    removeAdmin={removeAdmin}
                    darkMode={darkMode}
                    globalSearch={searchQuery}
                  />
                </motion.div>
              ) : activeTab === "settings" ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                      <h2
                        className={`text-3xl font-black tracking-tight ${darkMode ? "text-on-surface" : "text-emerald-950"}`}
                      >
                        {t("generalSettings")}
                      </h2>
                      <p
                        className={`text-xs font-bold ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                      >
                        System configuration and maintenance
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-[3rem] p-12 border transition-all duration-500 ${darkMode ? "bg-surface-container-high/40 border-white/5" : "bg-white border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]"}`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                      {/* Left Column */}
                      <div className="space-y-12">
                        {/* Currency Settings */}
                        <section className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-none ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-600"}`}
                            >
                              <DollarSign size={20} />
                            </div>
                            <div>
                              <h4
                                className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                              >
                                Currency Settings
                              </h4>
                              <p
                                className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                Active currency for the application
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-4">
                            {["RM", "MMK"].map((curr) => (
                              <button
                                key={curr}
                                onClick={() => setCurrency(curr as any)}
                                className={`flex-1 py-5 rounded-none font-black text-xs uppercase tracking-widest transition-all duration-300 border ${
                                  currency === curr
                                    ? darkMode
                                      ? "bg-primary text-surface border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                                      : "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100 scale-[1.02]"
                                    : darkMode
                                      ? "bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10"
                                      : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
                                }`}
                              >
                                {curr === "RM"
                                  ? "Malaysia (RM)"
                                  : "Myanmar (MMK)"}
                              </button>
                            ))}
                          </div>
                        </section>

                        {/* Delivery Service Settings */}
                        <section
                          className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-none ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-600"}`}
                              >
                                <Clock size={20} />
                              </div>
                              <div>
                                <h4
                                  className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                                >
                                  {t("deliveryService")}
                                </h4>
                                <p
                                  className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                                >
                                  {t("deliveryServiceDesc")}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                authUid &&
                                setIsDeliveryEnabled(!isDeliveryEnabled)
                              }
                              disabled={!authUid}
                              className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                                !authUid
                                  ? "opacity-50 cursor-not-allowed bg-gray-300"
                                  : isDeliveryEnabled
                                    ? "bg-emerald-500"
                                    : darkMode
                                      ? "bg-white/10"
                                      : "bg-gray-200"
                              }`}
                            >
                              <motion.div
                                animate={{ x: isDeliveryEnabled ? 28 : 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                }}
                                className="w-7 h-7 bg-white rounded-full shadow-xl"
                              />
                            </button>
                          </div>

                          {/* Cutoff Time and Estimated Delivery Time Settings */}
                          {authUid && (
                            <div className="space-y-6 mb-8">
                              <div className="flex flex-col gap-2">
                                <label
                                  className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                                >
                                  Delivery Fee
                                </label>
                                <div className="flex gap-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={tempDeliveryFee}
                                    onChange={(e) =>
                                      setTempDeliveryFee(Number(e.target.value))
                                    }
                                    className={`flex-grow border rounded-none px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"}`}
                                  />
                                  <button
                                    onClick={() => {
                                      setDeliveryFee(tempDeliveryFee);
                                      alert(
                                        "Delivery fee updated successfully!",
                                      );
                                    }}
                                    className={`px-6 py-4 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? "bg-primary text-surface shadow-primary/20 hover:bg-primary/90" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"}`}
                                  >
                                    <Save size={16} />
                                    {t("save")}
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <label
                                  className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                                >
                                  Order Cut-off Time
                                </label>
                                <div className="flex gap-3">
                                  <input
                                    type="time"
                                    value={tempCutoffTime}
                                    onChange={(e) =>
                                      setTempCutoffTime(e.target.value)
                                    }
                                    className={`flex-grow border rounded-none px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"}`}
                                  />
                                  <button
                                    onClick={() => {
                                      setCutoffTime(tempCutoffTime);
                                      alert(
                                        "Cut-off time updated successfully!",
                                      );
                                    }}
                                    className={`px-6 py-4 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? "bg-primary text-surface shadow-primary/20 hover:bg-primary/90" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"}`}
                                  >
                                    <Save size={16} />
                                    {t("save")}
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <label
                                  className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                                >
                                  Estimated Delivery Time
                                </label>
                                <div className="flex gap-3">
                                  <input
                                    type="text"
                                    value={tempEstimatedDeliveryTime}
                                    onChange={(e) =>
                                      setTempEstimatedDeliveryTime(
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. 8:00 AM - 10:00 AM"
                                    className={`flex-grow border rounded-none px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"}`}
                                  />
                                  <button
                                    onClick={() => {
                                      setEstimatedDeliveryTime(
                                        tempEstimatedDeliveryTime,
                                      );
                                      alert(
                                        "Estimated delivery time updated successfully!",
                                      );
                                    }}
                                    className={`px-6 py-4 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? "bg-primary text-surface shadow-primary/20 hover:bg-primary/90" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"}`}
                                  >
                                    <Save size={16} />
                                    {t("save")}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {!authUid ? (
                            <div
                              className={`p-6 rounded-none border ${darkMode ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100"}`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <ShieldCheck
                                  size={18}
                                  className="text-amber-500"
                                />
                                <h5
                                  className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-amber-500" : "text-amber-700"}`}
                                >
                                  {t("authRequired")}
                                </h5>
                              </div>
                              <p
                                className={`text-[10px] font-bold mb-4 leading-relaxed ${darkMode ? "text-on-surface-variant/60" : "text-amber-600"}`}
                              >
                                {t("authRequiredDesc")}
                              </p>
                              <button
                                onClick={signInWithGoogle}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-none shadow-sm hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest text-gray-600"
                              >
                                <img
                                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                  alt="Google"
                                  className="w-4 h-4"
                                  referrerPolicy="no-referrer"
                                />
                                {t("signInWithGoogle")}
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`p-6 rounded-none border ${darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black ${darkMode ? "bg-primary" : "bg-emerald-600"}`}
                                >
                                  <User size={18} />
                                </div>
                                <div>
                                  <h5
                                    className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-emerald-500" : "text-emerald-700"}`}
                                  >
                                    {t("signedInAsAdmin")}
                                  </h5>
                                  <p
                                    className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/60" : "text-emerald-600"}`}
                                  >
                                    {auth.currentUser?.email}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </section>

                        {/* Low Stock Alert Settings */}
                        <section
                          className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-none ${darkMode ? "bg-white/5 text-red-400" : "bg-red-50 text-red-600"}`}
                              >
                                <AlertTriangle size={20} />
                              </div>
                              <div>
                                <h4
                                  className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                                >
                                  Low Stock Alerts
                                </h4>
                                <p
                                  className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                                >
                                  Show warnings when inventory is low
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                authUid &&
                                setIsLowStockAlertEnabled(
                                  !isLowStockAlertEnabled,
                                )
                              }
                              disabled={!authUid}
                              className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                                !authUid
                                  ? "opacity-50 cursor-not-allowed bg-gray-300"
                                  : isLowStockAlertEnabled
                                    ? "bg-emerald-500"
                                    : darkMode
                                      ? "bg-white/10"
                                      : "bg-gray-200"
                              }`}
                            >
                              <motion.div
                                animate={{ x: isLowStockAlertEnabled ? 28 : 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                }}
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
                            <div
                              className={`p-3 rounded-none ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-600"}`}
                            >
                              <Phone size={20} />
                            </div>
                            <div>
                              <h4
                                className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                              >
                                {t("whatsappSupportNumber")}
                              </h4>
                              <p
                                className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                {t("whatsappSupportNumberDesc")}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="relative flex-grow">
                              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <span
                                  className={`font-black text-sm ${darkMode ? "text-on-surface-variant/30" : "text-gray-400"}`}
                                >
                                  +
                                </span>
                              </div>
                              <input
                                type="text"
                                value={tempSupportNumber}
                                onChange={(e) =>
                                  setTempSupportNumber(e.target.value)
                                }
                                className={`w-full border rounded-none pl-10 pr-6 py-5 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"}`}
                                placeholder="e.g. 601128096366"
                              />
                            </div>
                            <button
                              onClick={() => {
                                setSupportNumber(tempSupportNumber);
                                alert(t("supportNumberUpdated"));
                              }}
                              className={`px-8 py-5 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${darkMode ? "bg-primary text-surface shadow-primary/20 hover:bg-primary/90" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"}`}
                            >
                              <Save size={16} />
                              {t("save")}
                            </button>
                          </div>
                        </section>

                        {/* Shop Info for Invoice */}
                        <section className="space-y-6 pt-4 border-t border-gray-100/50">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-none ${darkMode ? "bg-white/5 text-primary" : "bg-emerald-50 text-emerald-600"}`}
                            >
                              <ClipboardList size={20} />
                            </div>
                            <div>
                              <h4
                                className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                              >
                                Invoice Shop Info
                              </h4>
                              <p
                                className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                Contact details shown on customer invoices
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <label
                                className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                              >
                                Shop Phone Number
                              </label>
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  value={tempShopPhone}
                                  onChange={(e) =>
                                    setTempShopPhone(e.target.value)
                                  }
                                  className={`flex-grow border rounded-none px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"}`}
                                />
                                <button
                                  onClick={() => {
                                    setShopPhone(tempShopPhone);
                                    toast.success("Invoice phone updated!");
                                  }}
                                  className={`px-6 py-4 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? "bg-primary text-surface shadow-primary/20 hover:bg-primary/90" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"}`}
                                >
                                  <Save size={16} />
                                  {t("save")}
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <label
                                className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-on-surface-variant/60" : "text-gray-500"}`}
                              >
                                Shop Email Address
                              </label>
                              <div className="flex gap-3">
                                <input
                                  type="email"
                                  value={tempShopEmail}
                                  onChange={(e) =>
                                    setTempShopEmail(e.target.value)
                                  }
                                  className={`flex-grow border rounded-none px-5 py-4 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-white border-gray-100 text-emerald-950 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"}`}
                                />
                                <button
                                  onClick={() => {
                                    setShopEmail(tempShopEmail);
                                    toast.success("Invoice email updated!");
                                  }}
                                  className={`px-6 py-4 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${darkMode ? "bg-primary text-surface shadow-primary/20 hover:bg-primary/90" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"}`}
                                >
                                  <Save size={16} />
                                  {t("save")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Bank Details */}
                        <section className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-none ${darkMode ? "bg-white/5 text-blue-500" : "bg-blue-50 text-blue-600"}`}
                              >
                                <CreditCard size={20} />
                              </div>
                              <div>
                                <h4
                                  className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                                >
                                  {t("bankTransferSettings")}
                                </h4>
                                <p
                                  className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                                >
                                  {t("bankTransferSettingsDesc")}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                authUid && setIsBankEnabled(!isBankEnabled)
                              }
                              disabled={!authUid}
                              className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                                !authUid
                                  ? "opacity-50 cursor-not-allowed bg-gray-300"
                                  : isBankEnabled
                                    ? "bg-blue-500"
                                    : darkMode
                                      ? "bg-white/10"
                                      : "bg-gray-200"
                              }`}
                            >
                              <motion.div
                                animate={{ x: isBankEnabled ? 28 : 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                }}
                                className="w-7 h-7 bg-white rounded-full shadow-xl"
                              />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              {
                                label: t("bankName"),
                                value: tempBankDetails.name,
                                key: "name",
                                placeholder: "e.g. Maybank",
                              },
                              {
                                label: t("accountName"),
                                value: tempBankDetails.accName,
                                key: "accName",
                                placeholder: "e.g. SAPHOSAUNG GROCERY",
                              },
                            ].map((field) => (
                              <div key={field.key} className="space-y-2">
                                <label
                                  className={`text-[10px] font-black uppercase tracking-widest ml-3 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                                >
                                  {field.label}
                                </label>
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) =>
                                    setTempBankDetails({
                                      ...tempBankDetails,
                                      [field.key]: e.target.value,
                                    })
                                  }
                                  className={`w-full border rounded-none px-6 py-4 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50"}`}
                                  placeholder={field.placeholder}
                                />
                              </div>
                            ))}
                            <div className="md:col-span-2 space-y-2">
                              <label
                                className={`text-[10px] font-black uppercase tracking-widest ml-3 ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                {t("accountNumber")}
                              </label>
                              <input
                                type="text"
                                value={tempBankDetails.accNum}
                                onChange={(e) =>
                                  setTempBankDetails({
                                    ...tempBankDetails,
                                    accNum: e.target.value,
                                  })
                                }
                                className={`w-full border rounded-none px-6 py-4 transition-all outline-none font-bold text-sm ${darkMode ? "bg-white/5 border-white/10 text-on-surface focus:border-primary/50" : "bg-gray-50 border-gray-100 text-emerald-950 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50"}`}
                                placeholder="e.g. 1234 5678 9012"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setBankName(tempBankDetails.name);
                              setBankAccountNumber(tempBankDetails.accNum);
                              setBankAccountName(tempBankDetails.accName);
                              alert(t("bankDetailsUpdated"));
                            }}
                            className={`w-full py-5 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${darkMode ? "bg-primary text-surface shadow-primary/20 hover:bg-primary/90" : "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700"}`}
                          >
                            <Save size={16} />
                            {t("updateBankDetails")}
                          </button>
                        </section>

                        {/* Database Tools */}
                        <section className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-none ${darkMode ? "bg-white/5 text-amber-500" : "bg-amber-50 text-amber-600"}`}
                            >
                              <Database size={20} />
                            </div>
                            <div>
                              <h4
                                className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                              >
                                Database Tools
                              </h4>
                              <p
                                className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                              >
                                Maintenance and data management
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div
                              className={`p-6 rounded-none border flex items-center justify-between ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                            >
                              <div>
                                <h4
                                  className={`font-black uppercase tracking-widest text-xs ${darkMode ? "text-on-surface" : "text-emerald-900"}`}
                                >
                                  Maintenance Mode
                                </h4>
                                <p
                                  className={`text-[10px] font-bold ${darkMode ? "text-on-surface-variant/40" : "text-gray-400"}`}
                                >
                                  Pause all new orders
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  updateMaintenanceMode(!isMaintenanceMode)
                                }
                                className={`w-16 h-9 rounded-full relative p-1 transition-all duration-500 ${
                                  isMaintenanceMode
                                    ? "bg-rose-500"
                                    : darkMode
                                      ? "bg-white/10"
                                      : "bg-gray-200"
                                }`}
                              >
                                <motion.div
                                  animate={{ x: isMaintenanceMode ? 28 : 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                  className="w-7 h-7 bg-white rounded-full shadow-xl"
                                />
                              </button>
                            </div>
                            <button
                              onClick={handleSeed}
                              disabled={isSeeding}
                              className={`py-5 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                                isSeeding ? "opacity-50 cursor-not-allowed" : ""
                              } ${darkMode ? "bg-amber-600 text-white shadow-amber-900/20 hover:bg-amber-500" : "bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600"}`}
                            >
                              <Database
                                size={16}
                                className={isSeeding ? "animate-bounce" : ""}
                              />
                              {isSeeding
                                ? "Seeding..."
                                : "Seed Products & Categories"}
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
                              className={`py-5 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                                isSeeding ? "opacity-50 cursor-not-allowed" : ""
                              } ${darkMode ? "bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500" : "bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600"}`}
                            >
                              <ShoppingBag
                                size={16}
                                className={isSeeding ? "animate-bounce" : ""}
                              />
                              {isSeeding
                                ? "Seeding Orders..."
                                : "Seed Sample Orders"}
                            </button>
                            <button
                              onClick={handleMigrate}
                              disabled={isMigrating}
                              className={`py-5 rounded-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                                isMigrating
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              } ${darkMode ? "bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-500" : "bg-blue-500 text-white shadow-blue-100 hover:bg-blue-600"}`}
                            >
                              <RefreshCw
                                size={16}
                                className={isMigrating ? "animate-spin" : ""}
                              />
                              {isMigrating ? "Migrating..." : "Run Migration"}
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
