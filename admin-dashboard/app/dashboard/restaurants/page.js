'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AddRestaurantModal from '@/components/AddRestaurantModal';
import RestaurantDetailsModal from '@/components/RestaurantDetailsModal';
import { Eye, Edit, Trash, Plus, MapPin, Clock, CheckCircle } from 'lucide-react';

export default function RestaurantsData() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/restaurants');
            if (res.data.success) {
                setRestaurants(res.data.data.restaurants || []);
            }
        } catch (error) {
            console.error('Failed to fetch restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this restaurant?')) return;
        try {
            await api.delete(`/admin/restaurants/${id}`);
            fetchRestaurants();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete restaurant');
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this restaurant?')) return;
        try {
            await api.put(`/admin/restaurants/${id}/approve`, { action: 'approve' });
            fetchRestaurants();
        } catch (error) {
            console.error('Failed to approve:', error);
            alert('Failed to approve restaurant');
        }
    };

    const handleEdit = (restaurant) => {
        setEditingRestaurant(restaurant);
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingRestaurant(null);
    };

    const handleViewDetails = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Restaurants</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
                >
                    <Plus size={18} /> Add New
                </button>
            </div>

            {/* ... Stats Cards ... */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading restaurants...</div>
                ) : restaurants.length === 0 ? (
                    <div className="p-12 text-center">
                        {/* ... Empty State ... */}
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No restaurants yet</h3>
                        <p className="text-gray-500 mb-4">Get started by creating your first restaurant.</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="text-primary font-medium hover:underline"
                        >
                            Add Restaurant
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Restaurant</th>
                                    <th className="px-6 py-4">Info</th>
                                    <th className="px-6 py-4">Rating</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {restaurants.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.image_url || 'https://placehold.co/100x100'}
                                                    alt=""
                                                    className="w-12 h-12 rounded-lg object-cover bg-gray-200 border border-gray-100"
                                                />
                                                <div>
                                                    <span className="font-semibold text-gray-900 block">{item.name}</span>
                                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                        <Clock size={12} />
                                                        {item.avg_delivery_time_mins} mins
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-gray-700">{(item.cuisine_type || []).join(', ')}</span>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <MapPin size={12} />
                                                    <span className="truncate max-w-[150px]">{item.address}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-100">
                                                ★ {item.rating}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${item.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                item.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                {item.status === 'pending_approval' ? 'Pending' : (item.is_active ? 'Active' : 'Inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {item.status === 'pending_approval' && (
                                                    <button
                                                        onClick={() => handleApprove(item.id)}
                                                        className="p-2 hover:bg-green-50 hover:text-green-600 rounded-lg text-green-600 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}

                                                <button
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                    title="View Details"
                                                    onClick={() => handleViewDetails(item)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-colors"
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
                    </div>
                )}
            </div>

            <AddRestaurantModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onRestaurantAdded={fetchRestaurants}
                initialData={editingRestaurant}
            />

            <RestaurantDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                restaurant={selectedRestaurant}
            />
        </div>
    );
}
