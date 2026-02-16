'use client';
import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LocationsPage() {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [formData, setFormData] = useState({ name: '', delivery_fee: '', min_order_amount: '' });

    const fetchZones = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/zones');
            if (res.data.success) {
                setZones(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load zones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingZone) {
                await api.put(`/admin/zones/${editingZone.id}`, formData);
                toast.success('Zone updated');
            } else {
                await api.post('/admin/zones', formData);
                toast.success('Zone created');
            }
            setShowModal(false);
            setEditingZone(null);
            setFormData({ name: '', delivery_fee: '', min_order_amount: '' });
            fetchZones();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this zone?')) return;
        try {
            await api.delete(`/admin/zones/${id}`);
            toast.success('Zone deleted');
            fetchZones();
        } catch (error) {
            toast.error('Failed to delete zone');
        }
    };

    const handleEdit = (zone) => {
        setEditingZone(zone);
        setFormData({
            name: zone.name,
            delivery_fee: zone.delivery_fee,
            min_order_amount: zone.min_order_amount
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Delivery Zones</h1>
                <button
                    onClick={() => {
                        setEditingZone(null);
                        setFormData({ name: '', delivery_fee: '', min_order_amount: '' });
                        setShowModal(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={20} /> Add Zone
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-bold text-gray-700">Location Name</th>
                                <th className="p-4 font-bold text-gray-700">Delivery Fee</th>
                                <th className="p-4 font-bold text-gray-700">Min Order</th>
                                <th className="p-4 font-bold text-gray-700">Status</th>
                                <th className="p-4 font-bold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {zones.map((zone) => (
                                <tr key={zone.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{zone.name}</td>
                                    <td className="p-4 text-green-600 font-bold">₹{zone.delivery_fee}</td>
                                    <td className="p-4 text-gray-500">₹{zone.min_order_amount}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${zone.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {zone.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(zone)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(zone.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {zones.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">No zones found. Add one to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingZone ? 'Edit Zone' : 'Add New Zone'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Degloor, Madnoor"
                                    className="w-full p-2 border border-gray-200 rounded-lg"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.delivery_fee}
                                        onChange={e => setFormData({ ...formData, delivery_fee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.min_order_amount}
                                        onChange={e => setFormData({ ...formData, min_order_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700"
                                >
                                    {editingZone ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
