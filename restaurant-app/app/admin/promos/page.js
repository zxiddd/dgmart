'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Tag, Plus, Trash2, Edit3, X, Check, Shuffle } from 'lucide-react';

const USAGE_TYPES = [
  { value: 'everyone', label: 'Everyone', desc: 'Unlimited uses by all users', maxPerUser: 999, usageLimit: null },
  { value: 'per_user', label: 'Per User Once', desc: 'Each user can use this once', maxPerUser: 1, usageLimit: null },
  { value: 'single_use', label: 'Single Use', desc: 'Only 1 claim globally', maxPerUser: 1, usageLimit: 1 },
  { value: 'specific_user', label: 'Specific User', desc: 'Only one chosen user', maxPerUser: 1, usageLimit: 1 },
];

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const EMPTY_FORM = {
  code: '', type: 'percentage', value: '', min_order: '', max_discount: '',
  valid_from: '', valid_until: '', first_order_only: false,
  usage_type: 'per_user', target_user_phone: '', is_active: true,
};

export default function PromoCodesPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    try {
      const res = await api.get('/admin/promos');
      setPromos(res.data.data.promos || []);
    } catch { toast.error('Failed to load promo codes'); }
    finally { setLoading(false); }
  };

  const resolveUserByPhone = async (phone) => {
    if (!phone) return null;
    try {
      const res = await api.get(`/admin/users?search=${phone}`);
      const users = res.data.data?.users || [];
      return users[0]?.id || null;
    } catch { return null; }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) { toast.error('Code and value are required'); return; }
    setSaving(true);
    try {
      const selectedType = USAGE_TYPES.find(u => u.value === form.usage_type);
      let target_user_id = null;
      if (form.usage_type === 'specific_user') {
        target_user_id = await resolveUserByPhone(form.target_user_phone);
        if (!target_user_id) { toast.error('User not found with that phone number'); setSaving(false); return; }
      }
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order: form.min_order ? parseFloat(form.min_order) : 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        first_order_only: form.first_order_only,
        usage_limit: selectedType.usageLimit,
        max_uses_per_user: selectedType.maxPerUser,
        target_user_id,
        is_active: form.is_active,
      };
      await api.post('/admin/promos', payload);
      toast.success('Promo code created!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchPromos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create promo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/promos/${id}`);
      setPromos(p => p.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const getStatus = (p) => {
    const now = new Date();
    if (!p.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500' };
    if (p.valid_until && new Date(p.valid_until) < now) return { label: 'Expired', color: 'bg-red-100 text-red-600' };
    if (p.usage_limit && p.used_count >= p.usage_limit) return { label: 'Used Up', color: 'bg-orange-100 text-orange-600' };
    return { label: 'Active', color: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
              <p className="text-sm text-gray-500">{promos.length} code{promos.length !== 1 ? 's' : ''} total</p>
            </div>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-200"
          >
            <Plus className="w-4 h-4" /> Create Code
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : promos.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No promo codes yet. Create one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Discount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Usage</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Expires</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {promos.map(p => {
                    const status = getStatus(p);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{p.code}</span>
                            {p.first_order_only && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">1st order</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {p.type === 'percentage' ? `${p.value}%` : `₹${p.value}`} off
                          {p.min_order > 0 && <span className="text-xs text-gray-400 ml-1">min ₹{p.min_order}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.used_count || 0} / {p.usage_limit ? p.usage_limit : '∞'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.valid_until ? new Date(p.valid_until).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            {deletingId === p.id
                              ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Promo Code</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="DEGLOOR20"
                    maxLength={20}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm font-mono uppercase focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    required
                  />
                  <button type="button" onClick={() => setForm(p => ({ ...p, code: generateCode() }))}
                    className="px-3 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors" title="Generate random code">
                    <Shuffle className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Type *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Value *</label>
                  <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    placeholder={form.type === 'percentage' ? '20' : '50'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400" required />
                </div>
              </div>

              {/* Min order + max discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Min. Order (₹)</label>
                  <input type="number" value={form.min_order} onChange={e => setForm(p => ({ ...p, min_order: e.target.value }))}
                    placeholder="0" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400" />
                </div>
                {form.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Discount (₹)</label>
                    <input type="number" value={form.max_discount} onChange={e => setForm(p => ({ ...p, max_discount: e.target.value }))}
                      placeholder="100" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                )}
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valid From</label>
                  <input type="date" value={form.valid_from} onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400" />
                </div>
              </div>

              {/* Usage Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Usage Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {USAGE_TYPES.map(ut => (
                    <button key={ut.value} type="button"
                      onClick={() => setForm(p => ({ ...p, usage_type: ut.value }))}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        form.usage_type === ut.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-xs font-bold ${form.usage_type === ut.value ? 'text-purple-700' : 'text-gray-700'}`}>{ut.label}</p>
                      <p className="text-xs text-gray-400 leading-tight mt-0.5">{ut.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific user phone */}
              {form.usage_type === 'specific_user' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">User Phone Number</label>
                  <input type="text" value={form.target_user_phone}
                    onChange={e => setForm(p => ({ ...p, target_user_phone: e.target.value }))}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400" />
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">First Order Only</p>
                  <p className="text-xs text-gray-400">Only for users with no previous orders</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, first_order_only: !p.first_order_only }))}
                  className={`w-12 h-6 rounded-full transition-all ${form.first_order_only ? 'bg-purple-500' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.first_order_only ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={saving}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                  : <><Check className="w-4 h-4" /> Create Promo Code</>
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
