'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Star, StarOff, Search, Store, MapPin } from 'lucide-react';

export default function FeaturedRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants');
      setRestaurants(res.data.data.restaurants || []);
    } catch {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (id) => {
    setTogglingId(id);
    try {
      const res = await api.patch(`/admin/restaurants/${id}/featured`);
      const updated = res.data.data;
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_featured: updated.is_featured } : r));
      toast.success(updated.is_featured ? '⭐ Restaurant Featured!' : 'Restaurant removed from featured');
    } catch {
      toast.error('Failed to update');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = restaurants.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.area?.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered.filter(r => r.is_featured);
  const rest = filtered.filter(r => !r.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Popular Restaurants</h1>
            <p className="text-sm text-gray-500">Featured restaurants appear first on the user app home screen</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search restaurant or area..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featured.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Featured ({featured.length})
                </h2>
                <div className="space-y-3">
                  {featured.map(r => (
                    <RestaurantCard key={r.id} restaurant={r} onToggle={toggleFeatured} toggling={togglingId === r.id} />
                  ))}
                </div>
              </div>
            )}

            {/* All Restaurants */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                All Restaurants ({rest.length})
              </h2>
              <div className="space-y-3">
                {rest.map(r => (
                  <RestaurantCard key={r.id} restaurant={r} onToggle={toggleFeatured} toggling={togglingId === r.id} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant: r, onToggle, toggling }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 flex items-center gap-4 transition-all ${
      r.is_featured ? 'border-yellow-300 shadow-yellow-100 shadow-md' : 'border-gray-100'
    }`}>
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {r.image_url ? (
          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
        ) : (
          <Store className="w-5 h-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">{r.name}</p>
          {r.is_featured && <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">⭐ Featured</span>}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-gray-400" />
          <p className="text-xs text-gray-400 truncate">{r.area || r.city || 'No location'}</p>
        </div>
        <p className={`text-xs mt-0.5 font-medium ${r.is_active ? 'text-green-600' : 'text-red-500'}`}>
          {r.is_active ? '🟢 Open' : '🔴 Closed'}
        </p>
      </div>
      <button
        onClick={() => onToggle(r.id)}
        disabled={toggling}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          r.is_featured
            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
        }`}
      >
        {toggling ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : r.is_featured ? (
          <><StarOff className="w-4 h-4" /> Remove</>
        ) : (
          <><Star className="w-4 h-4" /> Feature</>
        )}
      </button>
    </div>
  );
}
