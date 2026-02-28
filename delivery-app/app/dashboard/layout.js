'use client';
import BottomNav from '@/components/BottomNav';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Max time to wait for auth before assuming no session and redirecting to login.
// On slow mobile networks auth can stall indefinitely without this guard.
const AUTH_TIMEOUT_MS = 8000;

export default function DashboardLayout({ children }) {
    const [mounted, setMounted] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Safety timeout — if loading hasn't resolved in AUTH_TIMEOUT_MS, treat as
        // unauthenticated so the screen doesn't spin forever on mobile.
        const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Enforce auth: redirect if loading is done (or timed out) and no user
        if (mounted && (!loading || timedOut) && !user) {
            console.log('Dashboard Layout: No user found, redirecting to login');
            router.push('/');
        }
    }, [user, loading, mounted, timedOut, router]);

    // Prevent rendering until we are absolutely certain about auth state
    if (!mounted || (loading && !timedOut)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium animate-pulse">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Redirecting to login...</p>
                </div>
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
