import React from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { X, Download, Share2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { BRAND_LOGO } from '../../constants';
import { useStore } from '../../context/StoreContext';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  subtitle?: string;
  darkMode?: boolean;
}

export function QRCodeModal({ isOpen, onClose, url, title, subtitle, darkMode }: QRCodeModalProps) {
  const { settings } = useStore();
  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);
  
  const finalUrl = url || settings.productionUrl;

  React.useEffect(() => {
    // Attempt to pre-load logo as data URL to avoid CORS/Tainting issues during download
    if (isOpen) {
      const fetchLogo = async () => {
        try {
          // Add crossOrigin: 'anonymous' to fetch to check CORS support
          const response = await fetch(BRAND_LOGO, { mode: 'cors' });
          if (!response.ok) throw new Error('CORS fetch failed');
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setLogoDataUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.warn('CORS restricted logo - download will not include logo to remain secure:', err);
          setLogoDataUrl(null); // Explicitly null if fetch fails
        }
      };
      fetchLogo();
    }
  }, [isOpen]);

  const downloadQR = () => {
    const canvas = document.getElementById('app-qr-canvas') as HTMLCanvasElement;
    if (!canvas) {
      toast.error('Failed to generate download');
      return;
    }
    
    try {
      // Create a final canvas with padding and high quality
      const finalCanvas = document.createElement('canvas');
      const padding = 80;
      finalCanvas.width = canvas.width + padding;
      finalCanvas.height = canvas.height + padding;
      const ctx = finalCanvas.getContext('2d');
      
      if (ctx) {
        // High quality background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        // Soft shadow for the QR code
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 20;
        
        // Draw QR code from high-res hidden canvas
        ctx.drawImage(canvas, padding/2, padding/2);
        
        // Optional: Add branding text to the bottom
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '2px';
        // ctx.fillText('SAR TAW SET', finalCanvas.width / 2, finalCanvas.height - 25);
        
        const pngFile = finalCanvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${title?.toLowerCase().replace(/\s+/g, '-') || 'qr-code'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        if (logoDataUrl) {
          toast.success('QR Code with Logo downloaded');
        } else {
          toast.success('QR Code downloaded (Logo skipped due to security)');
        }
      }
    } catch (error) {
      console.error('QR Download Error:', error);
      toast.error('Could not generate image. Please try again.');
    }
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
            {/* Hidden Canvas for Downloads */}
            <div className="hidden">
              <QRCodeCanvas
                id="app-qr-canvas"
                value={finalUrl}
                size={1024}
                level="H"
                includeMargin={true}
                fgColor="#0f172a"
                imageSettings={logoDataUrl ? {
                  src: logoDataUrl,
                  height: 220,
                  width: 220,
                  excavate: true,
                } : undefined}
              />
            </div>

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
                  value={finalUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#0f172a"
                  imageSettings={{
                    src: BRAND_LOGO,
                    height: 44,
                    width: 44,
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
