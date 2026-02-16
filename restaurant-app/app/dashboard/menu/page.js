'use client';
import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, GripVertical, Search, UtensilsCrossed } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CategoryModal, ItemModal } from '../../../components/MenuModals';

export default function MenuPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    const fetchMenu = async () => {
        try {
            const meRes = await api.get('/restaurants/me');
            if (meRes.data.success) {
                const id = meRes.data.data.restaurant.id;
                setRestaurantId(id);
                const menuRes = await api.get(`/menu/${id}`);
                if (menuRes.data.success) {
                    setCategories(menuRes.data.data.categories);
                }
            }
        } catch (error) {
            console.error('Failed to fetch menu:', error);
            toast.error('Could not load menu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const toggleAvailability = async (itemId, currentStatus) => {
        // Optimistic UI update
        const updatedCategories = categories.map(cat => ({
            ...cat,
            items: cat.items.map(item => item.id === itemId ? { ...item, is_available: !currentStatus } : item)
        }));
        setCategories(updatedCategories);

        try {
            await api.put(`/menu/items/${itemId}/toggle`);
            toast.success(currentStatus ? 'Item marked unavailable' : 'Item marked available');
        } catch (error) {
            console.error('Failed to toggle:', error);
            toast.error('Failed to update availability');
            fetchMenu(); // Revert on failure
        }
    };

    // --- Actions ---
    const openAddCategory = () => {
        setEditingCategory(null);
        setIsCatModalOpen(true);
    };

    const openEditCategory = (cat) => {
        setEditingCategory(cat);
        setIsCatModalOpen(true);
    };

    const openAddItem = () => {
        if (!categories || categories.length === 0) {
            toast.error('You need to create a category first!');
            return;
        }
        setEditingItem(null);
        setIsItemModalOpen(true);
    };

    const openEditItem = (item) => {
        setEditingItem(item);
        setIsItemModalOpen(true);
    };

    const handleCategorySubmit = async (data) => {
        try {
            if (editingCategory) {
                await api.put(`/menu/${restaurantId}/categories/${editingCategory.id}`, data);
                toast.success('Category updated successfully');
            } else {
                await api.post(`/menu/${restaurantId}/categories`, data);
                toast.success('Category created successfully');
            }
            setIsCatModalOpen(false);
            fetchMenu();
        } catch (error) {
            console.error('Category error:', error);
            toast.error('Failed to save category');
        }
    };

    const handleDeleteCategory = async (catId) => {
        if (!confirm('Delete this category? All items inside it will be deleted too.')) return;
        try {
            await api.delete(`/menu/${restaurantId}/categories/${catId}`);
            toast.success('Category deleted');
            fetchMenu();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const handleItemSubmit = async (data) => {
        try {
            // Sanitize payload
            const payload = {
                ...data,
                price: parseFloat(data.price),
                image_url: data.image_url ? data.image_url : null, // Send null if empty string
                // Joi optional() allows null but might fail on empty string with uri()
            };

            // Further clean payload to remove nulls if necessary, but Joi usually accepts null for optional if allows. 
            // Better yet, remove the key if it's null/empty to be safe with 'optional()'
            if (!payload.image_url) delete payload.image_url;

            console.log('Submitting item payload:', payload); // Debug log

            if (editingItem) {
                await api.put(`/menu/${restaurantId}/items/${editingItem.id}`, payload);
                toast.success('Item updated successfully');
            } else {
                await api.post(`/menu/${restaurantId}/items`, payload);
                toast.success('Item created successfully');
            }
            setIsItemModalOpen(false);
            fetchMenu();
        } catch (error) {
            console.error('Item error:', error);
            // Show more specific error from backend if available
            const msg = error.response?.data?.message || 'Failed to save item';
            toast.error(msg);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/menu/${restaurantId}/items/${itemId}`);
            toast.success('Item deleted');
            fetchMenu();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
            <p>Loading your menu...</p>
        </div>
    );

    return (
        <div className="pb-24">
            {/* Header Area */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
                            <p className="text-sm text-gray-500 hidden sm:block">Manage categories and items</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={openAddCategory}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
                            >
                                + Category
                            </button>
                            <button
                                onClick={openAddItem}
                                className="px-4 py-2 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all active:scale-95 text-sm flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-6 max-w-3xl mx-auto">
                {categories.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UtensilsCrossed size={32} className="text-orange-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Items Yet</h2>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Start by creating a category (e.g., "Starters", "Main Course") to organize your menu.</p>
                        <button
                            onClick={openAddCategory}
                            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all"
                        >
                            Create First Category
                        </button>
                    </div>
                ) : (
                    categories.map((cat) => (
                        <div key={cat.id} className="space-y-3">
                            {/* Category Header */}
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-bold text-gray-800">{cat.name}</h3>
                                <div className="flex gap-1">
                                    <button onClick={() => openEditCategory(cat)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="grid grid-cols-1 gap-3">
                                {cat.items.length === 0 && (
                                    <div className="p-6 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                        <p className="text-sm text-gray-400">Empty Category</p>
                                    </div>
                                )}
                                {cat.items.map((item) => (
                                    <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex gap-3 relative overflow-hidden group">

                                        {/* Image */}
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <UtensilsCrossed size={20} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                <img
                                                    src={item.is_veg ? "https://img.icons8.com/color/48/vegetarian-food-symbol.png" : "https://img.icons8.com/color/48/non-vegetarian-food-symbol.png"}
                                                    alt={item.is_veg ? "Veg" : "Non-Veg"}
                                                    className="w-4 h-4"
                                                />
                                                <h4 className={`font-bold text-gray-900 truncate ${!item.is_available && 'line-through text-gray-400'}`}>
                                                    {item.name}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.description || 'No description'}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-900">₹{item.price}</span>
                                                <div className="flex items-center gap-1">
                                                    <label className="relative inline-flex items-center cursor-pointer mr-2">
                                                        <input type="checkbox" checked={item.is_available} onChange={() => toggleAvailability(item.id, item.is_available)} className="sr-only peer" />
                                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                                    </label>
                                                    <button onClick={() => openEditItem(item)} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CategoryModal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                onSubmit={handleCategorySubmit}
                initialData={editingCategory}
            />

            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSubmit={handleItemSubmit}
                initialData={editingItem}
                categories={categories}
            />
        </div>
    );
}
