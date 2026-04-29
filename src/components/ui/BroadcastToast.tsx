import React from 'react';
import { toast } from 'sonner';
import { Bell, Megaphone, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const BroadcastToast = ({ title, message, type, t }: { title: string, message: string, type: 'promotion' | 'system' | 'update', t: string | number }) => {
    const { darkMode } = useStore();
    const icons = {
        promotion: <Megaphone className="text-pink-500" size={20} />,
        system: <AlertCircle className="text-amber-500" size={20} />,
        update: <Info className="text-blue-500" size={20} />,
    };

    return (
        <div className={`${darkMode ? 'dark' : ''} w-full`}>
            <div className="w-full p-4 rounded-2xl shadow-xl border flex items-start gap-4 bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/10">
                <div className="mt-1">
                    {icons[type] || <Bell className="text-zinc-500" size={20}/>}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{message}</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="opacity-50 hover:opacity-100 p-1 text-zinc-900 dark:text-zinc-100">
                    ×
                </button>
            </div>
        </div>
    );
};
