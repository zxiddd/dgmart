'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FileBarChart, Download, Truck, Store, Calendar, TrendingUp, CreditCard, Banknote, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const PERIODS = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
];

export default function ReportsPage() {
    const [tab, setTab] = useState('rider');
    const [period, setPeriod] = useState('day');
    const [riders, setRiders] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            setListLoading(true);
            try {
                const [ridersRes, restRes] = await Promise.all([
                    api.get('/admin/reports/riders'),
                    api.get('/admin/reports/restaurants'),
                ]);
                setRiders(ridersRes.data?.data?.riders || []);
                setRestaurants(restRes.data?.data?.restaurants || []);
            } catch (e) {
                toast.error('Failed to load lists');
            } finally {
                setListLoading(false);
            }
        };
        fetchLists();
    }, []);

    useEffect(() => {
        if (!selectedId) { setReport(null); return; }
        const fetchReport = async () => {
            setLoading(true);
            try {
                const endpoint = tab === 'rider'
                    ? `/admin/reports/rider/${selectedId}?period=${period}`
                    : `/admin/reports/restaurant/${selectedId}?period=${period}`;
                const res = await api.get(endpoint);
                setReport(res.data?.data || null);
            } catch (e) {
                toast.error('Failed to load report');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [selectedId, period, tab]);

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setSelectedId(null);
        setReport(null);
    };

    const handleDownload = async () => {
        if (!selectedId) return;
        try {
            const endpoint = tab === 'rider'
                ? `/admin/reports/rider/${selectedId}/download?period=${period}`
                : `/admin/reports/restaurant/${selectedId}/download?period=${period}`;
            const res = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tab}_report_${period}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report downloaded!');
        } catch (e) {
            toast.error('Download failed');
        }
    };

    const list = tab === 'rider' ? riders : restaurants;
    const s = report?.summary;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileBarChart size={24} /> Reports
                </h1>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => handleTabChange('rider')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        tab === 'rider'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <Truck size={18} /> Rider Reports
                </button>
                <button
                    onClick={() => handleTabChange('restaurant')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        tab === 'restaurant'
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <Store size={18} /> Restaurant Reports
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Select Rider/Restaurant */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                            Select {tab === 'rider' ? 'Rider' : 'Restaurant'}
                        </p>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
                        {listLoading ? (
                            <p className="p-4 text-center text-gray-400 text-sm">Loading...</p>
                        ) : list.length === 0 ? (
                            <p className="p-4 text-center text-gray-400 text-sm">No {tab}s found</p>
                        ) : (
                            list.map((item) => {
                                const id = tab === 'rider' ? item.id : item.id;
                                const label = item.name || 'Unknown';
                                const sub = tab === 'rider' ? (item.vehicle_type || item.phone || '') : (item.address || '');
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedId(id)}
                                        className={`w-full text-left px-4 py-3 transition-colors ${
                                            selectedId === id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className="font-semibold text-gray-800 text-sm">{label}</p>
                                        <p className="text-xs text-gray-400 truncate">{sub}</p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Content: Report */}
                <div className="lg:col-span-3">
                    {/* Period Selector + Download */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                            {PERIODS.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => setPeriod(p.key)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        period === p.key
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <Calendar size={14} /> {p.label}
                                </button>
                            ))}
                        </div>
                        {report && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <Download size={16} /> Download CSV
                            </button>
                        )}
                    </div>

                    {!selectedId ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <FileBarChart size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-400 font-medium">
                                Select a {tab === 'rider' ? 'rider' : 'restaurant'} from the list to view their report
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Loading report...</p>
                        </div>
                    ) : report && s ? (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard
                                    icon={Package}
                                    label="Total Orders"
                                    value={s.total_orders || 0}
                                    color="blue"
                                />
                                <SummaryCard
                                    icon={Banknote}
                                    label="COD Orders"
                                    value={s.cod_orders || 0}
                                    sub={`₹${Number(s.cod_amount || 0).toLocaleString()}`}
                                    color="orange"
                                />
                                <SummaryCard
                                    icon={CreditCard}
                                    label="Prepaid Orders"
                                    value={s.prepaid_orders || 0}
                                    sub={`₹${Number(s.prepaid_amount || 0).toLocaleString()}`}
                                    color="purple"
                                />
                                <SummaryCard
                                    icon={TrendingUp}
                                    label={tab === 'rider' ? 'Total Earnings' : 'Total Revenue'}
                                    value={`₹${Number(s.total_earnings || s.total_revenue || s.total_amount || 0).toLocaleString()}`}
                                    color="green"
                                />
                            </div>

                            {/* Orders Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <p className="text-sm font-semibold text-gray-700">
                                        Order Details ({report.orders?.length || 0})
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-600">
                                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3">Order #</th>
                                                <th className="px-4 py-3">{tab === 'rider' ? 'Restaurant' : 'Customer'}</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Payment</th>
                                                {tab === 'rider' && <th className="px-4 py-3">Earning</th>}
                                                {tab === 'restaurant' && <th className="px-4 py-3">Status</th>}
                                                <th className="px-4 py-3">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(report.orders || []).map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{order.order_number}</td>
                                                    <td className="px-4 py-3">{order.restaurant_name || order.customer_name || '—'}</td>
                                                    <td className="px-4 py-3 font-medium">₹{order.total}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            order.payment_method === 'cod'
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {order.payment_method === 'cod' ? 'COD' : 'Prepaid'}
                                                        </span>
                                                    </td>
                                                    {tab === 'rider' && (
                                                        <td className="px-4 py-3 text-green-600 font-medium">₹{order.delivery_fee}</td>
                                                    )}
                                                    {tab === 'restaurant' && (
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                                        {order.delivered_at || order.placed_at || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!report.orders || report.orders.length === 0) && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                                        No orders found for this period
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, sub, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
    };
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
                <Icon size={20} />
            </div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
        </div>
    );
}
