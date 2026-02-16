'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Power, ShoppingBag, DollarSign, Star } from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get My Restaurant ID
                const meRes = await api.get('/restaurants/me');
                if (meRes.data.success) {
                    const rest = meRes.data.data.restaurant;
                    setRestaurant(rest);

                    // 2. Get Dashboard Stats
                    const statsRes = await api.get(`/restaurants/${rest.id}/dashboard`);
                    if (statsRes.data.success) {
                        setStats(statsRes.data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleStatus = async () => {
        if (!restaurant) return;
        try {
            const res = await api.put(`/restaurants/${restaurant.id}/toggle`);
            if (res.data.success) {
                setRestaurant(prev => ({ ...prev, is_active: res.data.data.is_active }));
            }
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;
    if (!restaurant) return <div className="p-10 text-center text-red-500">No Restaurant Found. Please contact admin.</div>;

    return (
        <div className="p-4 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                    <p className={`text-sm font-medium flex items-center gap-1 ${restaurant.is_active ? 'text-green-600' : 'text-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${restaurant.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {restaurant.is_active ? 'Open for orders' : 'Currently Closed'}
                    </p>
                </div>
                <button
                    onClick={toggleStatus}
                    className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${restaurant.is_active ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-red-500 text-white shadow-lg shadow-red-200'
                        }`}
                >
                    <Power size={16} />
                    {restaurant.is_active ? 'OPEN' : 'CLOSED'}
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2 text-orange-600">
                        <ShoppingBag size={18} />
                        <span className="text-xs font-bold uppercase">Orders Today</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.today?.total_orders || 0}</p>
                    {/* <p className="text-xs text-green-600 font-medium mt-1">↑ 12% today</p> */}
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2 text-green-600">
                        <DollarSign size={18} />
                        <span className="text-xs font-bold uppercase">Revenue Today</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{stats?.today?.revenue || 0}</p>
                    {/* <p className="text-xs text-green-600 font-medium mt-1">↑ 8% today</p> */}
                </div>
            </div>

            {/* Live Orders Widget (Using socket later, for now just recent or pending from stats if available, or just link to orders) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Pending Orders</h3>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{stats?.today?.pending_orders || 0} Active</span>
                </div>
                <div className="p-4 text-center text-gray-500 text-sm">
                    Go to Orders tab to manage live orders.
                </div>
            </div>

            {/* Rating Card */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                    <p className="text-purple-900 font-bold">Restaurant Rating</p>
                    <p className="text-xs text-purple-700 mt-1">Based on reviews</p>
                </div>
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-gray-900">{restaurant.rating || 'New'}</span>
                </div>
            </div>
        </div>
    );
}
