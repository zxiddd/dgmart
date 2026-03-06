'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Power, ShoppingBag, DollarSign, Star, Clock, CheckCircle, Shield, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { playAlarmSound, playPingSound } from '@/lib/pushNotifications';

export default function DashboardPage() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const stopAlarmRef = useRef(null); // holds the stopAlarm() function

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

                    // 3. Get Active Orders
                    const ordersRes = await api.get('/orders/restaurant/me');
                    if (ordersRes.data.success) {
                        const allOrders = ordersRes.data.data.orders || [];
                        const active = allOrders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status));
                        setActiveOrders(active);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
                if (error.response && error.response.status === 404) {
                    router.push('/setup');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router]);

    // Live bump: new order received & status updates
    useEffect(() => {
        if (!socket) return;
        
        const onNewOrder = (newOrder) => {
            toast('🔔 New Order Received!', { icon: '🛎️', duration: 8000, style: { background: '#FF6B35', color: '#fff', fontWeight: 'bold', fontSize: '16px' } });
            setActiveOrders(prev => [newOrder, ...prev]);
            setStats(prev => prev ? {
                ...prev,
                today: {
                    ...prev.today,
                    total_orders: (prev.today?.total_orders || 0) + 1,
                    pending_orders: (prev.today?.pending_orders || 0) + 1,
                },
            } : prev);
            // Play persistent alarm until order is accepted/rejected
            if (stopAlarmRef.current) stopAlarmRef.current(); // stop any previous alarm
            stopAlarmRef.current = playAlarmSound();
        };

        const onOrderStatusUpdated = (updatedOrder) => {
            setActiveOrders(prev => {
                // If it's no longer active, remove from this list
                if (!['placed', 'confirmed', 'preparing'].includes(updatedOrder.status)) {
                    return prev.filter(o => o.id !== updatedOrder.id);
                }
                // Otherwise update it
                const exists = prev.find(o => o.id === updatedOrder.id);
                if (exists) {
                    return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                } else {
                    return [updatedOrder, ...prev];
                }
            });
        };

        socket.on('new_order', onNewOrder);
        socket.on('order_status_updated', onOrderStatusUpdated);
        
        return () => {
            socket.off('new_order', onNewOrder);
            socket.off('order_status_updated', onOrderStatusUpdated);
        };
    }, [socket]);

    const toggleStatus = async () => {
        if (!restaurant) return;
        try {
            const res = await api.put(`/restaurants/${restaurant.id}/toggle`);
            if (res.data.success) {
                setRestaurant(prev => ({ ...prev, is_active: res.data.data.is_active }));
                toast.success(res.data.data.is_active ? 'Restaurant Open 🟢' : 'Restaurant Closed 🔴');
            }
        } catch (error) {
            console.error('Failed to toggle status', error);
            toast.error('Failed to switch status');
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            // Stop the alarm immediately when restaurant takes action
            if (stopAlarmRef.current) {
                stopAlarmRef.current();
                stopAlarmRef.current = null;
            }
            const res = await api.put(`/orders/${orderId}/status`, { status });
            if (res.data.success) {
                const effectiveStatus = status === 'ready' ? 'searching_rider' : status;
                
                // Optimistically remove from active list if ready or cancelled
                if (!['placed', 'confirmed', 'preparing'].includes(effectiveStatus)) {
                     setActiveOrders(prev => prev.filter(o => o.id !== orderId));
                     if (effectiveStatus === 'searching_rider') {
                         toast.success(`Order ready! Searching for rider.`);
                     }
                } else {
                     setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: effectiveStatus } : o));
                     toast.success(`Order marked as ${status}`);
                }
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update status');
        }
    };

    if (loading) return (
        <div className="p-10 text-center flex flex-col items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
    );
    
    if (!restaurant) return (
        <div className="p-10 text-center space-y-4">
            <p className="text-red-500">No Restaurant Found.</p>
            <button
                onClick={() => router.push('/setup')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
                Create Restaurant Profile
            </button>
        </div>
    );

    const isAdmin = user && ['admin', 'super_admin'].includes(user.role);

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Admin Portal Quick Access */}
            {isAdmin && (
                <div 
                    onClick={() => router.push('/admin')}
                    className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between cursor-pointer border border-indigo-400 group hover:bg-indigo-700 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                            <Shield className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Global Admin Portal</h3>
                            <p className="text-indigo-100 text-[10px] font-medium uppercase tracking-wider">Manage platform features</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/20 group-hover:bg-white/20">
                        OPEN <ChevronRight size={14} />
                    </div>
                </div>
            )}
            {/* Header section styling matching Delivery App */}
            <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="relative flex h-2.5 w-2.5">
                            {restaurant.is_active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${restaurant.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                        <p className={`text-sm font-bold ${restaurant.is_active ? 'text-green-600' : 'text-red-500'}`}>
                            {restaurant.is_active ? 'Accepting Orders' : 'Currently Offline'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={toggleStatus}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                        restaurant.is_active 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600'
                    }`}
                >
                    <Power size={18} />
                    {restaurant.is_active ? 'GO OFFLINE' : 'GO ONLINE'}
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <ShoppingBag size={80} />
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-orange-600">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Orders Today</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{stats?.today?.total_orders || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <DollarSign size={80} />
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-green-600">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Revenue Today</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">₹{stats?.today?.revenue || 0}</p>
                </div>
            </div>

            {/* Live Active Orders Widget */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        🔥 Live Orders
                        {activeOrders.length > 0 && (
                            <span className="bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                {activeOrders.length} New
                            </span>
                        )}
                    </h2>
                    <button 
                        onClick={() => router.push('/dashboard/orders')}
                        className="text-sm font-bold text-primary hover:text-primary-dark"
                    >
                        View All
                    </button>
                </div>

                {activeOrders.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center shadow-sm">
                        <div className="flex justify-center mb-3 opacity-20">
                            <ShoppingBag size={48} />
                        </div>
                        <p className="text-gray-500 font-medium">No active orders right now.</p>
                        <p className="text-xs text-gray-400 mt-1">New orders will magically appear here!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeOrders.map((order) => (
                            <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                                {order.status === 'placed' && (
                                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl animate-pulse tracking-wide uppercase">
                                        Action Required
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-900">#{order.id.slice(0, 8)}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
                                            <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right mt-1">
                                        <p className="font-black text-lg text-primary">₹{order.total}</p>
                                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide
                                            ${order.status === 'placed' ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : ''}
                                            ${order.status === 'preparing' ? 'bg-orange-100 text-orange-700' : ''}
                                        `}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50/80 p-3.5 rounded-xl mb-5 space-y-1.5 border border-gray-100">
                                    {order.items && order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <p className="text-sm text-gray-800 font-medium flex-1">• {item.name || item.item_name}</p>
                                            <span className="text-sm font-bold text-gray-600 bg-gray-200 px-2 rounded ml-2">x{item.quantity}</span>
                                        </div>
                                    ))}
                                    {order.special_instructions && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded italic">
                                                " {order.special_instructions} "
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    {order.status === 'placed' ? (
                                        <>
                                            <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">Reject Order</button>
                                            <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="bg-green-500 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-green-200 hover:bg-green-600 transition-all active:scale-95">Accept Order</button>
                                        </>
                                    ) : order.status === 'confirmed' ? (
                                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="col-span-2 bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95">
                                            Start Cooking
                                        </button>
                                    ) : order.status === 'preparing' ? (
                                        <button onClick={() => updateOrderStatus(order.id, 'ready')} className="col-span-2 bg-primary text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-200 hover:bg-[#E65100] transition-all active:scale-95">
                                            <CheckCircle size={18} /> Mark Ready for Pickup
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rating Card */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-purple-900 font-bold text-lg">Restaurant Rating</h3>
                    <p className="text-xs text-purple-700 mt-0.5 font-medium">Keep it up to get more orders!</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl shadow-sm border border-purple-100">
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-extrabold text-gray-900 text-lg">{restaurant.rating || 'New'}</span>
                </div>
            </div>
        </div>
    );
}
