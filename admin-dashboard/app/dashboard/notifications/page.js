'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Megaphone, Send, Info, AlertTriangle, Users, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('all'); // all, customers, delivery_partners, restaurant_owners
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title || !message) {
            toast.error('Title and Message are required');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/admin/notifications/broadcast', {
                title,
                body: message,
                target_role: target === 'all' ? null : target
            });

            if (res.data.success) {
                toast.success('Notification broadcasted successfully!');
                setTitle('');
                setMessage('');
            } else {
                toast.error(res.data.message || 'Failed to send notification');
            }
        } catch (error) {
            console.error('Error broadcasting notification:', error);
            toast.error(error.response?.data?.message || 'Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-gray-800">Broadcast Notifications</h1>
                <p className="text-gray-500 text-sm">Send push notifications to multiple users at once.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSend} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Target Audience</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {[
                                    { id: 'all', label: 'Everyone', icon: Users },
                                    { id: 'customer', label: 'Customers', icon: Users },
                                    { id: 'delivery_partner', label: 'Drivers', icon: Users },
                                    { id: 'restaurant_owner', label: 'Restaurants', icon: Users },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTarget(t.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                            target === t.id 
                                            ? 'bg-primary/10 border-primary text-primary' 
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <t.icon size={20} className="mb-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Notification Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Weekend Sale! 🎉"
                                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                maxLength={50}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Message Body</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your announcement here..."
                                className="w-full p-3 h-32 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                maxLength={200}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !title || !message}
                            className="w-full py-4 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:bg-gray-300 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={20} />
                                    <span>Send Broadcast Now</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm">
                        <div className="flex items-center gap-2 text-orange-700 font-bold mb-3">
                            <AlertTriangle size={20} />
                            <span>Preview</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 relative overflow-hidden">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0">
                                    <Bell size={20} fill="currentColor" />
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DegloorMart</span>
                                        <span className="text-[10px] text-gray-400">now</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{title || 'Promotion Title'}</h4>
                                    <p className="text-xs text-gray-600 leading-snug line-clamp-2">
                                        {message || 'Click here to see what\'s new in the app today! Don\'t miss out on special offers.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-orange-600 mt-4 leading-relaxed font-medium">
                            * This is how the notification will look on user devices. Ensure the message is clear and engaging.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                            <Info size={20} />
                            <span>Quick Tip</span>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            Use emojis and clear call-to-actions to increase click-through rates. Avoid sending too many notifications as users might disable them.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
