'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useNotifications } from '@/context/NotificationContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAudioAlert } from '@/hooks/useAudioAlert';
import { Power, DollarSign, CheckCircle, Package, Phone, KeyRound, Bell, BellOff, Bike, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// ────────────────────────────────────────────────────────────
//  Active Assignment Card
// ────────────────────────────────────────────────────────────
function ActiveOrderCard({ assignment, onUpdateStatus }) {
    const [deliveryOtp, setDeliveryOtp] = useState('');
    const [expanded, setExpanded] = useState(true);
    const od = assignment?.order_details;
    if (!od) return null;

    const statusLabel = {
        assigned: { text: '🔔 New Assignment', color: 'bg-yellow-100 text-yellow-800' },
        accepted: { text: '🍽️ Go to Restaurant', color: 'bg-blue-100 text-blue-800' },
        picked_up: { text: '🚴 On the Way', color: 'bg-green-100 text-green-800' },
    }[assignment.status] || { text: assignment.status, color: 'bg-gray-100 text-gray-700' };

    return (
        <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-lg overflow-hidden">
            {/* Card Header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between bg-orange-50 px-4 py-3"
            >
                <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusLabel.color}`}>
                        {statusLabel.text}
                    </span>
                    <span className="font-bold text-gray-800 text-sm">#{String(od.order_number || '').slice(-6)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-green-600 font-extrabold text-sm">₹{od.delivery_fee}</span>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </button>

            {expanded && (
                <div className="p-4 space-y-3">
                    {/* COD Banner */}
                    <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Collect from Customer</p>
                            <p className="text-[10px] opacity-60">Ask for cash on delivery</p>
                        </div>
                        <p className="text-2xl font-black">₹{od.total}</p>
                    </div>

                    {/* Route */}
                    <div className="space-y-2">
                        <div className="flex gap-3 items-start">
                            <div className="flex flex-col items-center pt-1">
                                <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-300" />
                                <div className="w-0.5 h-5 bg-gray-200 my-0.5" />
                                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-300" />
                            </div>
                            <div className="space-y-3 flex-1">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup</p>
                                    <p className="text-sm font-semibold text-gray-800 leading-tight">{od.restaurant_name || 'Restaurant'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Deliver to</p>
                                    <p className="text-sm font-semibold text-gray-800 leading-tight">{od.delivery_address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Call Button */}
                    <a
                        href={`tel:+91${od.customer_phone}`}
                        className="flex items-center justify-between bg-green-500 text-white rounded-xl px-4 py-3 active:bg-green-600 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold opacity-70 uppercase">Call Customer</p>
                                <p className="text-base font-bold">{od.customer_phone ? `+91 ${od.customer_phone}` : 'No number'}</p>
                            </div>
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-lg font-bold">CALL</span>
                    </a>

                    {/* Action Buttons */}
                    {(assignment.status === 'assigned' || assignment.status === 'accepted') && (
                        <button
                            onClick={() => onUpdateStatus(assignment.id, 'picked_up')}
                            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-sm shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all"
                        >
                            📦 Picked Up from Restaurant
                        </button>
                    )}

                    {assignment.status === 'picked_up' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="0 0 0 0"
                                    value={deliveryOtp}
                                    onChange={(e) => setDeliveryOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none w-full font-mono text-center text-xl tracking-widest text-gray-800 placeholder-gray-400"
                                />
                                <button
                                    onClick={() => onUpdateStatus(assignment.id, 'delivered', { otp: deliveryOtp })}
                                    disabled={deliveryOtp.length !== 4}
                                    className="bg-green-600 text-white px-6 w-1/3 rounded-xl font-bold text-sm shadow-md hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────
//  Available Order Card
// ────────────────────────────────────────────────────────────
function AvailableOrderCard({ order, onClaim, claiming }) {
    if (!order) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        New Order
                    </span>
                    <h3 className="font-bold text-gray-800 mt-2">#{String(order.order_number || '').slice(-6) || 'N/A'}</h3>
                    <p className="text-xs text-gray-500">{order.distance ? `${order.distance} km away` : 'Nearby'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Est. Earning</p>
                    <p className="text-xl font-extrabold text-green-600">₹{order.delivery_fee}</p>
                </div>
            </div>

            {/* Route */}
            <div className="space-y-2">
                <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup</p>
                        <p className="text-xs font-semibold text-gray-700">{order.restaurant_name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[220px]">{order.restaurant_address}</p>
                    </div>
                </div>
                <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Deliver to</p>
                        <p className="text-xs font-semibold text-gray-700 truncate max-w-[220px]">{order.delivery_address}</p>
                    </div>
                </div>
            </div>

            <button
                onClick={() => onClaim(order.id)}
                disabled={claiming}
                className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 transition-all"
            >
                {claiming ? '⏳ Claiming...' : '🛵 Accept Order'}
            </button>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
//  Main Dashboard
// ────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { permission, requestPermission } = useNotifications();
    const { playAlert } = useAudioAlert();

    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ earnings: 0, count: 0, today: 0 });
    const [activeAssignments, setActiveAssignments] = useState([]);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [history, setHistory] = useState([]);
    const [claimingId, setClaimingId] = useState(null);
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            let profileRes;
            try {
                profileRes = await api.get('/delivery/profile');
            } catch (err) {
                if (err.response?.status === 404) {
                    toast.error('Please complete your registration.');
                    router.push('/register');
                    return;
                }
                throw err;
            }

            const [ordersRes, availableRes] = await Promise.all([
                api.get('/delivery/orders'),
                api.get('/delivery/available-orders'),
            ]);

            const p = profileRes.data.data.partner;
            setIsOnline(p.is_online);
            setStats({
                earnings: p.total_earnings,
                count: p.total_deliveries,
                today: profileRes.data.data.today_earnings,
            });

            setActiveAssignments(ordersRes.data.data.active || []);
            setAvailableOrders(availableRes.data.data.orders || []);
            setHistory((ordersRes.data.data.completed || []).slice(0, 5));
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Socket events
    useEffect(() => {
        if (!socket) return;
        socket.on('new_available_order', (data) => {
            setAvailableOrders(prev => {
                if (prev.find(o => o.id === data.order_id)) return prev;
                return [data, ...prev];
            });
            // playAlert(); // Temporarily disabled to test for mobile autoplay crashes
            toast.success('🛵 New Order Nearby!', { duration: 5000 });
        });
        socket.on('order_claimed', ({ order_id }) => {
            setAvailableOrders(prev => prev.filter(o => o.id !== order_id));
        });
        socket.on('assignment_status_update', () => fetchData());
        return () => {
            socket.off('new_available_order');
            socket.off('order_claimed');
            socket.off('assignment_status_update');
        };
    }, [socket, fetchData]);

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const toggleStatus = async () => {
        try {
            const res = await api.put('/delivery/toggle-online');
            setIsOnline(res.data.data.is_online);
            toast.success(`You are now ${res.data.data.is_online ? 'online 🟢' : 'offline 🔴'}`);
        } catch {
            toast.error('Toggle failed');
        }
    };

    const updateStatus = async (assignmentId, status, otp) => {
        try {
            const body = status === 'delivered' ? { status, otp } : { status };
            await api.put(`/delivery/orders/${assignmentId}/status`, body);
            if (status === 'delivered') {
                toast.success('🎉 Delivered! Great job!');
            } else {
                toast.success(`Marked as ${status.replace('_', ' ')}!`);
            }
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to update status';
            toast.error(msg);
        }
    };

    const handleClaimOrder = async (orderId) => {
        try {
            setClaimingId(orderId);
            const res = await api.post(`/delivery/orders/${orderId}/claim`);
            if (res.data.success) {
                toast.success('🚀 Order accepted! Head to restaurant.');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim order');
            fetchData();
        } finally {
            setClaimingId(null);
        }
    };

    // ── Loading skeleton
    if (loading) return (
        <div className="p-4 space-y-4 animate-pulse">
            <div className="h-24 bg-gray-900/10 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-orange-50 rounded-2xl" />
                <div className="h-20 bg-blue-50 rounded-2xl" />
            </div>
            <div className="h-40 bg-gray-50 rounded-2xl border border-gray-100" />
        </div>
    );

    return (
        <div className="p-4 space-y-5 pb-24">
            {/* ── Header */}
            <header className="flex justify-between items-center bg-gray-900 -mx-4 -mt-4 px-5 py-5 rounded-b-[2rem] shadow-xl text-white">
                <div>
                    <h1 className="text-xl font-bold">Hey, {user?.email?.split('@')[0] || 'Partner'}! 👋</h1>
                    <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5">
                        {isOnline ? (
                            <span className="text-green-400">● Online &amp; Ready</span>
                        ) : (
                            <span className="text-red-400">● Offline</span>
                        )}
                        {activeAssignments.length > 0 && (
                            <span className="ml-2 text-orange-300">· {activeAssignments.length} active</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={requestPermission}
                        className={`p-2.5 rounded-full transition-all ${permission === 'granted' ? 'bg-white/10 text-green-400' : 'bg-orange-500 text-white animate-pulse'}`}
                    >
                        {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                    <button
                        onClick={toggleStatus}
                        className={`px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white/10 text-white/60 border border-white/10'}`}
                    >
                        <Power size={14} />
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>
                </div>
            </header>

            {/* Notification permission prompt */}
            {permission !== 'granted' && isOnline && (
                <div className="bg-orange-500 text-white p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Bell className="animate-bounce" size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Enable Alerts</p>
                            <p className="text-[10px] opacity-80">Get notified instantly about new orders!</p>
                        </div>
                    </div>
                    <button
                        onClick={requestPermission}
                        className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                        ENABLE
                    </button>
                </div>
            )}

            {/* ── Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-1.5 mb-1 text-orange-600">
                        <DollarSign size={16} />
                        <span className="text-[10px] font-bold uppercase">Today</span>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">₹{stats.today}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-1 text-blue-600">
                        <CheckCircle size={16} />
                        <span className="text-[10px] font-bold uppercase">Total</span>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.count} <span className="text-sm font-medium text-gray-400">trips</span></p>
                </div>
            </div>

            {/* ── Active Assignments — always visible */}
            {activeAssignments.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Bike size={18} className="text-orange-500" />
                            Active Orders
                        </h3>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {activeAssignments.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {activeAssignments.map(a => (
                            <ActiveOrderCard
                                key={a.id}
                                assignment={a}
                                onUpdateStatus={updateStatus}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Available Orders — always visible when online */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Package size={18} className="text-green-500" />
                        Available Orders
                    </h3>
                    {availableOrders.length > 0 && (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                            {availableOrders.length} new
                        </span>
                    )}
                </div>

                {!isOnline ? (
                    <div className="bg-white rounded-2xl border border-gray-100 min-h-[140px] flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Power size={24} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-700">You are Offline</p>
                        <p className="text-xs text-gray-400 mt-1">Go online to see &amp; accept orders</p>
                    </div>
                ) : availableOrders.length > 0 ? (
                    <div className="space-y-3">
                        {availableOrders.map(order => (
                            <AvailableOrderCard
                                key={order.id}
                                order={order}
                                onClaim={handleClaimOrder}
                                claiming={claimingId === order.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 min-h-[140px] flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 animate-pulse">
                            <Clock size={24} className="text-orange-400" />
                        </div>
                        <p className="font-bold text-gray-700">Waiting for Orders...</p>
                        <p className="text-xs text-gray-400 mt-1">New orders will appear here instantly</p>
                    </div>
                )}
            </section>

            {/* ── Recent Deliveries */}
            {history.length > 0 && (
                <section>
                    <h3 className="font-bold text-gray-900 mb-3">Recent Deliveries</h3>
                    <div className="space-y-2">
                        {history.map(h => (
                            <div key={h.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                                        ✓
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">#{h.order_details?.order_number?.slice(-6)}</p>
                                        <p className="text-xs text-gray-400">
                                            {h.delivered_at ? new Date(h.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-green-600">+₹{h.order_details?.delivery_fee}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
