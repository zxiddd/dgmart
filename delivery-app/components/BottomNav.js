'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, TrendingUp, User, Bike } from 'lucide-react';
import { useSocket } from '@/src/context/SocketContext';
import { clsx } from 'clsx';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/active', label: 'Active', icon: Bike },
  { href: '/dashboard/orders', label: 'History', icon: ClipboardList },
  { href: '/dashboard/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { activeOrder } = useSocket();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-md bg-white/95 backdrop-blur border-t border-gray-100 shadow-2xl pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const isActive = href === '/dashboard/active';
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative',
                  active ? 'text-primary-600' : 'text-gray-400'
                )}
              >
                <div className={clsx(
                  'relative flex items-center justify-center w-9 h-9 rounded-xl transition-all',
                  active ? 'bg-primary-50 scale-110' : 'hover:bg-gray-50'
                )}>
                  <Icon className={clsx('w-5 h-5', active && 'stroke-[2.5]')} />
                  {/* Active order badge on the Active tab */}
                  {isActive && activeOrder && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className={clsx(
                  'text-[10px] font-semibold transition-all',
                  active ? 'text-primary-600' : 'text-gray-400'
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
