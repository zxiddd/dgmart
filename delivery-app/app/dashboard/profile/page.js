'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { User, Shield, FileText, LogOut, ChevronRight, Bike, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/delivery/profile');
                if (res.data.success) {
                    setProfile(res.data.data.partner);
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                // toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const menuItems = [
        { icon: User, label: 'Personal Details', value: user?.email },
        { icon: Bike, label: 'Vehicle Information', value: profile?.vehicle_number },
        { icon: FileText, label: 'Documents & KYC', value: profile?.is_verified ? 'Verified' : 'Pending' },
        { icon: Shield, label: 'Safety Settings' },
    ];

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] bg-gray-50">
            <div className="bg-primary pt-10 pb-6 px-6 text-white rounded-b-3xl shadow-lg shadow-orange-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/50">
                        {user?.email?.[0].toUpperCase() || 'P'}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{profile?.name || user?.email?.split('@')[0] || 'Partner'}</h1>
                        <p className="text-sm opacity-90">{profile?.phone || user?.phone || 'No Phone'}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                                <span className="text-xs font-medium">ID: {profile?.id?.slice(0, 6) || '---'}</span>
                            </div>
                            {profile?.rating && (
                                <div className="flex items-center gap-1 bg-yellow-400 text-black px-2 py-0.5 rounded-full w-fit font-bold text-xs">
                                    <Star size={10} fill="black" /> {profile.rating}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Icon size={20} className="text-primary" />
                                    <div className="text-left">
                                        <span className="font-medium block">{item.label}</span>
                                        {item.value && <span className="text-xs text-gray-400">{item.value}</span>}
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400" />
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">Version 1.0.0</p>
            </div>
        </div>
    );
}
