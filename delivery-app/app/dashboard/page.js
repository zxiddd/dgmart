'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Power, MapPin, DollarSign, CheckCircle, Package, Phone, KeyRound, Bell, BellOff } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { permission, requestPermission } = useNotifications();
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ earnings: 0, count: 0, today: 0 });
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [history, setHistory] = useState([]);
    const [deliveryOtp, setDeliveryOtp] = useState('');
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            let profileRes;
            try {
                profileRes = await api.get('/delivery/profile');
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    toast.error('Please complete your registration.');
                    router.push('/register');
                    return;
                }
                throw err;
            }

            const ordersRes = await api.get('/delivery/orders');
            const availableRes = await api.get('/delivery/available-orders');

            const p = profileRes.data.data.partner;
            setIsOnline(p.is_online);
            setStats({
                earnings: p.total_earnings,
                count: p.total_deliveries,
                today: profileRes.data.data.today_earnings
            });

            const active = ordersRes.data.data.active[0];
            setActiveAssignment(active || null);
            setAvailableOrders(availableRes.data.data.orders);
            setHistory(ordersRes.data.data.completed.slice(0, 5));
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (!socket) return;
        socket.on('new_available_order', (data) => {
            setAvailableOrders(prev => [data, ...prev]);
            toast.success('🛵 New Available Order Nearby!', { duration: 5000 });
        });
        socket.on('order_claimed', ({ order_id }) => {
            setAvailableOrders(prev => prev.filter(o => o.id !== order_id));
        });
        socket.on('assignment_status_update', () => { fetchData(); });
        return () => {
            socket.off('new_available_order');
            socket.off('order_claimed');
            socket.off('assignment_status_update');
        };
    }, [socket, fetchData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const toggleStatus = async () => {
        try {
            const res = await api.put('/delivery/toggle-online');
            setIsOnline(res.data.data.is_online);
            toast.success(`You are now ${res.data.data.is_online ? 'online 🟢' : 'offline 🔴'}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Toggle failed');
        }
    };

    const updateStatus = async (status) => {
        if (!activeAssignment) return;
        try {
            if (status === 'delivered') {
                if (!deliveryOtp || deliveryOtp.length < 4) {
                    toast.error('⚠️ Enter the 4-digit OTP from the customer first');
                    return;
                }
                await api.put(`/delivery/orders/${activeAssignment.id}/status`, { status, otp: deliveryOtp });
                toast.success('🎉 Order Delivered Successfully!');
                setDeliveryOtp('');
            } else {
                await api.put(`/delivery/orders/${activeAssignment.id}/status`, { status });
                toast.success(`Order marked as: ${status.replace('_', ' ')}!`);
            }
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Failed to update status';
            toast.error(msg);
            console.error('Update status error:', error.response?.data || error);
        }
    };

    const handleClaimOrder = async (orderId) => {
        try {
            setLoading(true);
            const res = await api.post(`/delivery/orders/${orderId}/claim`);
            if (res.data.success) {
                toast.success('🚀 Order claimed! Move to restaurant.');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim order');
            fetchData();
        } finally {
            setLoading(false);
        }
    };

    const callCustomer = (phone) => {
        if (!phone) { toast.error('No phone number available'); return; }
        window.location.href = `tel:+91${phone}`;
    };

    if (loading) return (
        <div className="p-4 space-y-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-6 w-32 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-48 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-orange-50/50 rounded-2xl border border-orange-100" />
                <div className="h-24 bg-blue-50/50 rounded-2xl border border-blue-100" />
            </div>
            <div className="space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded-lg" />
                <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100" />
            </div>
        </div>
    );

    const od = activeAssignment?.order_details;

    return (
        <div className="p-4 space-y-5 pb-10">
            <header className="flex justify-between items-center bg-gray-900 -mx-4 -mt-4 p-5 rounded-b-[2rem] shadow-xl text-white">
                <div>
                    <h1 className="text-xl font-bold text-white">Hello, {user?.email?.split('@')[0] || 'Partner'}!</h1>
                    <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5">
                        {isOnline ? '🟢 Online & Ready' : '🔴 Currently Offline'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={requestPermission}
                        className={`p-2.5 rounded-full transition-all ${permission === 'granted' ? 'bg-white/10 text-green-400' : 'bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-500/20'}`}
                    >
                        {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                    <button
                        onClick={toggleStatus}
                        className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white/10 text-white/60 border border-white/10'}`}
                    >
                        <Power size={14} />
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>
                </div>
            </header>

            {/* Notification Permission Prompt */}
            {permission !== 'granted' && isOnline && (
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-2xl shadow-xl mb-2 flex items-center justify-between border border-orange-400/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Bell className="animate-bounce" size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Enable Alerts</p>
                            <p className="text-[10px] opacity-90">Get notified instantly when new orders arrive!</p>
                        </div>
                    </div>
                    <button
                        onClick={requestPermission}
                        className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all"
                    >
                        ENABLE NOW
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-1 text-orange-600">
                        <DollarSign size={18} />
                        <span className="text-xs font-bold uppercase">Today&apos;s Earnings</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">₹{stats.today}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1 text-blue-600">
                        <CheckCircle size={18} />
                        <span className="text-xs font-bold uppercase">Total Deliveries</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.count}</p>
                </div>
            </div>

            {/* Active Assignment */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3">Active Task</h3>
                {activeAssignment && od ? (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-5 space-y-4">
                        {/* Order Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${activeAssignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-700' :
                                    activeAssignment.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                        'bg-purple-100 text-purple-700'
                                    }`}>
                                    {activeAssignment.status === 'picked_up' ? '🚴 Riding to Customer' :
                                        activeAssignment.status === 'accepted' ? '📦 Head to Restaurant' : '🔔 New Order!'}
                                </span>
                                <h4 className="text-xl font-bold text-gray-900 mt-1">Order #{od.order_number?.slice(-6)}</h4>
                            </div>
                            <div className="text-right bg-green-50 px-3 py-2 rounded-xl">
                                <p className="text-[10px] text-gray-500 font-bold">YOUR PAY</p>
                                <p className="text-2xl font-bold text-green-600">₹{od.delivery_fee}</p>
                            </div>
                        </div>

                        {/* Order Total to Collect */}
                        <div className="bg-blue-600 rounded-xl p-4 flex justify-between items-center shadow-lg shadow-blue-500/20">
                            <div>
                                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Collect from Customer</p>
                                <p className="text-xs text-blue-100/80">Check payment status (COD/Online)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white">₹{od.total}</p>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="flex gap-3 bg-orange-50 rounded-xl p-3">
                            <MapPin size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Deliver To</p>
                                <p className="text-sm font-semibold text-gray-800">{od.delivery_address}</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 flex items-center gap-2">
                                <Package size={14} className="text-gray-500" />
                                <p className="text-[11px] uppercase font-bold text-gray-500">Customer Details</p>
                            </div>
                            <div className="p-3 space-y-3">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Name</p>
                                    <p className="text-base font-bold text-gray-900">{od.customer_name || 'Customer'}</p>
                                </div>

                                {/* Phone - Big Tappable Call Button */}
                                <button
                                    onClick={() => callCustomer(od.customer_phone)}
                                    className="w-full flex items-center justify-between bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl px-4 py-3.5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <Phone size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold opacity-80 uppercase">Tap to Call Customer</p>
                                            <p className="text-xl font-bold tracking-wide">
                                                {od.customer_phone ? `+91 ${od.customer_phone}` : 'No number on file'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-lg font-bold">CALL</span>
                                </button>
                            </div>
                        </div>

                        {/* OTP Section — Always visible when picked_up */}
                        {activeAssignment.status === 'picked_up' && (
                            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <KeyRound size={20} className="text-amber-600" />
                                    <div>
                                        <p className="font-bold text-amber-900 text-base">Enter Delivery OTP</p>
                                        <p className="text-xs text-amber-700">Ask the customer for their 4-digit code</p>
                                    </div>
                                </div>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="0 0 0 0"
                                    value={deliveryOtp}
                                    onChange={(e) => setDeliveryOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full bg-white border-2 border-amber-300 rounded-xl px-4 py-4 font-bold text-4xl text-center tracking-[1em] focus:border-amber-500 focus:outline-none"
                                />
                                <button
                                    onClick={() => updateStatus('delivered')}
                                    disabled={deliveryOtp.length < 4}
                                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    ✅ Verify OTP &amp; Complete Delivery
                                </button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div>
                            {activeAssignment.status === 'accepted' || activeAssignment.status === 'assigned' && (
                                <button onClick={() => updateStatus('picked_up')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
                                    📦 Mark as Picked Up from Restaurant
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isOnline ? (
                            availableOrders.length > 0 ? (
                                <div className="grid gap-4">
                                    {availableOrders.map((order) => (
                                        <div key={order.id} className="bg-white rounded-2xl shadow-md border border-orange-100 p-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Order #{order.order_number?.slice(-6)}</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Available Now</p>
                                                </div>
                                                <div className="bg-green-50 px-3 py-1 rounded-lg">
                                                    <p className="text-xl font-bold text-green-600">₹{order.delivery_fee}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-gray-400">Pickup</p>
                                                        <p className="text-xs font-semibold text-gray-700 leading-tight">{order.restaurant_name}</p>
                                                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{order.restaurant_address}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-gray-400">Deliver To</p>
                                                        <p className="text-xs font-semibold text-gray-700 leading-tight truncate max-w-[200px]">{order.delivery_address}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleClaimOrder(order.id)}
                                                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all"
                                            >
                                                🛵 Claim Order
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[180px] flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-3 animate-pulse">
                                        <MapPin size={28} className="text-orange-500" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Waiting for New Orders...</h3>
                                    <p className="text-xs text-gray-500 mt-1">Orders in your area will appear here</p>
                                </div>
                            )
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[180px] flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Power size={28} className="text-gray-400" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">You are Offline</h3>
                                <p className="text-xs text-gray-500 mt-1">Go online to see available orders</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recent History */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3">Recent Deliveries</h3>
                <div className="space-y-2">
                    {history.length > 0 ? history.map((h) => (
                        <div key={h.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                                    ₹{h.order_details?.delivery_fee}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">Order #{h.order_details?.order_number?.slice(-4)}</p>
                                    <p className="text-xs text-gray-500">{h.delivered_at ? new Date(h.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold bg-green-100 px-2 py-1 rounded text-green-700 uppercase">₹{h.order_details?.delivery_fee} Paid</span>
                        </div>
                    )) : (
                        <div className="text-center py-8 border border-dashed rounded-xl border-gray-200">
                            <p className="text-sm text-gray-400 font-medium">No deliveries yet today</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
