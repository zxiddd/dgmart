'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Power, MapPin, DollarSign, Clock, Navigation, CheckCircle, Package } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ earnings: 0, count: 0, today: 0 });
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [history, setHistory] = useState([]);
    const [deliveryOtp, setDeliveryOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            // Fetch profile separately to handle 404 (not registered)
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

            const p = profileRes.data.data.partner;
            setIsOnline(p.is_online);
            setStats({
                earnings: p.total_earnings,
                count: p.total_deliveries,
                today: profileRes.data.data.today_earnings
            });

            const active = ordersRes.data.data.active[0];
            setActiveAssignment(active);
            setHistory(ordersRes.data.data.completed.slice(0, 5));
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Listen for socket updates
    useEffect(() => {
        if (!socket) return;

        socket.on('new_assignment', (data) => {
            fetchData();
            toast.success('New Order Assigned!');
        });

        socket.on('assignment_status_update', () => {
            fetchData();
        });

        return () => {
            socket.off('new_assignment');
            socket.off('assignment_status_update');
        };
    }, [socket, fetchData]);

    const toggleStatus = async () => {
        try {
            const res = await api.put('/delivery/toggle-online');
            setIsOnline(res.data.data.is_online);
            toast.success(`You are now ${res.data.data.is_online ? 'online' : 'offline'}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Toggle failed');
        }
    };

    const updateStatus = async (status) => {
        if (!activeAssignment) return;
        try {
            if (status === 'accepted') {
                await api.put(`/delivery/orders/${activeAssignment.id}/respond`, { action: 'accept' });
                toast.success('Order Accepted!');
            } else if (status === 'delivered') {
                if (!deliveryOtp || deliveryOtp.length < 4) {
                    setShowOtpInput(true);
                    toast.error('Please enter the 4-digit verification code from customer');
                    return;
                }
                await api.put(`/delivery/orders/${activeAssignment.id}/status`, { status, otp: deliveryOtp });
                toast.success('Order Delivered Successfully!');
                setDeliveryOtp('');
                setShowOtpInput(false);
            } else {
                await api.put(`/delivery/orders/${activeAssignment.id}/status`, { status });
                toast.success(`Order ${status.replace('_', ' ')}!`);
            }
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    return (
        <div className="p-4 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Hello, {user?.email?.split('@')[0] || 'Partner'}!</h1>
                    <p className="text-sm text-gray-500">{isOnline ? 'Searching for orders...' : 'Go online to start'}</p>
                </div>
                <button
                    onClick={toggleStatus}
                    className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-600'
                        }`}
                >
                    <Power size={16} />
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2 text-orange-600">
                        <DollarSign size={18} />
                        <span className="text-xs font-bold uppercase">Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.today}</p>
                    <p className="text-xs text-gray-500 mt-1">Today's Pay</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <CheckCircle size={18} />
                        <span className="text-xs font-bold uppercase">Deliveries</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                    <p className="text-xs text-gray-500 mt-1">Life-time</p>
                </div>
            </div>

            {/* Active Assignment Section */}
            <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Active Task</h3>
                {activeAssignment ? (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-primary/20 p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    {activeAssignment.status}
                                </span>
                                <h4 className="text-lg font-bold text-gray-900 mt-1">Order #{activeAssignment.order_details.order_number.slice(-6)}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 leading-none">Earnings</p>
                                <p className="text-lg font-bold text-green-600">₹{activeAssignment.order_details.delivery_fee}</p>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-gray-50 pt-3">
                            <div className="flex gap-3">
                                <MapPin size={18} className="text-orange-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Delivery To</p>
                                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{activeAssignment.order_details.delivery_address}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Package size={18} className="text-green-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Customer Name</p>
                                    <p className="text-sm font-medium text-gray-800">{activeAssignment.order_details.customer_name || 'Customer'}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Navigation size={18} className="text-blue-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Customer Contact</p>
                                    <p className="text-sm font-medium text-gray-800">{activeAssignment.order_details.customer_phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {activeAssignment.status === 'assigned' && (
                                <button onClick={() => updateStatus('accepted')} className="col-span-2 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200">
                                    Accept Order
                                </button>
                            )}
                            {activeAssignment.status === 'accepted' && (
                                <button onClick={() => updateStatus('picked_up')} className="col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200">
                                    Mark as Picked Up
                                </button>
                            )}
                            {activeAssignment.status === 'picked_up' && (
                                <div className="col-span-2 space-y-3">
                                    {showOtpInput ? (
                                        <div className="space-y-2 animate-in slide-in-from-bottom-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Enter Verification Code (OTP)</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    placeholder="4-digit code"
                                                    value={deliveryOtp}
                                                    onChange={(e) => setDeliveryOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                    className="flex-1 bg-gray-50 border-2 border-green-200 rounded-xl px-4 py-3 font-bold text-lg text-center tracking-[0.5em] focus:border-green-500 focus:outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => updateStatus('delivered')}
                                                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all hover:bg-green-700"
                                            >
                                                Verify & Complete
                                            </button>
                                            <button
                                                onClick={() => setShowOtpInput(false)}
                                                className="w-full text-xs font-bold text-gray-400 py-1"
                                            >
                                                Hide
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowOtpInput(true)}
                                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200"
                                        >
                                            Confirm Delivery (OTP)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[160px] flex flex-col items-center justify-center p-6 text-center">
                        {isOnline ? (
                            <>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 animate-pulse">
                                    <MapPin size={24} className="text-primary" />
                                </div>
                                <h3 className="text-md font-bold text-gray-900">Finding Orders...</h3>
                                <p className="text-xs text-gray-500 mt-1">Searching in your current zone</p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Power size={24} className="text-gray-400" />
                                </div>
                                <h3 className="text-md font-bold text-gray-900">You are Offline</h3>
                                <p className="text-xs text-gray-500 mt-1">Go online to see requests</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Recent History */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3">Today's History</h3>
                <div className="space-y-3">
                    {history.length > 0 ? history.map((h) => (
                        <div key={h.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                                    ₹{h.order_details.delivery_fee}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">Order #{h.order_details.order_number.slice(-4)}</p>
                                    <p className="text-xs text-gray-500">{new Date(h.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold bg-green-100 px-2 py-1 rounded text-green-700 uppercase">Paid</span>
                        </div>
                    )) : (
                        <div className="text-center py-6 border border-dashed rounded-xl border-gray-200">
                            <p className="text-sm text-gray-400 font-medium">No deliveries today yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
