'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Bell, Send, Users, ShoppingBag, Bike, Megaphone, CheckCircle } from 'lucide-react';

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Users', icon: Users, desc: 'Everyone with push enabled' },
  { value: 'customer', label: 'Customers Only', icon: ShoppingBag, desc: 'Only app customers' },
  { value: 'delivery_partner', label: 'Riders Only', icon: Bike, desc: 'Only delivery partners' },
];

export default function BroadcastNotificationsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', body: '', target_role: 'all', url: '' });
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const res = await api.post('/admin/notifications/broadcast', form);
      const { sent, message } = res.data;
      setLastResult({ sent, message });
      toast.success(`Sent to ${sent} subscriber${sent !== 1 ? 's' : ''}!`);
      setForm(prev => ({ ...prev, title: '', body: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broadcast Notification</h1>
            <p className="text-sm text-gray-500">Send push notification to all your users</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Target Audience</label>
              <div className="grid grid-cols-3 gap-3">
                {TARGET_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const active = form.target_role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, target_role: opt.value }))}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                      <p className={`text-xs font-bold ${active ? 'text-orange-700' : 'text-gray-700'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-400 leading-tight mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. 🎉 Weekend Special Offer!"
                maxLength={80}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                required
              />
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/80</p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="e.g. Get 20% off all orders this weekend. Use code WEEKEND20!"
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">{form.body.length}/200</p>
            </div>

            {/* URL (optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deep Link URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.url}
                onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="e.g. /offers or /restaurant/xyz"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Preview */}
            {(form.title || form.body) && (
              <div className="bg-gray-900 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-2">Preview</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{form.title || 'Notification Title'}</p>
                    <p className="text-gray-300 text-xs mt-0.5">{form.body || 'Your message will appear here.'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Result banner */}
            {lastResult && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">{lastResult.message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {sending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Notification</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Only users who have granted notification permission will receive this.</p>
      </div>
    </div>
  );
}
