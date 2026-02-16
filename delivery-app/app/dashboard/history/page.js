'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Clock, MapPin, IndianRupee, ArrowRight } from 'lucide-react';

export default function HistoryPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/delivery/history');
                if (res.data.success) {
                    setOrders(res.data.data.history);
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading history...</div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] bg-gray-50">
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800">Delivery History</h1>
            </div>

            <div className="p-4 space-y-4 flex-1">
                {orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No past deliveries yet.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Order</span>
                                    <p className="font-bold text-gray-900">#{order.order_details.order_number || order.order_id.slice(0, 8)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Earned</span>
                                    <p className="font-bold text-green-600">₹{order.order_details.delivery_fee || 0}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-3">
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <MapPin size={16} className="mt-0.5 text-primary shrink-0" />
                                    <p className="line-clamp-2">{order.order_details.delivery_address || 'Address hidden'}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock size={14} />
                                    <span>{new Date(order.delivered_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
