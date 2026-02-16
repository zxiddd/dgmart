'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [restaurant, setRestaurant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        cuisine_type: '',
        avg_prep_time_mins: 30,
        image_url: ''
    });

    useEffect(() => {
        fetchRestaurant();
    }, []);

    const fetchRestaurant = async () => {
        try {
            const res = await api.get('/restaurants/me');
            if (res.data.success) {
                const data = res.data.data.restaurant;
                setRestaurant(data);
                setFormData({
                    name: data.name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    cuisine_type: Array.isArray(data.cuisine_type) ? data.cuisine_type.join(', ') : (data.cuisine_type || ''),
                    avg_prep_time_mins: data.avg_prep_time_mins || 30,
                    image_url: data.image_url || ''
                });
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                cuisine_type: formData.cuisine_type.split(',').map(c => c.trim()).filter(c => c),
                avg_prep_time_mins: parseInt(formData.avg_prep_time_mins)
            };
            const res = await api.put(`/restaurants/${restaurant.id}`, payload);
            if (res.data.success) {
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto pb-24">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Store Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <ImageUpload
                        value={formData.image_url}
                        onChange={(url) => setFormData({ ...formData, image_url: url })}
                        folder="restaurants"
                        label="Restaurant Banner"
                    />

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Restaurant Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cuisines (comma separated)</label>
                            <input
                                type="text"
                                value={formData.cuisine_type}
                                onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Avg Prep Time (mins)</label>
                                <input
                                    type="number"
                                    value={formData.avg_prep_time_mins}
                                    onChange={(e) => setFormData({ ...formData, avg_prep_time_mins: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                            <textarea
                                rows="2"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-orange-700 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Settings
                </button>
            </form>
        </div>
    );
}
