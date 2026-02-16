'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, ShoppingBag, Truck, Tag, Settings, LogOut, MessageSquare, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: ShoppingBag, label: 'Orders', href: '/dashboard/orders' },
    { icon: Store, label: 'Restaurants', href: '/dashboard/restaurants' },
    { icon: Users, label: 'Users', href: '/dashboard/users' },
    { icon: Truck, label: 'Delivery', href: '/dashboard/delivery' },
    { icon: MapPin, label: 'Locations', href: '/dashboard/locations' },
    { icon: Tag, label: 'Promos', href: '/dashboard/promos' },
    { icon: MessageSquare, label: 'Support', href: '/dashboard/support' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 hidden md:flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-primary">Degloor<span className="text-dark">Mart</span></h1>
                <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-dark'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
