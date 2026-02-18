import React, { useState, useEffect } from 'react';
import { X, Loader2, Tag } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PromoModal({ isOpen, onClose, onPromoSaved, initialData = null }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        min_order: 0,
        max_discount: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usage_limit: 100,
        first_order_only: false
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    valid_from: initialData.valid_from ? new Date(initialData.valid_from).toISOString().split('T')[0] : '',
                    valid_until: initialData.valid_until ? new Date(initialData.valid_until).toISOString().split('T')[0] : '',
                });
            } else {
                setFormData({
                    code: '',
                    type: 'percentage',
                    value: '',
                    min_order: 0,
                    max_discount: 0,
                    valid_from: new Date().toISOString().split('T')[0],
                    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    usage_limit: 100,
                    first_order_only: false
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const validUntilDate = new Date(formData.valid_until);
            validUntilDate.setHours(23, 59, 59, 999);

            const payload = {
                ...formData,
                value: parseFloat(formData.value) || 0,
                min_order: parseFloat(formData.min_order) || 0,
                max_discount: parseFloat(formData.max_discount) || 0,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : 0,
                valid_from: new Date(formData.valid_from).toISOString(),
                valid_until: validUntilDate.toISOString(),
            };

            const res = initialData
                ? await api.put(`/admin/promos/${initialData.id}`, payload)
                : await api.post('/admin/promos', payload);

            if (res.data.success) {
                toast.success(initialData ? 'Promo updated' : 'Promo created');
                onPromoSaved();
                onClose();
            }
        } catch (error) {
            console.error('Error saving promo:', error);
            toast.error(error.response?.data?.message || 'Failed to save promo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Tag size={20} className="text-primary" />
                        {initialData ? 'Edit Promotion' : 'Create Promotion'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Promo Code</label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all uppercase font-bold"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. WELCOME50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white font-medium"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="percentage">Percentage</option>
                                <option value="flat">Flat Amount</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Value {formData.type === 'percentage' ? '(%)' : '(₹)'}</label>
                            <input
                                required
                                type="number"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Min Order (₹)</label>
                            <input
                                required
                                type="number"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.min_order}
                                onChange={e => setFormData({ ...formData, min_order: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Max Discount (₹)</label>
                            <input
                                required
                                type="number"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.max_discount}
                                onChange={e => setFormData({ ...formData, max_discount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Valid From</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.valid_from}
                                onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Valid Until</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.valid_until}
                                onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Usage Limit</label>
                            <input
                                required
                                type="number"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.usage_limit}
                                onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    checked={formData.first_order_only}
                                    onChange={e => setFormData({ ...formData, first_order_only: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">First Order Only</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-orange-600 font-bold disabled:opacity-50 flex items-center gap-2 shadow-md shadow-orange-100 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (initialData ? 'Update Promo' : 'Create Promo')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
