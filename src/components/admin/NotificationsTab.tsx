import React from 'react';
import { Bell, Send, History, Sparkles, MessageCircle, Info } from 'lucide-react';

export function NotificationsTab({
  broadcastNotifications,
  sendBroadcast,
  darkMode,
}: {
  broadcastNotifications: any[];
  sendBroadcast: (payload: { title: string; message: string; type: 'promotion' | 'system' | 'update' }) => Promise<void>;
  darkMode: boolean;
}) {
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [type, setType] = React.useState<'promotion' | 'system' | 'update'>('promotion');
  const [isSending, setIsSending] = React.useState(false);

  const history = broadcastNotifications
    .map(n => ({
      ...n,
      date: n.createdAt?.seconds ? n.createdAt.seconds * 1000 : new Date(n.createdAt).getTime()
    }))
    .sort((a, b) => b.date - a.date);

  const handleSend = async () => {
    if (!title || !message) return;
    setIsSending(true);
    await sendBroadcast({ title, message, type });
    setTitle('');
    setMessage('');
    setIsSending(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'promotion': return <Sparkles size={16} />;
      case 'system': return <Info size={16} />;
      case 'update': return <MessageCircle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-black tracking-tight">Create Broadcast</h3>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Send notification to all active users</p>
        </div>

        <div className={`p-6 rounded-[2.5rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-on-surface/5 shadow-sm'} space-y-5`}>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 ml-2 italic">Title</label>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Flash Sale!"
              className={`w-full px-5 py-3 rounded-2xl border text-sm font-bold outline-none focus:border-primary transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'}`}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 ml-2 italic">Message</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification details..."
              rows={3}
              className={`w-full px-5 py-3 rounded-2xl border text-sm font-bold outline-none focus:border-primary transition-all resize-none ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 ml-2 italic">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
                className={`w-full px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-on-surface/5'}`}
              >
                <option value="promotion">Promotion</option>
                <option value="system">System Alert</option>
                <option value="update">App Update</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={handleSend}
                disabled={isSending || !title || !message}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isSending || !title || !message
                    ? 'bg-on-surface/5 opacity-40 cursor-not-allowed'
                    : 'bg-primary text-surface shadow-lg shadow-primary/20'
                }`}
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    Broadcast Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight">Broadcast History</h3>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Recently sent messages</p>
          </div>
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-on-surface/5'}`}>
            <History size={16} className="opacity-40" />
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
          {history.length === 0 ? (
            <div className={`p-12 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center text-center space-y-3 ${
              darkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <Bell size={32} className="opacity-10" />
              <p className="text-xs font-bold opacity-40 italic">No broadcast history yet</p>
            </div>
          ) : (
            history.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 rounded-3xl border transition-all duration-300 ${
                  darkMode ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]' : 'bg-white border-on-surface/5 hover:border-primary/20 shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    darkMode ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-primary/5 border-primary/10 text-primary'
                  }`}>
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-black text-xs text-on-surface truncate pr-2">{n.title}</h4>
                      <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter shrink-0 whitespace-nowrap">
                        {new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed h-8">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                        darkMode ? 'bg-white/10 text-white/60' : 'bg-on-surface/5 text-on-surface/60'
                      }`}>
                        {n.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
