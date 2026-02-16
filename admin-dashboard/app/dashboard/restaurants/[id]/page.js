'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Save, Plus, Trash, Edit, CheckCircle, XCircle } from 'lucide-react';

export default function ManageRestaurant() {
    const { id } = useParams();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState('info'); // info, menu
    const [isSaving, setIsSaving] = useState(false);

    // Edit Forms
    const [formData, setFormData] = useState({});
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/restaurants/${id}`); // Public endpoint? Or Admin? 
            // The public endpoint /api/restaurants/:id gives menu.
            // Admin endpoint logic: We can assume GET /restaurants/:id works for reading.
            // FOR UPDATING, we need admin permissions which we have.

            if (res.data.success) {
                setRestaurant(res.data.data.restaurant);
                setMenu(res.data.data.menu);
                setFormData(res.data.data.restaurant);

                // Extract categories from menu structure for easier management
                // Menu structure: [{ ...category, items: [] }]
                setCategories(res.data.data.menu);
            }
        } catch (error) {
            console.error('Failed to fetch restaurant:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Clean up formData before sending?
            // Assuming API handles partial updates
            await api.put(`/restaurants/${id}`, formData);
            alert('Restaurant updated successfully!');
            fetchData();
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update restaurant.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Menu Logic Placeholders ---
    // We need endpoints to:
    // 1. Create Category
    // 2. Create Item
    // 3. Delete Category/Item
    // These might exist in menuController. If not, I'll need to create them.

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!restaurant) return <div className="p-10 text-center text-red-500">Restaurant not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Manage {restaurant.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${restaurant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {restaurant.status}
                </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-3 font-medium text-sm transition-colors ${activeTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Restaurant Info
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`px-4 py-3 font-medium text-sm transition-colors ${activeTab === 'menu' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Menu Management
                </button>
            </div>

            {/* Content */}
            {activeTab === 'info' && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-3xl">
                    <form onSubmit={handleUpdateInfo} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image_url || ''}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Avg Prep Time (mins)</label>
                                <input
                                    type="number"
                                    value={formData.avg_prep_time_mins || ''}
                                    onChange={e => setFormData({ ...formData, avg_prep_time_mins: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'menu' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Menu Categories</h2>
                        <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                            <Plus size={16} /> Add Category
                        </button>
                    </div>

                    {categories.length === 0 ? (
                        <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                            No menu items yet. Start by adding a category.
                        </div>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                                    <h3 className="font-bold text-gray-800">{cat.name}</h3>
                                    <div className="flex gap-2">
                                        <button className="p-1 hover:text-blue-600 text-gray-400" title="Edit Category"><Edit size={16} /></button>
                                        <button className="p-1 hover:text-red-600 text-gray-400" title="Delete Category"><Trash size={16} /></button>
                                        <button className="ml-2 text-primary text-xs font-semibold flex items-center gap-1 bg-white px-2 py-1 rounded border border-primary/20 hover:bg-primary/5">
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {cat.items.map(item => (
                                        <div key={item.id} className="p-4 flex gap-4 items-center hover:bg-gray-50/50">
                                            <img src={item.image_url || 'https://placehold.co/80x80'} className="w-16 h-16 rounded-md object-cover bg-gray-100" />
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                                    <span className="font-bold text-gray-900">₹{item.price}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.is_veg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.is_veg ? 'VEG' : 'NON-VEG'}
                                                    </span>
                                                    {!item.is_available && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Unavailable</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pl-4">
                                                <button className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded"><Edit size={16} /></button>
                                                <button className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded"><Trash size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {cat.items.length === 0 && (
                                        <div className="p-4 text-center text-sm text-gray-400 italic">No items in this category</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
