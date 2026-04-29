import React from 'react';
import { Bell } from 'lucide-react';

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

  return (
    <div className={`p-6 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-white shadow-sm border border-gray-100'}`}>
      <h3 className="text-lg font-black mb-4">Create Broadcast</h3>
      <div className="space-y-4 mb-8">
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification Title"
          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
        />
        <textarea 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Notification Message"
          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
        />
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value as any)}
          className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
        >
          <option value="promotion">Promotion</option>
          <option value="system">System</option>
          <option value="update">Update</option>
        </select>
        <button 
          onClick={handleSend}
          disabled={isSending || !title || !message}
          className={`px-4 py-2 rounded-xl bg-blue-600 text-white font-bold ${isSending ? 'opacity-50' : ''}`}
        >
          {isSending ? 'Sending...' : 'Send Broadcast'}
        </button>
      </div>
      <h3 className="text-lg font-black mb-4">Broadcast History</h3>
      <div className="space-y-4">
        {history.length === 0 ? (
          <p className="opacity-40 italic">No broadcast history found.</p>
        ) : (
          history.map((n) => (
            <div key={n.id} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
              <div className="p-2 rounded-lg bg-blue-100/10 text-blue-400">
                <Bell size={18} />
              </div>
              <div>
                <p className="font-bold text-sm">{n.title}</p>
                <p className="text-xs opacity-70">{n.message}</p>
                <p className="text-[10px] opacity-40 mt-1">{new Date(n.date).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
