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
      className="bg-white text-black p-[5mm] mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-none flex flex-col font-sans relative print:p-0 print:max-w-full print:w-[58mm] print:mx-0 print:shadow-none print:min-h-0 print:bg-white print:text-black"
      style={{ 
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        lineHeight: '1.2',
        paddingBottom: '20mm'
      }}
    >
      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: #ffffff !important; 
            color: #000000 !important;
            font-size: 11pt; 
            width: 58mm; 
            margin: 0; 
            padding: 0;
            font-family: Arial, Helvetica, sans-serif !important;
          }
          .print-hidden { display: none !important; }
          @page { size: 58mm auto; margin: 0; }
          * { 
            background-color: transparent !important;
            color: #000000 !important;
            border-color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-weight: bold !important;
            -webkit-text-stroke: 0.4px #000000 !important;
            box-shadow: none !important;
            opacity: 1 !important;
            filter: none !important;
          }
          .thermal-bold { 
            font-weight: 900 !important;
            color: #000000 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            -webkit-text-stroke: 0.8px #000000 !important;
          }
          .print-border-thick { border-width: 4px !important; border-color: black !important; border-style: solid !important; }
          .print-border-b-thick { border-bottom-width: 4px !important; border-color: black !important; border-style: solid !important; }
          .print-border-t-thick { border-top-width: 4px !important; border-color: black !important; border-style: solid !important; }
          .thermal-text-5xl { font-size: 28pt !important; line-height: 1 !important; }
          .thermal-text-4xl { font-size: 24pt !important; line-height: 1 !important; }
          .thermal-text-3xl { font-size: 20pt !important; line-height: 1.1 !important; }
          .thermal-text-2xl { font-size: 18pt !important; line-height: 1.1 !important; }
          .thermal-text-xl { font-size: 16pt !important; line-height: 1.2 !important; }
          .thermal-text-lg { font-size: 14pt !important; line-height: 1.2 !important; }
          .thermal-text-base { font-size: 12pt !important; line-height: 1.3 !important; }
          .thermal-text-sm { font-size: 10pt !important; line-height: 1.3 !important; }
          table { width: 100%; page-break-inside: avoid; border-collapse: collapse; margin-bottom: 3mm; border-bottom: 3px solid black !important; }
          tr { page-break-inside: avoid; page-break-after: auto; border-bottom: 1.5px solid black !important; }
          th, td { padding: 4px 2px !important; }
          thead { display: table-header-group; border-bottom: 4px solid black !important; }
          tfoot { display: table-footer-group; }
          .print-w-full { width: 100% !important; }
        }
      `}</style>
      
      {/* Royal Head Decoration border */}
      <div className="absolute top-0 left-0 w-full h-3 bg-black print:h-2" />
      <div className="absolute top-4 left-0 w-full h-1 bg-black print:hidden" />
      
      {/* Background Watermark - hidden on print for clarity */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none print:hidden">
        <Receipt size={600} className="-rotate-12" />
      </div>

      <div className="relative z-10 flex flex-col h-full print:gap-4 mt-8 print:mt-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-6 print:flex-col print:mb-4 print:gap-2">
          <div className="space-y-4 print:w-full print:text-center print:-ml-0">
            <div className="flex items-center gap-4 print:flex-col print:items-center print:gap-2">
              <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center border-4 border-black print:border-black print:w-12 print:h-12 print:rounded-lg">
                <Receipt className="text-white print:text-white" size={32} />
              </div>
              <div className="print:text-center">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase leading-none text-black thermal-bold print:thermal-text-4xl text-center">Sar Taw Set</h1>
                <div className="flex items-center gap-2 mt-2 print:justify-center">
                  <p className="text-xs sm:text-sm font-black text-black uppercase tracking-[0.2em] sm:tracking-[0.5em] thermal-bold print:thermal-text-lg">Royal Caterer</p>
                  <p className="text-[11px] sm:text-xs font-black text-black uppercase tracking-widest thermal-bold print:thermal-text-lg">Est. 2024</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 space-y-2 border-l-4 border-black pl-6 ml-8 print:border-l-0 print:border-b-4 print:border-t-4 print:border-black print:pl-0 print:ml-0 print:py-4 print:text-center">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-black text-black uppercase tracking-wider thermal-bold print:justify-center print:thermal-text-xl">
                <Phone size={14} className="text-black print:w-6 print:h-6" />
                <span>+95 9 123 456 789</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-black text-black uppercase tracking-wider thermal-bold print:hidden">
                <Mail size={14} className="text-black" />
                <span>concierge@sartawset.com</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right print:text-center print:w-full print:mt-4">
            <div className="relative inline-block mb-4 print:hidden">
              <h2 className="relative text-5xl sm:text-7xl font-black text-black uppercase leading-none select-none thermal-bold">INVOICE</h2>
            </div>
            
            <div className="space-y-3 relative z-10 print:flex print:flex-col print:gap-2 print:items-center">
              <div className="bg-black text-white p-3 rounded-xl print:bg-transparent print:text-black print-border-thick print:p-3 print:-mx-0">
                <p className="text-xs font-black uppercase tracking-widest sm:tracking-[0.3em] mb-1 print:text-black thermal-bold print:thermal-text-lg">Invoice ID</p>
                <p className="text-lg sm:text-xl font-black uppercase tracking-tight tabular-nums print:text-black thermal-bold print:thermal-text-2xl">#INV-{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="pr-2 sm:pr-4 print:pr-0 print:pt-4">
                <p className="text-xs font-black uppercase tracking-widest sm:tracking-[0.3em] text-black mb-1 thermal-bold print:thermal-text-lg">Date of Issue</p>
                <p className="text-sm sm:text-base font-black text-black tracking-tight thermal-bold print:thermal-text-xl">
                  {new Date(order.createdAt).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })} {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informational Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 print:flex print:flex-col print:gap-6 print:mb-6">
          <div className="space-y-4">
            <div className="border-b-4 border-black pb-2 print-border-b-thick print:pb-4">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-widest sm:tracking-[0.3em] text-black thermal-bold print:thermal-text-xl">Customer Info</h3>
            </div>
            <div className="pl-2 print:pl-0 space-y-3">
              <div>
                <p className="text-xl sm:text-2xl font-black text-black leading-tight thermal-bold print:thermal-text-2xl">{order.customerName}</p>
                <p className="text-sm sm:text-base font-black text-black mt-1 thermal-bold print:thermal-text-xl">{order.customerPhone}</p>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-black uppercase tracking-widest text-black thermal-bold print:thermal-text-lg">Delivery Address</p>
                <div className="p-3 border-2 border-black rounded-xl print-border-thick print:p-4 print:rounded-none">
                  <p className="text-sm sm:text-base font-black text-black leading-relaxed uppercase thermal-bold print:thermal-text-xl">
                    Apartment {order.roomNumber}
                    {order.address && <><br /><span className="text-black text-xs sm:text-sm mt-1 block font-black thermal-bold line-clamp-3 print:thermal-text-lg">{order.address}</span></>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b-4 border-black pb-2 print-border-b-thick print:pb-4">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-widest sm:tracking-[0.3em] text-black thermal-bold print:thermal-text-xl">Payment & Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-2 print:pl-0 print:grid-cols-1 print:gap-6">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-black mb-1 thermal-bold print:thermal-text-lg">Method</p>
                <p className="text-xs sm:text-sm font-black uppercase border-2 border-black print-border-thick text-black px-3 py-1.5 rounded-lg inline-block thermal-bold print:thermal-text-xl print:px-6 print:py-3">{order.paymentMethod}</p>
              </div>
              <div className="space-y-3 flex flex-col items-start print:items-center">
                <p className="text-xs font-black uppercase tracking-widest text-black mb-1 thermal-bold print:thermal-text-lg">Current Status</p>
                <div className="flex items-center gap-2 border-2 border-black print-border-thick px-3 py-1.5 rounded-lg print:px-6 print:py-3">
                  <p className="text-xs sm:text-sm font-black uppercase text-black thermal-bold print:thermal-text-xl">{order.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="flex-grow mt-4 print:mt-2">
          <table className="w-full text-left border-collapse border-b-4 border-black print-border-b-thick">
            <thead>
              <tr className="border-b-4 border-black print-border-b-thick">
                <th className="py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] text-black text-left thermal-bold print:thermal-text-lg">Item</th>
                <th className="py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] text-black text-center thermal-bold w-12 sm:w-20 print:thermal-text-lg">Qty</th>
                <th className="py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] text-black text-right thermal-bold w-20 sm:w-32 print:hidden">Price</th>
                <th className="py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] text-black text-right thermal-bold w-24 sm:w-36 print:w-32 print:thermal-text-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/20 print:divide-black">
              {order.items.map((item, index) => (
                <tr key={index} className="group hover:bg-slate-50/50 transition-colors opacity-100 print:border-b-4 print:border-black">
                  <td className="py-4 px-2">
                    <p className="text-sm sm:text-base font-black text-black mb-0.5 capitalize thermal-bold leading-tight print:thermal-text-xl">{item.name}</p>
                    <p className="text-[10px] sm:text-[11px] font-black text-black uppercase tracking-wider thermal-bold leading-tight print:thermal-text-lg">{item.mmName}</p>
                  </td>
                  <td className="py-4 px-2 text-sm sm:text-base font-black text-black text-center thermal-bold print:thermal-text-xl">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-2 text-sm sm:text-base font-black text-black text-right tabular-nums thermal-bold print:hidden">
                    {formatPrice(item.price)}
                  </td>
                  <td className="py-4 px-2 text-sm sm:text-base font-black text-black text-right tabular-nums thermal-bold print:thermal-text-xl">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="mt-8 border-t-8 border-black pt-6 print:mt-4 print:pt-4 print-border-t-thick">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 print:flex-col print:gap-6">
            <div className="flex-grow space-y-6 w-full">
               {order.note && (
                <div className="p-4 bg-white border-4 border-black print-border-thick rounded-2xl relative overflow-hidden print:p-6 print:rounded-none">
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-black mb-2 flex items-center gap-2 thermal-bold print:thermal-text-xl">
                    <span className="w-2 h-2 bg-black rounded-full print:w-4 print:h-4" />
                    Special Note
                  </p>
                  <p className="text-sm sm:text-base font-black text-black leading-relaxed italic border-l-4 border-black print-border-thick pl-4 uppercase tracking-wider thermal-bold print:thermal-text-2xl print:border-l-8">
                    "{order.note}"
                  </p>
                </div>
              )}
              
              <div className="hidden sm:grid grid-cols-2 gap-12 print:hidden">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-black thermal-bold">Authenticator</h4>
                  <div className="h-20 flex items-end">
                    <p className="text-3xl font-serif italic text-black select-none tracking-tighter uppercase thermal-bold">S.T.S</p>
                  </div>
                  <div className="border-t-4 border-black pt-3">
                      <p className="text-xs font-black uppercase tracking-widest text-black thermal-bold">Seal & Signature</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-black thermal-bold">Acknowledgement</h4>
                  <div className="h-20" />
                  <div className="border-t-4 border-black pt-3">
                      <p className="text-xs font-black uppercase tracking-widest text-black thermal-bold">Recipient Sign</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-96 shrink-0 bg-white p-6 rounded-2xl border-4 border-black print-border-thick print:p-4 print:w-full print:rounded-none">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-black">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest thermal-bold print:thermal-text-lg">Subtotal</span>
                  <span className="text-sm sm:text-base font-black tabular-nums thermal-bold print:thermal-text-xl">
                    {formatPrice(order.items.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0))}
                  </span>
                </div>
                
                {order.pointDiscount > 0 && (
                  <div className="flex justify-between items-center text-black">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-widest thermal-bold print:thermal-text-lg">Discount</span>
                    <span className="text-sm sm:text-base font-black tabular-nums thermal-bold print:thermal-text-xl">-{formatPrice(order.pointDiscount)}</span>
                  </div>
                )}

                <div className={`flex justify-between items-center text-black`}>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest thermal-bold print:thermal-text-lg">Delivery</span>
                  <span className="text-sm sm:text-base font-black uppercase tracking-widest italic thermal-bold print:thermal-text-xl">
                    {order.deliveryFee === 0 ? 'Free' : `${formatPrice(order.deliveryFee)}`}
                  </span>
                </div>

                <div className="h-2 bg-black my-4 print:h-4" />

                <div className="bg-black text-white p-6 rounded-xl relative overflow-hidden print:bg-white print:text-black print:border-8 print:border-black print-border-thick print:p-6 print:rounded-none">
                  <div className="relative z-10">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2 block thermal-bold print:thermal-text-xl">Total Amount</span>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl sm:text-5xl font-black tracking-tighter tabular-nums leading-none thermal-bold print:thermal-text-5xl print:w-full print:text-center">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Print Thank You Note */}
        <div className="hidden print:block text-center mt-12 pt-12 border-t-8 border-dashed border-black">
          <p className="text-4xl font-black uppercase thermal-bold mb-4 print:text-5xl">Thank you!</p>
          <p className="text-2xl font-black thermal-bold print:text-3xl">Please come again</p>
          <div className="flex justify-center mt-8">
             <Receipt size={80} className="text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
