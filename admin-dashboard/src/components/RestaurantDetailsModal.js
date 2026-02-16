import React from 'react';
import { X, MapPin, Phone, Star, Clock, Info, Briefcase, DollarSign, Globe } from 'lucide-react';

export default function RestaurantDetailsModal({ isOpen, onClose, restaurant }) {
    if (!isOpen || !restaurant) return null;

    const stats = [
        { label: 'Rating', value: `${restaurant.rating} / 5`, icon: <Star size={18} className="text-orange-400" /> },
        { label: 'Avg Delivery', value: `${restaurant.avg_delivery_time_mins || 30} mins`, icon: <Clock size={18} className="text-blue-400" /> },
        { label: 'Delivery Fee', value: `₹${restaurant.delivery_fee || 0}`, icon: <DollarSign size={18} className="text-green-400" /> },
        { label: 'Min Order', value: `₹${restaurant.min_order_amount || 0}`, icon: <Info size={18} className="text-purple-400" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header with Background Image */}
                <div className="relative h-48 sm:h-64">
                    <img
                        src={restaurant.image_url || 'https://placehold.co/600x300'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-6 left-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${restaurant.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {restaurant.status === 'pending_approval' && (
                                <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    Pending Approval
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold">{restaurant.name}</h2>
                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                            <MapPin size={14} />
                            <span>{restaurant.address}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="mb-2">{stat.icon}</div>
                                <div className="text-xs text-gray-500 uppercase font-semibold">{stat.label}</div>
                                <div className="text-lg font-bold text-gray-800">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Info size={16} className="text-primary" />
                                Basic Information
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><Phone size={14} /> Phone</span>
                                    <span className="text-gray-800 font-medium">{restaurant.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><Briefcase size={14} /> Cuisines</span>
                                    <span className="text-gray-800 font-medium font-mono text-xs">{(restaurant.cuisine_type || []).join(', ')}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><Globe size={14} /> Coordinates</span>
                                    <span className="text-gray-800 font-medium font-mono text-xs cursor-help" title={`Lat: ${restaurant.lat}, Lng: ${restaurant.lng}`}>
                                        {restaurant.lat?.toFixed(4)}, {restaurant.lng?.toFixed(4)}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Star size={16} className="text-primary" />
                                Performance & Settings
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                    <span className="text-gray-500 text-sm">Preparation Time</span>
                                    <span className="text-gray-800 font-medium">{restaurant.avg_prep_time_mins || 30} mins</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                    <span className="text-gray-500 text-sm">Delivery Radius</span>
                                    <span className="text-gray-800 font-medium">{restaurant.delivery_radius_km || 10} km</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                    <span className="text-gray-500 text-sm">Member Since</span>
                                    <span className="text-gray-800 font-medium">{new Date(restaurant.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white font-bold transition-all"
                    >
                        Close
                    </button>
                    {restaurant.status === 'pending_approval' && (
                        <button
                            className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-orange-600 font-bold shadow-lg shadow-orange-100 transition-all active:scale-95"
                            onClick={() => {
                                // Logic handled in parent, but could trigger here
                                alert('Please use the approve button in the list.');
                            }}
                        >
                            Approve Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
