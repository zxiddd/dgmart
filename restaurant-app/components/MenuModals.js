'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import ImageUpload from './ImageUpload';

function ModalPortal({ children }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
}

export function CategoryModal({ isOpen, onClose, onSubmit, initialData = null }) {
    const [name, setName] = useState('');
    const [sortOrder, setSortOrder] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setSortOrder(initialData?.sort_order || 0);
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, sort_order: parseInt(sortOrder) || 0 });
    };

    if (!isOpen) return null;

    return (
        <ModalPortal>
            {/* Backdrop - Simple optimized opacity */}
            <div className="fixed inset-0 bg-black/60 z-[99998] backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container - No custom animation classes, just standard fixed positioning */}
            <div className="fixed z-[99999] inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] pointer-events-auto">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Category' : 'New Category'}</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                    </div>
                    <div className="overflow-y-auto p-5 pb-8 custom-scrollbar">
                        <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category Name</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-base" placeholder="e.g. Starters" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sort Order</label>
                                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-base" placeholder="0" />
                            </div>
                        </form>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50/80 sm:rounded-b-2xl pb-safe">
                        <button type="submit" form="category-form" className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform text-lg hover:bg-orange-700">{initialData ? 'Save Changes' : 'Create Category'}</button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}

export function ItemModal({ isOpen, onClose, onSubmit, initialData = null, categories = [] }) {
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', category_id: '', is_veg: true, image_url: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: initialData?.name || '',
                description: initialData?.description || '',
                price: initialData?.price || '',
                category_id: initialData?.category_id || (categories.length > 0 ? categories[0].id : ''),
                is_veg: initialData?.is_veg ?? true,
                image_url: initialData?.image_url || ''
            });
        }
    }, [isOpen, initialData, categories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, price: parseFloat(formData.price) });
    };

    if (!isOpen) return null;

    return (
        <ModalPortal>
            <div className="fixed inset-0 bg-black/60 z-[99998] backdrop-blur-sm" onClick={onClose} />
            <div className="fixed z-[99999] inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] pointer-events-auto">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Item' : 'Add New Item'}</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 pb-8 custom-scrollbar">
                        <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-base" placeholder="e.g. Butter Chicken" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (₹)</label>
                                    <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-base" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                                    <div className="relative">
                                        <select required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white appearance-none text-base">
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none resize-none text-base" rows="3" placeholder="Dish details..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                                    <button type="button" onClick={() => setFormData({ ...formData, is_veg: true })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.is_veg ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Veg</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, is_veg: false })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!formData.is_veg ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'}`}>Non-Veg</button>
                                </div>
                            </div>

                            <ImageUpload
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                folder="menu"
                                label="Item Image"
                            />
                        </form>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50/80 sm:rounded-b-2xl pb-safe">
                        <button type="submit" form="item-form" className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform text-lg hover:bg-orange-700">{initialData ? 'Save Changes' : 'Add Item'}</button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}
