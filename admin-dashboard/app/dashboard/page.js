'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { DollarSign, ShoppingBag, Users, Store } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                <Icon className={color.replace('bg-', 'text-')} size={24} />
            </div>
            {trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
);

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/dashboard');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                // Fallback to zeros/empty if failed, or show error?
                // For now, keep loading false to show something or empty state
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStats();
    }, [user]);

    if (loading) return <div className="p-10 text-center">Loading stats...</div>;
    if (!stats) return <div className="p-10 text-center">Failed to load stats.</div>;

    const barData = {
        labels: stats.chart.map(d => d.date),
        datasets: [
            {
                label: 'Revenue (₹)',
                data: stats.chart.map(d => d.revenue),
                backgroundColor: '#FF6B35',
                borderRadius: 4,
            },
        ],
    };

    const doughnutData = {
        labels: ['Delivered', 'Pending/Active'],
        datasets: [
            {
                data: [stats.monthly.orders, stats.today.orders], // Simplified for now as API returns aggregated
                backgroundColor: ['#10b981', '#3b82f6'],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`₹${stats.monthly.revenue.toLocaleString()}`} icon={DollarSign} color="bg-green-500" trend={0} />
                <StatCard title="Today's Orders" value={stats.today.orders} icon={ShoppingBag} color="bg-blue-500" trend={0} />
                <StatCard title="Total Users" value={stats.totals.users} icon={Users} color="bg-purple-500" trend={0} />
                <StatCard title="Restaurants" value={stats.totals.restaurants} icon={Store} color="bg-orange-500" trend={0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue (Last 7 Days)</h2>
                    <div className="h-64">
                        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Order Status Check</h2>
                    <div className="h-64 flex justify-center">
                        <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <h3 className="font-bold text-red-800">Pending Approvals</h3>
                    <div className="flex justify-between mt-2">
                        <span>Restaurants: <span className="font-bold">{stats.pending.restaurant_approvals}</span></span>
                        <span>Partners: <span className="font-bold">{stats.pending.partner_verifications}</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
