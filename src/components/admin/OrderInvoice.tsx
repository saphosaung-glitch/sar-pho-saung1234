import React from 'react';
import { Order } from '../../context/StoreContext';
import { Receipt, MapPin, Phone, Mail, Globe } from 'lucide-react';

interface OrderInvoiceProps {
  order: Order;
  formatPrice: (p: number) => string;
  t: (key: string) => string;
  id: string;
}

export default function OrderInvoice({ order, formatPrice, t, id }: OrderInvoiceProps) {

  return (
    <div 
      id={id}
      className="bg-white text-slate-900 p-[18mm] mx-auto w-[210mm] min-h-[297mm] shadow-none flex flex-col font-sans relative print:p-0 print:w-full print:h-full print:shadow-none"
      style={{ 
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        lineHeight: '1.5',
        paddingBottom: '20mm'
      }}
    >
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hidden { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
      
      {/* Royal Head Decoration */}
      <div className="absolute top-0 left-0 w-full h-3 bg-slate-900" />
      <div className="absolute top-3 left-0 w-full h-1 bg-amber-500/20" />
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <Receipt size={600} className="-rotate-12" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center rotate-6 border-4 border-slate-50 shadow-2xl">
                <Receipt className="text-white" size={40} />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-slate-900">Sar Taw Set</h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[12px] font-black text-amber-600 uppercase tracking-[0.5em]">Royal Caterer</p>
                  <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. 2024</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 space-y-2 border-l-4 border-slate-900/5 pl-8 ml-10">
              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Phone size={12} className="text-slate-400" />
                <span>+95 9 123 456 789</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Mail size={12} className="text-slate-400" />
                <span>concierge@sartawset.com</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-2 bg-slate-900/5 blur-lg rounded-full" />
              <h2 className="relative text-7xl font-black text-slate-100 uppercase leading-none select-none">INVOICE</h2>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-1">Invoice ID</p>
                <p className="text-xl font-black uppercase tracking-tight tabular-nums">#INV-{order.id.slice(0, 12).toUpperCase()}</p>
              </div>
              <div className="pr-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Date of Issue</p>
                <p className="text-base font-black text-slate-900 tracking-tight">
                  {new Date(order.createdAt).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informational Grid */}
        <div className="grid grid-cols-2 gap-16 mb-16">
          <div className="space-y-6">
            <div className="border-b-2 border-slate-900 pb-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Client Particulars</h3>
            </div>
            <div className="pl-2 space-y-4">
              <div>
                <p className="text-2xl font-black text-slate-900 leading-tight">{order.customerName}</p>
                <p className="text-sm font-bold text-slate-500 mt-1">{order.customerPhone}</p>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Site Location</p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800 leading-relaxed uppercase">
                    Apartment {order.roomNumber}
                    {order.address && <><br /><span className="text-slate-500 text-xs font-medium">{order.address}</span></>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-b-2 border-slate-900 pb-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Settlement & Logistics</h3>
            </div>
            <div className="grid grid-cols-2 gap-8 pl-2">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Protocol</p>
                  <p className="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1.5 rounded-lg inline-block shadow-md">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Window</p>
                  <p className="text-xs font-black uppercase border-2 border-slate-900 px-3 py-1.5 rounded-lg inline-block">08:00 - 10:00</p>
                </div>
              </div>
              <div className="space-y-4 flex flex-col items-center">
                 <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-xs font-black uppercase text-emerald-600">{order.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="flex-grow mt-8">
          <table className="w-full text-left border-collapse border-b-2 border-slate-900">
            <thead>
              <tr className="border-b-4 border-slate-900">
                <th className="py-6 px-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 w-20 text-center">No.</th>
                <th className="py-6 px-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Provision Description</th>
                <th className="py-6 px-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center w-36">Rate</th>
                <th className="py-6 px-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center w-28">Units</th>
                <th className="py-6 px-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-right w-44">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, index) => (
                <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-8 px-4 text-[12px] font-black text-slate-300 text-center">{String(index + 1).padStart(2, '0')}</td>
                  <td className="py-8 px-4">
                    <p className="text-base font-black text-slate-900 mb-1 capitalize">{item.name}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{item.mmName}</p>
                  </td>
                  <td className="py-8 px-4 text-sm font-bold text-slate-600 text-center tabular-nums">{formatPrice(item.price)}</td>
                  <td className="py-8 px-4 text-sm font-bold text-slate-900 text-center">
                    <span className="font-black">{item.quantity}</span> 
                    <span className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest">{item.unit}</span>
                  </td>
                  <td className="py-8 px-4 text-base font-black text-slate-900 text-right tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Signatures Section */}
        <div className="mt-16 border-t-8 border-slate-900 pt-16">
          <div className="flex justify-between items-start gap-20">
            <div className="flex-grow space-y-12">
               {order.note && (
                <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border-2 border-amber-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600 mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    Special Directives
                  </p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic border-l-4 border-amber-200 pl-6 uppercase tracking-wider">
                    "{order.note}"
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">Authenticator</h4>
                  <div className="h-24 flex items-end">
                    <p className="text-4xl font-serif italic text-slate-200 select-none tracking-tighter opacity-40 uppercase">Royal Caterer</p>
                  </div>
                  <div className="border-t-2 border-slate-900 pt-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Seal & Signature</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">Acknowledgement</h4>
                  <div className="h-24" />
                  <div className="border-t-2 border-slate-300 pt-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Endorsement</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-96 shrink-0 bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
              <div className="space-y-6">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Gross Sum</span>
                  <span className="text-base font-black tabular-nums">{formatPrice(order.total + (order.pointDiscount || 0))}</span>
                </div>
                
                {order.pointDiscount > 0 && (
                  <div className="flex justify-between items-center text-rose-500">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Credit Offset</span>
                    <span className="text-base font-black tabular-nums">-{formatPrice(order.pointDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Logistic Offset</span>
                  <span className="text-sm font-black uppercase tracking-[0.2em] italic">Complimentary</span>
                </div>

                <div className="h-px bg-slate-200 my-6" />

                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10">
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-3 block">Total Settlement</span>
                    <div className="flex justify-between items-end">
                      <span className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Loyalty Yielded</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 tracking-tight">+{order.earnedPoints} <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Credits</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fine Print Footer */}
        <div className="mt-20 pt-10 border-t-2 border-slate-100 flex justify-between items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <Globe size={14} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">www.sartawset.com</p>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Document Generated via Royal Asset Management System</p>
          </div>
          
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 mb-1">Sar Taw Set</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Mandalay Division, Myanmar</p>
          </div>
        </div>
      </div>
      
      {/* Royal Corner Accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-900 rounded-tl-[10rem] -br-20 -bb-20 z-0 opacity-[0.03] pointer-events-none" />
    </div>
  );
}
