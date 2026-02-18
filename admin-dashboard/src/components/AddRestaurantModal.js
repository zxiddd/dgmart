import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import ImageUpload from './ImageUpload';

export default function AddRestaurantModal({ isOpen, onClose, onRestaurantAdded, initialData = null }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        lat: 18.5492,
        lng: 77.5768,
        cuisine_type: '',
        rating: 4.5,
        delivery_fee: 20,
        avg_delivery_time_mins: 30,
        image_url: '',
        banner_url: '',
        is_active: true
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    cuisine_type: Array.isArray(initialData.cuisine_type) ? initialData.cuisine_type.join(', ') : (initialData.cuisine_type || ''),
                    avg_delivery_time_mins: initialData.avg_prep_time_mins || 30,
                    banner_url: initialData.banner_url || ''
                });
            } else {
                setFormData({
                    name: '',
                    address: '',
                    phone: '',
                    lat: 18.5492,
                    lng: 77.5768,
                    cuisine_type: '',
                    rating: 4.5,
                    delivery_fee: 20,
                    avg_delivery_time_mins: 30,
                    image_url: '',
                    banner_url: '',
                    is_active: true
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                lat: parseFloat(formData.lat),
                lng: parseFloat(formData.lng),
                cuisine_type: formData.cuisine_type.split(',').map(c => c.trim()).filter(c => c),
                image_url: formData.image_url,
                banner_url: formData.banner_url,
                avg_prep_time_mins: parseInt(formData.avg_delivery_time_mins),
                min_order_amount: 0,
                delivery_radius_km: 10
            };

            const res = initialData
                ? await api.put(`/restaurants/${initialData.id}`, payload)
                : await api.post('/restaurants', payload);

            if (res.data.success) {
                onRestaurantAdded();
                onClose();
            }
        } catch (error) {
            console.error('Error adding restaurant:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add restaurant';
            const validationErrors = error.response?.data?.errors?.map(e => e.message).join('\n');
            alert(validationErrors ? `${errorMessage}:\n${validationErrors}` : errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-800">Add New Restaurant</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Biryani House"
                            />
                        </div>

                        {/* Cuisine */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisines (comma separated)</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.cuisine_type}
                                onChange={e => setFormData({ ...formData, cuisine_type: e.target.value })}
                                placeholder="e.g. Biryani, North Indian, Chinese"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91..."
                            />
                        </div>

                        {/* Avg Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avg Time (mins)</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.avg_delivery_time_mins}
                                onChange={e => setFormData({ ...formData, avg_delivery_time_mins: e.target.value })}
                            />
                        </div>

                        {/* Address */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                required
                                rows={2}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Full address..."
                            />
                        </div>

                        {/* Lat/Lng */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input
                                required
                                type="number"
                                step="any"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.lat}
                                onChange={e => setFormData({ ...formData, lat: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input
                                required
                                type="number"
                                step="any"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={formData.lng}
                                onChange={e => setFormData({ ...formData, lng: e.target.value })}
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ImageUpload
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                folder="restaurants"
                                label="Restaurant Logo/Icon"
                            />
                            <ImageUpload
                                value={formData.banner_url}
                                onChange={(url) => setFormData({ ...formData, banner_url: url })}
                                folder="restaurant-banners"
                                label="Restaurant Banner (Home Screen)"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-orange-600 font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Restaurant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
