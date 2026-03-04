'use client';
import { useState, useEffect } from 'react';
import api from '@/src/lib/api';
import { TrendingUp, Package, IndianRupee, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PERIODS = ['Today', 'This Week', 'This Month'];

export default function EarningsPage() {
  const [period, setPeriod] = useState('This Week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const map = { 'Today': 'today', 'This Week': 'week', 'This Month': 'month' };
        const res = await api.get(`/delivery/earnings?period=${map[period]}`);
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [period]);

  const totalEarnings = data?.total_earnings || data?.earnings || 0;
  const totalDeliveries = data?.total_deliveries || data?.deliveries || 0;
  const avgPerOrder = totalDeliveries > 0 ? (totalEarnings / totalDeliveries).toFixed(0) : 0;
  const rating = data?.rating || 5.0;

  // Build chart data from daily_breakdown or similar
  const chartLabels = data?.daily_breakdown?.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  }) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const chartValues = data?.daily_breakdown?.map((d) => d.earnings || 0) ||
    [0, 0, 0, 0, 0, 0, 0];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        borderColor: '#f97316',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw}`,
        },
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#f97316',
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: '600' }, color: '#9ca3af' },
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 11 },
          color: '#9ca3af',
          callback: (v) => `₹${v}`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-xl font-extrabold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track your income</p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 px-5 py-3 bg-white border-b border-gray-100">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
              period === p ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <EarningCard
                label="Total Earned"
                value={`₹${totalEarnings}`}
                icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
                bg="bg-orange-50"
                big
              />
              <EarningCard
                label="Deliveries"
                value={totalDeliveries}
                icon={<Package className="w-5 h-5 text-blue-500" />}
                bg="bg-blue-50"
                big
              />
              <EarningCard
                label="Avg / Order"
                value={`₹${avgPerOrder}`}
                icon={<IndianRupee className="w-4 h-4 text-green-500" />}
                bg="bg-green-50"
              />
              <EarningCard
                label="Rating"
                value={`${parseFloat(rating).toFixed(1)} ★`}
                icon={<Star className="w-4 h-4 text-yellow-500" />}
                bg="bg-yellow-50"
              />
            </div>

            {/* Chart */}
            {chartValues.some((v) => v > 0) && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-3">
                  Earnings — {period}
                </p>
                <Bar data={chartData} options={chartOptions} height={160} />
              </div>
            )}

            {/* Order breakdown */}
            {data?.orders?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-bold text-gray-700">Order Breakdown</p>
                </div>
                {data.orders.map((order, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {order.restaurant_name || '#' + (order.order_number || '—')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.delivered_at
                          ? new Date(order.delivered_at).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-green-600">
                      ₹{order.delivery_fee || order.earning || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!data && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No earnings data for this period
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EarningCard({ label, value, icon, bg, big }) {
  return (
    <div className={clsx('bg-white border border-gray-100 rounded-2xl p-4 shadow-sm', big && 'col-span-1')}>
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-2', bg)}>
        {icon}
      </div>
      <p className={clsx('font-extrabold text-gray-900 leading-tight', big ? 'text-xl' : 'text-lg')}>
        {value}
      </p>
      <p className="text-xs text-gray-400 font-semibold mt-0.5">{label}</p>
    </div>
  );
}
