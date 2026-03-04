'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white shadow-2xl relative flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
