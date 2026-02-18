'use client';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search, User, Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-40">
            <div className="md:hidden">
                <button onClick={onToggleSidebar} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Menu size={24} />
                </button>
            </div>

            <div className="hidden md:flex items-center gap-4 flex-1 max-w-lg ml-64">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search orders, users..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-dark">Admin User</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}
