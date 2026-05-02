import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Share2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  subtitle?: string;
  darkMode?: boolean;
}

export function QRCodeModal({ isOpen, onClose, url, title, subtitle, darkMode }: QRCodeModalProps) {
  const downloadQR = () => {
    const svg = document.querySelector('#app-qr-code') as SVGElement;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${title || 'qr-code'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR Code downloaded');
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl ${
              darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 shadow-xl'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b flex items-center justify-between ${
              darkMode ? 'border-white/5' : 'border-slate-100'
            }`}>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{title || 'Share App'}</h3>
                {subtitle && <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col md:flex-row items-center gap-8">
              <div className={`p-6 rounded-3xl shrink-0 ${darkMode ? 'bg-white shadow-xl shadow-primary/10' : 'bg-white shadow-2xl shadow-slate-200'}`}>
                <QRCodeSVG
                  id="app-qr-code"
                  value={url}
                  size={180}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "https://scontent.fkul7-2.fna.fbcdn.net/v/t39.30808-6/684505557_122097016515302120_6150026231108406984_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=65onKQ3wqrwQ7kNvwH-5Tn-&_nc_oc=AdoS-wVrlfKZ1ez9KNNdnG2zrOlHcnj7uHcGjRb3mW6fp1oguy8-8wQ1-pXhxzE26ke-vq-3N92HeuXbHTYkvevu&_nc_zt=23&_nc_ht=scontent.fkul7-2.fna&_nc_gid=lCsMSE2No98znYrLT3N7sg&_nc_ss=7b2a8&oh=00_Af4X8z6JL4VX10-1XWuFqPcF1kQfsivurJR7gMP3HKIQ7Q&oe=69FC4851", // Using custom uploaded logo
                    x: undefined,
                    y: undefined,
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
              </div>

              <div className="flex-1 w-full flex flex-col justify-center">
                <div className="space-y-3">
                  <button
                    onClick={downloadQR}
                    className="w-full py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    <Download size={18} />
                    Download Image
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={copyUrl}
                      className={`py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                        darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <Copy size={16} />
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: title || 'Shop App',
                            url: url
                          });
                        } else {
                          copyUrl();
                        }
                      }}
                      className={`py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                        darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <Share2 size={16} />
                      Share Link
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-[9px] font-bold opacity-30 uppercase tracking-widest leading-relaxed">
                  Scan this QR code with a mobile camera to open the application instantly.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
