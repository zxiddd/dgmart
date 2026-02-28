'use client';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Smartphone, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // active, ready, past
    const { socket } = useSocket();

    useEffect(() => {
        fetchOrders();

        if (socket) {
            socket.on('new_order', (newOrder) => {
                toast.success('New Order Received! 🔔');
                setOrders(prev => [newOrder, ...prev]);
                // Play sound?
            });

            socket.on('order_status_updated', (updatedOrder) => {
                setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            });
        }

        return () => {
            if (socket) {
                socket.off('new_order');
                socket.off('order_status_updated');
            }
        };
    }, [socket]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders/restaurant/me');
            if (res.data.success) {
                setOrders(res.data.data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            const res = await api.put(`/orders/${orderId}/status`, { status });
            if (res.data.success) {
                // When restaurant marks 'ready', backend sets status to 'searching_rider'
                const effectiveStatus = status === 'ready' ? 'searching_rider' : status;
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: effectiveStatus } : o));
                toast.success(`Order marked as ${status} - Searching for rider!`);
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update status');
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filter === 'active') return ['placed', 'confirmed', 'preparing'].includes(o.status);
        // 'searching_rider' and 'assigned_rider' are the real statuses after restaurant marks 'ready'
        if (filter === 'ready') return ['ready', 'searching_rider', 'assigned_rider', 'out_for_delivery', 'picked_up'].includes(o.status);
        if (filter === 'past') return ['delivered', 'cancelled', 'rejected'].includes(o.status);
        return true;
    });

    if (loading) return <div className="p-10 text-center">Loading Orders...</div>;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

            <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-md whitespace-nowrap transition-colors ${filter === 'active' ? 'bg-primary text-white shadow-orange-200' : 'bg-white text-gray-600 border border-gray-200'}`}
                >
                    Active ({orders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status)).length})
                </button>
                <button
                    onClick={() => setFilter('ready')}
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-md whitespace-nowrap transition-colors ${filter === 'ready' ? 'bg-primary text-white shadow-orange-200' : 'bg-white text-gray-600 border border-gray-200'}`}
                >
                    Ready/Dispatch ({orders.filter(o => ['ready', 'searching_rider', 'assigned_rider', 'out_for_delivery', 'picked_up'].includes(o.status)).length})
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-md whitespace-nowrap transition-colors ${filter === 'past' ? 'bg-primary text-white shadow-orange-200' : 'bg-white text-gray-600 border border-gray-200'}`}
                >
                    Past Orders
                </button>
            </div>

            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
                        No orders in this category.
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                            {order.status === 'placed' && (
                                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg animate-pulse">
                                    NEW
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">#{order.id.slice(0, 8)}...</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">₹{order.total}</p>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 uppercase text-gray-600">{order.status}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-1">
                                {order.items && order.items.map((item, idx) => (
                                    <p key={idx} className="text-sm text-gray-700 font-medium">• {item.name || item.item_name} x{item.quantity}</p>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {order.status === 'placed' ? (
                                    <>
                                        <button onClick={() => updateStatus(order.id, 'cancelled')} className="bg-red-50 text-red-600 py-2.5 rounded-lg font-bold text-sm hover:bg-red-100">Reject</button>
                                        <button onClick={() => updateStatus(order.id, 'confirmed')} className="bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-md shadow-green-200 hover:bg-green-700">Accept</button>
                                    </>
                                ) : order.status === 'confirmed' ? (
                                    <button onClick={() => updateStatus(order.id, 'preparing')} className="col-span-2 bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                                        Start Cooking
                                    </button>
                                ) : order.status === 'preparing' ? (
                                    <button onClick={() => updateStatus(order.id, 'ready')} className="col-span-2 bg-primary text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                                        <CheckCircle size={18} /> Mark Ready
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
