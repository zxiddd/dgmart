'use client';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, CheckCircle, XCircle, Package, Clock, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useSocket } from '@/context/SocketContext';

export default function OrdersPage() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/delivery/orders');
            if (res.data.success) {
                // We only want active orders here
                setAssignments(res.data.data.active);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => {
            fetchOrders();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Socket listener for new assignments
    useEffect(() => {
        if (!socket) return;
        socket.on('new_assignment', () => { fetchOrders(); toast.success('🛵 New Order Assigned!'); });
        socket.on('assignment_status_update', () => { fetchOrders(); });
        return () => { socket.off('new_assignment'); socket.off('assignment_status_update'); };
    }, [socket]);

    const handleAccept = async (assignmentId) => {
        try {
            const res = await api.put(`/delivery/orders/${assignmentId}/respond`, { action: 'accept' });
            if (res.data.success) {
                toast.success('Order Accepted!');
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to accept order');
        }
    };

    const handleUpdateStatus = async (assignmentId, status) => {
        try {
            const res = await api.put(`/delivery/orders/${assignmentId}/status`, { status });
            if (res.data.success) {
                toast.success(`Status updated to ${status.replace('_', ' ')}`);
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading && assignments.length === 0) return (
        <div className="p-4 space-y-6 animate-pulse">
            <div className="h-8 w-40 bg-gray-200 rounded-lg" />
            {[1, 2].map(i => (
                <div key={i} className="h-48 bg-gray-50 rounded-2xl border border-gray-100" />
            ))}
        </div>
    );

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">Active Orders</h1>

            <div className="space-y-4">
                {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                        <Package size={48} className="text-gray-300 mb-2" />
                        <p>No active orders</p>
                        <p className="text-xs">Go online and wait for assignments!</p>
                    </div>
                ) : (
                    assignments.map((assign) => (
                        <div key={assign.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Status Badge */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg ${assign.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                                assign.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                    assign.status === 'picked_up' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'
                                }`}>
                                {assign.status.replace('_', ' ').toUpperCase()}
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-lg text-gray-900">#{assign.order_details.order_number}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock size={12} /> {new Date(assign.created_at).toLocaleTimeString()}
                                </p>
                            </div>

                            {/* Order Info */}
                            <div className="space-y-4 mb-4">
                                {/* Pickup */}
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Package size={16} />
                                        </div>
                                        <div className="w-0.5 h-full bg-gray-200 my-1" />
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-xs text-gray-500 font-bold uppercase">Pickup</p>
                                        <p className="font-bold text-gray-900">Restaurant</p>
                                        {/* Ideally fetching restaurant name, but might need to be joined in backend or available in order_details */}
                                        <p className="text-sm text-gray-600">Order Amount: ₹{assign.order_details.total}</p>
                                    </div>
                                </div>

                                {/* Dropoff */}
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <MapPin size={16} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-bold uppercase">Dropoff</p>
                                        <p className="font-bold text-gray-900">{assign.order_details.customer_name || 'Customer'}</p>
                                        <p className="text-sm text-gray-600">{assign.order_details.delivery_address}</p>
                                        <div className="flex gap-2 mt-2">
                                            <button className="p-2 bg-gray-100 rounded-full text-blue-600">
                                                <Navigation size={18} />
                                            </button>
                                            <button className="p-2 bg-gray-100 rounded-full text-green-600">
                                                <Phone size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                                {assign.status === 'assigned' && (
                                    <>
                                        <button
                                            // onClick={() => handleReject(assign.id)}
                                            className="bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAccept(assign.id)}
                                            className="bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Accept
                                        </button>
                                    </>
                                )}

                                {assign.status === 'accepted' && (
                                    <button
                                        onClick={() => handleUpdateStatus(assign.id, 'picked_up')}
                                        className="col-span-2 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Package size={18} /> Confirm Pickup
                                    </button>
                                )}

                                {assign.status === 'picked_up' && (
                                    <button
                                        onClick={() => handleUpdateStatus(assign.id, 'delivered')}
                                        className="col-span-2 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Mark Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
