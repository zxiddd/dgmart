'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, XCircle, MapPin, Phone, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryPage() {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/delivery-partners');
            if (res.data.success) {
                setPartners(res.data.data.partners);
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error);
            toast.error('Failed to load delivery partners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const handleVerify = async (partnerId, action) => {
        if (!confirm(`Are you sure you want to ${action} this partner?`)) return;
        try {
            await api.put(`/admin/delivery-partners/${partnerId}/verify`, { action });
            toast.success(`Partner ${action}d successfully`);
            fetchPartners();
        } catch (error) {
            console.error('Action failed:', error);
            toast.error('Action failed');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Delivery Partners</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">Loading delivery partners...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Partner</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partners.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                    <Truck size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{p.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-400">ID: {p.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-2"><Phone size={14} /> {p.phone || 'N/A'}</div>
                                                <div className="text-xs text-gray-400">{p.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="font-medium">{p.vehicle_type}</p>
                                                <p className="text-xs text-gray-500">{p.vehicle_number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {p.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {new Date(p.joined_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 flex gap-2">
                                            {!p.is_verified && (
                                                <button
                                                    onClick={() => handleVerify(p.id, 'verify')}
                                                    className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors border border-green-200"
                                                    title="Verify"
                                                >
                                                    <CheckCircle size={18} /> Verify
                                                </button>
                                            )}
                                            {/* Add reject or other actions */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {partners.length === 0 && <div className="p-8 text-center text-gray-500">No delivery partners found.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
