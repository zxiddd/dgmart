'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Truck, DollarSign, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        rider_fee_per_order: 0,
        platform_fee_percentage: 0,
        delivery_fee_base: 0,
        require_phone_verification: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.success) {
                setSettings(prev => ({ ...prev, ...res.data.data.settings }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/admin/settings', settings);
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Platform Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Delivery Settings Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Delivery Configuration</h2>
                            <p className="text-sm text-gray-500">Manage rider earnings and delivery fees</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rider Earnings per Order (₹)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.rider_fee_per_order}
                                    onChange={(e) => setSettings({ ...settings, rider_fee_per_order: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Fixed amount paid to rider for each completed delivery.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Base Delivery Fee to Customer (₹)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.delivery_fee_base}
                                    onChange={(e) => setSettings({ ...settings, delivery_fee_base: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Default delivery fee charged if no zone logic applies.</p>
                        </div>
                    </div>
                </div>

                {/* Platform Fees Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Commission & Fees</h2>
                            <p className="text-sm text-gray-500">Manage platform revenue settings</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Platform Commission (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.platform_fee_percentage}
                                onChange={(e) => setSettings({ ...settings, platform_fee_percentage: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-xs text-gray-500 mt-1">Percentage deducted from restaurant order value.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tax / GST Percentage (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.tax_percentage || 0}
                                onChange={(e) => setSettings({ ...settings, tax_percentage: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-xs text-gray-500 mt-1">Tax applied to order subtotal.</p>
                        </div>
                    </div>
                </div>

                {/* Auth Settings Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Authentication</h2>
                            <p className="text-sm text-gray-500">Manage user login and verification</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Mandatory Phone Verification
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Require users to verify their phone to complete registration or ordering.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.require_phone_verification ?? true}
                                    onChange={(e) => setSettings({ ...settings, require_phone_verification: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-70 font-medium shadow-sm shadow-orange-200"
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
