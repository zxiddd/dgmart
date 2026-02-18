'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, User, Phone, MapPin } from 'lucide-react';
import api from '@/lib/api';

export default function SetupRestaurantPage() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/restaurants', {
                name,
                phone,
                address,
                lat: 18.5492, // Degloor
                lng: 77.5750,
                cuisine_type: ['Indian'], // Default
                avg_prep_time_mins: 20,
                min_order_amount: 0,
                delivery_radius_km: 5
            });

            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Failed to create restaurant';
            const details = err.response?.data?.errors
                ? err.response.data.errors.map(e => `${e.field}: ${e.message}`).join(', ')
                : '';
            setError(details ? `${message}: ${details}` : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Utensils size={32} className="text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Setup Restaurant</h1>
                    <p className="text-gray-500 mt-2">Complete your profile to start receiving orders</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Restaurant Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                placeholder="My Tasty Restaurant"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                placeholder="9876543210"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                placeholder="Main Road, Degloor"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all disabled:opacity-70 mt-4"
                    >
                        {loading ? 'Creating...' : 'Create Restaurant'}
                    </button>
                </form>
            </div>
        </div>
    );
}
