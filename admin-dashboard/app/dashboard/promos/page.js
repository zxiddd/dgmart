'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PromoModal from '@/components/PromoModal';
import { Tag, Plus, Trash, Calendar, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PromosPage() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/promos');
            if (res.data.success) {
                setPromos(res.data.data.promos);
            }
        } catch (error) {
            console.error('Failed to fetch promos:', error);
            toast.error('Failed to load promotions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;
        try {
            await api.delete(`/admin/promos/${id}`);
            toast.success('Promo deleted');
            fetchPromos();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete');
        }
    };

    const handleEdit = (promo) => {
        setEditingPromo(promo);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPromo(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Promotions & Offers</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
                >
                    <Plus size={18} /> Create Promo
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">Loading promotions...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Discount</th>
                                    <th className="px-6 py-4">Usage</th>
                                    <th className="px-6 py-4">Validity</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {promos.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-primary" />
                                                <span className="font-bold text-gray-800 uppercase tracking-wide bg-orange-50 px-2 py-1 rounded border border-orange-100">{p.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-green-600">
                                                {p.type === 'percentage' ? `${p.value}% OFF` : `₹${p.value} FLAT`}
                                            </span>
                                            <div className="text-xs text-gray-400">Min Order: ₹{p.min_order}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {p.usage_count} / {p.usage_limit} used
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(p.valid_from).toLocaleDateString()}</span>
                                                <span className="text-xs text-gray-400">to {new Date(p.valid_until).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {promos.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Tag className="text-gray-400" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Promotions</h3>
                                <p className="text-gray-500">Create a promo code to boost sales.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PromoModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onPromoSaved={fetchPromos}
                initialData={editingPromo}
            />
        </div>
    );
}
