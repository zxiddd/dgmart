'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

export default function OrderPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/orders');
            if (res.data.success) {
                setOrders(res.data.data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const getStatusColor = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'pending') return 'bg-yellow-100 text-yellow-600';
        if (s === 'confirmed' || s === 'preparing') return 'bg-blue-100 text-blue-600';
        if (s === 'delivered') return 'bg-green-100 text-green-600';
        if (s === 'cancelled') return 'bg-red-100 text-red-600';
        return 'bg-gray-100 text-gray-600';
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Orders</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">Loading orders...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-primary">#{order.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.customer_name || 'Guest'}</p>
                                                <p className="text-xs text-gray-400">{order.customer_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{order.items ? JSON.parse(order.items).length : 0} Items</td>
                                        <td className="px-6 py-4 font-bold text-gray-800">₹{order.total}</td>
                                        <td className="px-6 py-4 text-sm">{new Date(order.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <button
                                                onClick={() => handleViewDetails(order)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.length === 0 && <div className="p-10 text-center text-gray-500">No orders found.</div>}
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {isDetailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Order Details #{selectedOrder.id.slice(0, 8)}</h2>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Customer Information</h3>
                                    <p className="font-bold text-gray-800 text-lg">{selectedOrder.customer_name || 'Guest User'}</p>
                                    <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                                    <p className="text-sm text-gray-500 mt-1">{selectedOrder.customer_phone || 'No phone provided'}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Order Status</h3>
                                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-3">Placed on: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Delivery Address</h3>
                                    <p className="text-gray-800 text-sm leading-relaxed">{selectedOrder.delivery_address}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Payment Information</h3>
                                    <p className="text-sm text-gray-800 font-medium">Method: <span className="uppercase text-primary">{selectedOrder.payment_method}</span></p>
                                    <p className="text-sm text-gray-800 font-medium mt-1">Status: <span className={`capitalize ${selectedOrder.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedOrder.payment_status}</span></p>
                                    {(selectedOrder.razorpay_order_id || selectedOrder.razorpay_payment_id) && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            {selectedOrder.razorpay_order_id && <p className="text-[10px] text-gray-400">Order: {selectedOrder.razorpay_order_id}</p>}
                                            {selectedOrder.razorpay_payment_id && <p className="text-[10px] text-gray-400">Payment: {selectedOrder.razorpay_payment_id}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Order Items</h3>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 font-bold text-gray-600">
                                            <tr>
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedOrder.items && JSON.parse(selectedOrder.items).map((item, idx) => (
                                                <tr key={idx} className="bg-white">
                                                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-600">x{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-gray-800">₹{item.price * item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-bold text-gray-800">
                                            <tr>
                                                <td colSpan="2" className="px-4 py-3 text-right uppercase text-xs text-gray-500">Subtotal</td>
                                                <td className="px-4 py-3 text-right">₹{selectedOrder.subtotal}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="2" className="px-4 py-3 text-right uppercase text-xs text-gray-500">Delivery Fee</td>
                                                <td className="px-4 py-3 text-right">₹{selectedOrder.delivery_fee}</td>
                                            </tr>
                                            <tr className="text-primary text-lg">
                                                <td colSpan="2" className="px-4 py-3 text-right uppercase">Grand Total</td>
                                                <td className="px-4 py-3 text-right">₹{selectedOrder.total}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-8 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                Close Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
