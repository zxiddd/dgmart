'use client';
import { useState, useEffect } from 'react';
import api from '@/src/lib/api';
import { Package, CheckCircle2, XCircle, Clock, IndianRupee, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const FILTERS = ['All', 'Today', 'This Week', 'This Month'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOrders = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({ page: pageNum, limit: 15 });
      if (filter === 'Today') params.append('period', 'today');
      else if (filter === 'This Week') params.append('period', 'week');
      else if (filter === 'This Month') params.append('period', 'month');

      const res = await api.get(`/delivery/history?${params}`);
      const data = res.data?.history || res.data?.data?.history || res.data?.assignments || [];
      const total = res.data?.total || data.length;

      if (reset || pageNum === 1) {
        setOrders(data);
      } else {
        setOrders((prev) => [...prev, ...data]);
      }
      setHasMore(orders.length + data.length < total);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchOrders(1, true);
  }, [filter]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchOrders(next);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-xl font-extrabold text-gray-900">Delivery History</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {orders.length} {filter === 'All' ? 'total' : filter.toLowerCase()} deliveries
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all',
              filter === f
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order, i) => (
                <OrderHistoryCard key={order.id || order.order_id || i} order={order} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full mt-4 py-3 text-sm font-bold text-primary-600 flex items-center justify-center gap-1"
              >
                {loadingMore ? 'Loading...' : (<><ChevronDown className="w-4 h-4" /> Load more</>)}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OrderHistoryCard({ order }) {
  const status = order.order_status || order.status;
  const isDelivered = status === 'delivered';
  const isCancelled = ['cancelled', 'refunded'].includes(status);

  const time = order.delivered_at || order.created_at || order.placed_at;
  const timeStr = time
    ? new Date(time).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            isDelivered ? 'bg-green-50' : isCancelled ? 'bg-red-50' : 'bg-gray-100'
          )}>
            {isDelivered ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : isCancelled ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Package className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {order.restaurant_name || 'Restaurant'}
            </p>
            <p className="text-xs text-gray-400 font-medium">#{order.order_number || order.order_id?.slice(-6) || '—'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={clsx(
            'text-sm font-extrabold',
            isDelivered ? 'text-green-600' : 'text-gray-400'
          )}>
            {isDelivered ? `₹${order.delivery_fee || order.earning || '40'}` : '—'}
          </p>
          <span className={clsx(
            'text-[10px] font-bold px-2 py-0.5 rounded-full',
            isDelivered ? 'bg-green-100 text-green-700' :
            isCancelled ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-500'
          )}>
            {isDelivered ? 'Delivered' : isCancelled ? 'Cancelled' : status || 'In Progress'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeStr}
        </div>
        {order.distance_km && (
          <span>{parseFloat(order.distance_km).toFixed(1)} km</span>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
        <Package className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-500 mb-1">No deliveries yet</h3>
      <p className="text-xs text-gray-400">Your completed deliveries will show here</p>
    </div>
  );
}
