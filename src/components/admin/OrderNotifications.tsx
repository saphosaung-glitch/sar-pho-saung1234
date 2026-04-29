import React from 'react';
import { Bell, AlertTriangle } from 'lucide-react';

export function OrderNotifications({
  orders,
  darkMode,
}: {
  orders: any[];
  darkMode: boolean;
}) {
  const orderHistory = orders
    .map(o => ({
      id: o.id,
      title: `Order: #${o.orderNumber}`,
      message: `Status: ${o.status.toUpperCase()} for ${o.customerName}`,
      type: 'order',
      date: o.createdAt?.seconds ? o.createdAt.seconds * 1000 : new Date(o.createdAt).getTime(),
    }))
    .sort((a, b) => b.date - a.date)
    .slice(0, 10); // Show last 10

  return (
    <div className={`p-4 rounded-2xl w-80 max-h-96 overflow-y-auto ${darkMode ? 'bg-[#1e1e1e] border border-white/10' : 'bg-white shadow-xl border border-gray-100'}`}>
      <h4 className="font-black text-sm mb-4">Recent Activity</h4>
      <div className="space-y-3">
        {orderHistory.length === 0 ? (
          <p className="text-xs opacity-40 italic">No recent orders.</p>
        ) : (
          orderHistory.map((n) => (
            <div key={n.id} className="flex gap-3 text-xs">
              <div className="p-1.5 rounded-lg bg-emerald-100/10 text-emerald-500 self-start mt-1">
                <Bell size={12} />
              </div>
              <div className="flex-1">
                <p className="font-bold">{n.title}</p>
                <p className="opacity-70">{n.message}</p>
                <p className="text-[9px] opacity-40 mt-0.5">{new Date(n.date).toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
