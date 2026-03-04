'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500/50 font-mono">
          Syncing Neural Link...
        </p>
      </div>
    </div>
  );
}
