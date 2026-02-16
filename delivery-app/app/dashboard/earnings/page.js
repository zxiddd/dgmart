'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { IndianRupee, TrendingUp, Calendar, Wallet } from 'lucide-react';

export default function EarningsPage() {
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const res = await api.get('/delivery/earnings');
                if (res.data.success) {
                    setEarnings(res.data.data.total);
                }
            } catch (error) {
                console.error('Failed to fetch earnings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading earnings...</div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] bg-gray-50">
            <div className="bg-primary p-6 text-white rounded-b-3xl shadow-lg shadow-orange-500/20">
                <p className="text-orange-100 text-sm font-medium mb-1">Total Earnings</p>
                <h1 className="text-4xl font-bold flex items-center gap-1">
                    <IndianRupee size={32} /> {earnings?.earnings || 0}
                </h1>
                <div className="mt-4 flex gap-2">
                    <button className="bg-white/20 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 hover:bg-white/30 transition">
                        Withdraw
                    </button>
                    <button className="bg-white/20 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30 hover:bg-white/30 transition">
                        Transaction History
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800">Weekly Summary</h3>
                    </div>
                    {/* Placeholder for weekly graph or list */}
                    <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200">
                        Graph Coming Soon
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800">Recent Payouts</h3>
                    </div>
                    <p className="text-gray-500 text-sm text-center py-4">No recent payouts.</p>
                </div>
            </div>
        </div>
    );
}
