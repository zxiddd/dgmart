'use client';
import BottomNav from '@/components/BottomNav';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden">
                {children}
            </main>
            <div className="max-w-md mx-auto">
                <BottomNav />
            </div>
        </div>
    );
}
