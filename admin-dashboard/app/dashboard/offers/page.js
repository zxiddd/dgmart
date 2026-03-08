'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Gift, Plus, Trash2, Edit, Eye, EyeOff, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const GRADIENT_PRESETS = [
    { label: 'Gold', colors: ['#D4AF37', '#8B6508'] },
    { label: 'Orange', colors: ['#F97316', '#EA580C'] },
    { label: 'Blue', colors: ['#3B82F6', '#1D4ED8'] },
    { label: 'Green', colors: ['#10B981', '#047857'] },
    { label: 'Red', colors: ['#EF4444', '#B91C1C'] },
    { label: 'Purple', colors: ['#8B5CF6', '#6D28D9'] },
    { label: 'Dark Gold', colors: ['#D4AF37', '#A07810', '#7A5C00'] },
];

const EMPTY_FORM = {
    title: '', subtitle: '', image_url: '', badge_text: '🎉 OFFER',
    button_text: 'View', target_screen: '', target_id: '',
    sort_order: 0, gradient_colors: ['#D4AF37', '#8B6508'],
};

export default function OffersPage() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [restaurants, setRestaurants] = useState([]);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await api.get('/banners');
            if (res.data.success) setBanners(res.data.data || []);
        } catch (e) {
            toast.error('Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    const fetchRestaurants = async () => {
        try {
            const res = await api.get('/admin/restaurants');
            if (res.data.success) setRestaurants(res.data.data?.restaurants || []);
        } catch (e) { }
    };

    useEffect(() => {
        fetchBanners();
        fetchRestaurants();
    }, []);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (banner) => {
        setForm({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            image_url: banner.image_url || '',
            badge_text: banner.badge_text || '🎉 OFFER',
            button_text: banner.button_text || 'View',
            target_screen: banner.target_screen || '',
            target_id: banner.target_id || '',
            sort_order: banner.sort_order || 0,
            gradient_colors: banner.gradient_colors || ['#D4AF37', '#8B6508'],
        });
        setEditingId(banner.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/banners/${editingId}`, form);
                toast.success('Offer updated!');
            } else {
                await api.post('/banners', form);
                toast.success('Offer created!');
            }
            setShowForm(false);
            fetchBanners();
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this offer?')) return;
        try {
            await api.delete(`/banners/${id}`);
            toast.success('Offer deleted');
            fetchBanners();
        } catch (e) {
            toast.error('Delete failed');
        }
    };

    const handleToggle = async (banner) => {
        try {
            await api.put(`/banners/${banner.id}`, { is_active: !banner.is_active });
            toast.success(banner.is_active ? 'Offer hidden' : 'Offer visible');
            fetchBanners();
        } catch (e) {
            toast.error('Failed to toggle');
        }
    };

    const updateField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Gift size={24} /> Offers & Banners
                </h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Create Offer
                </button>
            </div>

            {/* Banners List */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
                    Loading offers...
                </div>
            ) : banners.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Gift size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No offers created yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first offer to show on the user app&apos;s home screen</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.map((banner) => (
                        <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Preview */}
                            <div
                                className="p-5 text-white relative min-h-[120px] flex items-center"
                                style={{
                                    background: `linear-gradient(135deg, ${(banner.gradient_colors || ['#D4AF37', '#8B6508']).join(', ')})`
                                }}
                            >
                                <div className="flex-1">
                                    <span className="inline-block bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full mb-2">
                                        {banner.badge_text || '🎉 OFFER'}
                                    </span>
                                    <h3 className="text-lg font-extrabold">{banner.title}</h3>
                                    <p className="text-white/80 text-sm">{banner.subtitle}</p>
                                </div>
                                {banner.image_url && (
                                    <img src={banner.image_url} alt="" className="w-20 h-20 object-contain rounded-lg ml-3" />
                                )}
                                {!banner.is_active && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-bold">HIDDEN</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                                <div className="text-xs text-gray-400">
                                    Order: {banner.sort_order || 0}
                                    {banner.target_screen && ` · Links to: ${banner.target_screen}`}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggle(banner)}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        title={banner.is_active ? 'Hide' : 'Show'}
                                    >
                                        {banner.is_active ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-gray-400" />}
                                    </button>
                                    <button
                                        onClick={() => openEdit(banner)}
                                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingId ? 'Edit Offer' : 'Create New Offer'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Live Preview */}
                        <div className="mx-5 mt-4 rounded-xl overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${(form.gradient_colors || ['#D4AF37', '#8B6508']).join(', ')})`
                            }}
                        >
                            <div className="p-4 flex items-center min-h-[100px]">
                                <div className="flex-1">
                                    <span className="inline-block bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full mb-1">
                                        {form.badge_text || '🎉 OFFER'}
                                    </span>
                                    <h3 className="text-white font-extrabold text-lg">{form.title || 'Offer Title'}</h3>
                                    <p className="text-white/80 text-sm">{form.subtitle || 'Subtitle'}</p>
                                    <span className="inline-block mt-2 bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                                        {form.button_text || 'View'}
                                    </span>
                                </div>
                                {form.image_url && (
                                    <img src={form.image_url} alt="" className="w-16 h-16 object-contain rounded-lg ml-3" />
                                )}
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-1 mb-3">↑ Live Preview</p>

                        <div className="px-5 pb-5 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                                <input
                                    value={form.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    placeholder="e.g. 50% OFF on Biryani"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                                <input
                                    value={form.subtitle}
                                    onChange={(e) => updateField('subtitle', e.target.value)}
                                    placeholder="e.g. Indian | degloor"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                            </div>

                            {/* Badge Text */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Badge Text</label>
                                    <input
                                        value={form.badge_text}
                                        onChange={(e) => updateField('badge_text', e.target.value)}
                                        placeholder="🎉 OFFER"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                                    <input
                                        value={form.button_text}
                                        onChange={(e) => updateField('button_text', e.target.value)}
                                        placeholder="Order Now"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL (optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        value={form.image_url}
                                        onChange={(e) => updateField('image_url', e.target.value)}
                                        placeholder="https://example.com/image.png"
                                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    />
                                    {form.image_url && (
                                        <img src={form.image_url} alt="" className="w-10 h-10 object-cover rounded-lg border" />
                                    )}
                                </div>
                            </div>

                            {/* Gradient Color */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Background Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADIENT_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => updateField('gradient_colors', preset.colors)}
                                            className={`w-10 h-10 rounded-xl border-2 transition-all ${
                                                JSON.stringify(form.gradient_colors) === JSON.stringify(preset.colors)
                                                    ? 'border-gray-900 scale-110'
                                                    : 'border-transparent hover:border-gray-300'
                                            }`}
                                            style={{ background: `linear-gradient(135deg, ${preset.colors.join(', ')})` }}
                                            title={preset.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Link to Restaurant */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Link to Restaurant (optional)</label>
                                <select
                                    value={form.target_id}
                                    onChange={(e) => {
                                        updateField('target_id', e.target.value);
                                        updateField('target_screen', e.target.value ? 'restaurant' : '');
                                    }}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                >
                                    <option value="">No link</option>
                                    {restaurants.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Display Order</label>
                                <input
                                    type="number"
                                    value={form.sort_order}
                                    onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
                                    className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingId ? 'Update Offer' : 'Create Offer')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
