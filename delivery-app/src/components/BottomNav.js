'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, User, Settings, Clock, Wallet } from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: List, label: 'Orders', href: '/dashboard/orders' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard' ? 'text-primary' : 'text-gray-400'}`}>
                    <Home size={24} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link href="/dashboard/orders" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard/orders' ? 'text-primary' : 'text-gray-400'}`}>
                    <List size={24} />
                    <span className="text-[10px] font-medium">Orders</span>
                </Link>

                <Link href="/dashboard/history" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard/history' ? 'text-primary' : 'text-gray-400'}`}>
                    <Clock size={24} />
                    <span className="text-[10px] font-medium">History</span>
                </Link>

                <Link href="/dashboard/earnings" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard/earnings' ? 'text-primary' : 'text-gray-400'}`}>
                    <Wallet size={24} />
                    <span className="text-[10px] font-medium">Earnings</span>
                </Link>

                <Link href="/dashboard/profile" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard/profile' ? 'text-primary' : 'text-gray-400'}`}>
                    <User size={24} />
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
