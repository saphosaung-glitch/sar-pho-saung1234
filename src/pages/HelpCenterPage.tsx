import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, HelpCircle, Book, MessageCircle, ChevronDown, ChevronUp, 
  FileText, User, Info, XCircle, ShoppingCart, MessageSquare, ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, SupportContact } from '../context/StoreContext';

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const { supportNumber, supportContacts, darkMode, t, language } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'faq' | 'guides'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      id: 'faq-1',
      question: t('faq1Question'),
      answer: t('faq1Answer')
    },
    {
      id: 'faq-2',
      question: t('faq2Question'),
      answer: t('faq2Answer')
    },
    {
      id: 'faq-3',
      question: t('faq3Question'),
      answer: t('faq3Answer')
    },
    {
      id: 'faq-4',
      question: t('faq4Question'),
      answer: t('faq4Answer')
    },
    {
      id: 'faq-5',
      question: t('faq5Question'),
      answer: t('faq5Answer')
    }
  ];

  const getIconForType = (type: SupportContact['type']) => {
    switch(type) {
      case 'help': return <Info size={20} />;
      case 'order': return <ShoppingCart size={20} />;
      case 'cancellation': return <XCircle size={20} />;
      default: return <MessageSquare size={20} />;
    }
  };

  const guides = [
    {
      id: 'guide-1',
      title: t('gettingStartedTitle'),
      description: t('gettingStartedDesc'),
      icon: <Book size={20} />
    },
    {
      id: 'guide-2',
      title: t('managingProfileTitle'),
      description: t('managingProfileDesc'),
      icon: <User size={20} />
    },
    {
      id: 'guide-3',
      title: t('understandingOrderStatusTitle'),
      description: t('understandingOrderStatusDesc'),
      icon: <FileText size={20} />
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = guides.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    guide.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSupport = () => {
    const message = encodeURIComponent(t('supportMessage'));
    window.open(`https://wa.me/${supportNumber}?text=${message}`, '_blank');
  };

  return (
    <div className={`min-h-screen pb-24 font-sans selection:bg-primary/20 transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 h-[72px] flex items-center gap-4 transition-colors duration-300 ${darkMode ? 'bg-surface/80 border-white/5' : 'bg-white/80 border-slate-200/50'}`}>
        <button 
          onClick={() => navigate(-1)}
          className={`flex-none w-10 h-10 border shadow-sm rounded-full flex items-center justify-center transition-all active:scale-90 ${darkMode ? 'bg-surface-container border-white/10 hover:bg-surface-container-high' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
        >
          <ChevronLeft size={20} className={darkMode ? 'text-on-surface' : 'text-slate-600'} />
        </button>
        <div className="flex flex-col">
          <h2 className={`text-lg font-black tracking-tight leading-tight ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{t('helpCenter')}</h2>
          <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-400'}`}>{t('faqsGuides')}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className={darkMode ? 'text-on-surface-variant/60' : 'text-slate-400'} />
          </div>
          <input
            type="text"
            placeholder={t('searchHelp')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm ${darkMode ? 'bg-surface-container border-white/10 text-on-surface' : 'bg-white border-slate-200/60 text-slate-900'}`}
          />
        </div>

        {/* Tabs */}
        <div className={`flex p-1 rounded-2xl transition-colors duration-300 ${darkMode ? 'bg-white/5' : 'bg-slate-200/50'}`}>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'faq' 
                ? darkMode ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm' 
                : darkMode ? 'text-on-surface-variant/60 hover:text-on-surface' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('faqs')}
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'guides' 
                ? darkMode ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm' 
                : darkMode ? 'text-on-surface-variant/60 hover:text-on-surface' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('guides')}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'faq' ? (
            filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border shadow-sm overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/60'}`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className={`text-sm font-bold pr-4 ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{faq.question}</span>
                    {expandedFaq === faq.id ? (
                      <ChevronUp size={18} className="text-primary flex-shrink-0" />
                    ) : (
                      <ChevronDown size={18} className={darkMode ? 'text-on-surface-variant/30' : 'text-slate-400 flex-shrink-0'} />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFaq === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-5 pt-0 text-sm font-medium leading-relaxed border-t mt-2 ${darkMode ? 'text-on-surface-variant/60 border-white/5' : 'text-slate-500 border-slate-50'}`}>
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <HelpCircle size={48} className={`mx-auto mb-4 ${darkMode ? 'text-white/5' : 'text-slate-200'}`} />
                <p className={darkMode ? 'text-on-surface-variant/60 font-medium' : 'text-slate-500 font-medium'}>{t('noFaqsFound')}</p>
              </div>
            )
          ) : (
            filteredGuides.length > 0 ? (
              filteredGuides.map((guide) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border shadow-sm p-5 flex items-start gap-4 hover:border-primary/30 transition-colors cursor-pointer group ${darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/60'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-primary flex-shrink-0 transition-colors ${darkMode ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-primary/5 group-hover:bg-primary/10'}`}>
                    {guide.icon}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>{guide.title}</h3>
                    <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-on-surface-variant/60' : 'text-slate-500'}`}>{guide.description}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Book size={48} className={`mx-auto mb-4 ${darkMode ? 'text-white/5' : 'text-slate-200'}`} />
                <p className={darkMode ? 'text-on-surface-variant/60 font-medium' : 'text-slate-500 font-medium'}>{t('noGuidesFound')}</p>
              </div>
            )
          )}
        </div>

        {/* Contact Support Banner */}
        <div className="space-y-4 mt-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <MessageCircle size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black mb-1">{t('stillNeedHelp')}</h3>
                <p className="text-emerald-50 text-sm font-medium max-w-xs mx-auto">
                  {t('supportTeamReady')}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 px-2">
            {supportContacts.map((contact) => (
              <motion.button 
                key={contact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  const message = encodeURIComponent(t('supportMessage'));
                  window.open(`https://wa.me/${contact.phone}?text=${message}`, '_blank');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 ${
                  darkMode ? 'bg-surface-container-high border-white/5' : 'bg-white border-slate-200/60 shadow-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  {getIconForType(contact.type)}
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>
                    {language === 'en' ? contact.labelEn : (contact.labelMm || contact.labelEn)}
                  </p>
                  <p className="text-[10px] font-bold opacity-40">Contact via WhatsApp</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
