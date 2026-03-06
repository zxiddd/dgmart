'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, Megaphone, Star, Tag, Users, ShieldAlert, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminPortalPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !['admin', 'super_admin'].includes(user.role)) {
            toast.error('Access Denied: Admins Only');
            router.replace('/dashboard');
        }
    }, [user, router]);

    const adminOptions = [
        {
            title: 'Broadcast Notifications',
            description: 'Send push notifications to all users or specific roles',
            icon: Megaphone,
            color: 'text-orange-600',
            bg: 'bg-orange-100',
            href: '/admin/notifications'
        },
        {
            title: 'Featured Restaurants',
            description: 'Mark restaurants as "Popular" to show them at the top',
            icon: Star,
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
            href: '/admin/restaurants'
        },
        {
            title: 'Promo Code Management',
            description: 'Create and manage discounts and offensive offers',
            icon: Tag,
            color: 'text-green-600',
            bg: 'bg-green-100',
            href: '/admin/promos'
        },
        {
            title: 'User Management',
            description: 'View all users, delivery partners, and restaurant owners',
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            href: '/admin/dashboard' // Placeholder for now or specific user page if exists
        }
    ];

    if (!user || !['admin', 'super_admin'].includes(user.role)) return null;

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <ShieldAlert size={20} />
                    <span className="text-xs uppercase tracking-widest">Global Admin Panel</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900">Admin Portal</h1>
                <p className="text-gray-500 text-sm">Manage global platform features and notifications.</p>
            </header>

            <div className="grid gap-4">
                {adminOptions.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => router.push(option.href)}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group text-left"
                    >
                        <div className={`p-3 rounded-xl ${option.bg} ${option.color}`}>
                            <option.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{option.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
                    </button>
                ))}
            </div>

            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3 mt-4">
                <ShieldAlert className="text-red-500 shrink-0" size={20} />
                <p className="text-[10px] text-red-600 font-medium leading-relaxed">
                    Warning: You are in the Global Admin zone. Changes made here affect all users and restaurants across the platform. Handle with care.
                </p>
            </div>
        </div>
    );
}
