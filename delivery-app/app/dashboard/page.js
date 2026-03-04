'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import api from '@/src/lib/api';
import {
  MapPin, Package, Star, Wifi, WifiOff,
  ChevronRight, Clock, Bike, RefreshCw, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function DashboardPage() {
  const { profile, fetchProfile } = useAuth();
  const {
    availableOrders, activeOrder, isOnline, setIsOnline,
    goOnline, goOffline, claimOrder, setActiveOrder,
  } = useSocket();
  const router = useRouter();

  const [todayStats, setTodayStats] = useState({ earnings: 0, deliveries: 0, rating: 0 });
  const [toggling, setToggling] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const pollRef = useRef(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/delivery/earnings?period=today');
      const data = res.data;
      setTodayStats({
        earnings: data?.today_earnings || data?.earnings || 0,
        deliveries: data?.today_deliveries || data?.total_deliveries || 0,
        rating: data?.rating || profile?.rating || 5.0,
      });
    } catch {
      setTodayStats({ earnings: 0, deliveries: 0, rating: profile?.rating || 5.0 });
    }
  }, [profile]);

  const loadOnlineStatus = useCallback(async () => {
    try {
      const res = await api.get('/delivery/profile');
      const p = res.data?.partner;
      if (p) setIsOnline(p.is_online || false);
    } catch {}
  }, [setIsOnline]);

  useEffect(() => {
    loadStats();
    loadOnlineStatus();
  }, []);

  // Poll every 30s while unverified to auto-detect admin verification
  useEffect(() => {
    if (profile?.is_verified) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const updated = await fetchProfile();
      if (updated?.is_verified) {
        clearInterval(pollRef.current);
        toast.success('Your account has been verified! You can now go online. ✅', { duration: 5000 });
      }
    }, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [profile?.is_verified]);

  // Also refresh profile when user comes back to tab
  useEffect(() => {
    const onFocus = async () => {
      const wasVerified = profile?.is_verified;
      const updated = await fetchProfile();
      if (!wasVerified && updated?.is_verified) {
        toast.success('Your account has been verified! You can now go online. ✅', { duration: 5000 });
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [profile?.is_verified]);

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      const updated = await fetchProfile();
      if (updated?.is_verified) {
        toast.success('Your account is now verified! ✅');
      } else {
        toast('Still pending. Our team will verify you shortly.', { icon: '⏳' });
      }
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const res = await api.put('/delivery/toggle-online');
      const newStatus = res.data?.is_online ?? res.data?.data?.is_online;
      setIsOnline(newStatus);
      if (newStatus) {
        goOnline();
        toast.success('You are now ONLINE 🟢 Ready to deliver!');
      } else {
        goOffline();
        toast('You are now OFFLINE', { icon: '🔴' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  const handleAcceptOrder = async (order) => {
    if (claimingId) return;
    setClaimingId(order.order_id);
    try {
      const res = await api.post(`/delivery/orders/${order.order_id}/claim`);
      claimOrder(order.order_id);
      setActiveOrder({
        ...order,
        assignment_id: res.data?.assignment?.id || res.data?.id,
        status: 'accepted_by_driver',
        ...(res.data?.order || {}),
        ...(res.data?.assignment || {}),
      });
      toast.success('Order accepted! 🎉');
      router.push('/dashboard/active');
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Order already taken by another rider!');
        claimOrder(order.order_id);
      } else {
        toast.error(err.response?.data?.message || 'Could not accept order');
      }
    } finally {
      setClaimingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), fetchProfile()]);
    setTimeout(() => setRefreshing(false), 600);
  };

  const isVerified = profile?.is_verified;

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Good day,</p>
          <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
            {profile?.name || 'Rider'} 👋
          </h1>
        </div>
        <button onClick={handleRefresh} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
          <RefreshCw className={clsx('w-4 h-4 text-gray-500', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Verification pending — tappable */}
      {!isVerified && (
        <button
          onClick={handleCheckVerification}
          disabled={checkingVerification}
          className="mx-5 mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 w-[calc(100%-40px)] active:scale-[0.98] transition-transform text-left"
        >
          <span className="text-lg flex-shrink-0">{checkingVerification ? '🔄' : '⏳'}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Verification Pending</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {checkingVerification ? 'Checking...' : 'Tap to check your verification status'}
            </p>
          </div>
          <RefreshCw className={clsx('w-4 h-4 text-amber-500 flex-shrink-0', checkingVerification && 'animate-spin')} />
        </button>
      )}

      {/* Verified badge */}
      {isVerified && (
        <div className="mx-5 mb-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-xs font-bold text-green-700">Verified Partner — You can go online!</span>
        </div>
      )}

      <div className="mx-5 mb-5">
        <OnlineToggle isOnline={isOnline} onToggle={handleToggleOnline} loading={toggling} disabled={!isVerified} />
      </div>

      <div className="grid grid-cols-3 gap-3 mx-5 mb-5">
        <StatCard label="Today's Earnings" value={`₹${todayStats.earnings}`} icon={<span className="text-sm font-black">₹</span>} color="orange" />
        <StatCard label="Deliveries" value={todayStats.deliveries} icon={<Package className="w-4 h-4" />} color="blue" />
        <StatCard label="Rating" value={parseFloat(todayStats.rating || 5).toFixed(1)} icon={<Star className="w-4 h-4" />} color="yellow" />
      </div>

      {activeOrder && (
        <div className="mx-5 mb-5">
          <ActiveOrderBanner order={activeOrder} onContinue={() => router.push('/dashboard/active')} />
        </div>
      )}

      <div className="flex-1 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-gray-900">
            {isOnline ? 'Available Orders' : 'Go Online to See Orders'}
          </h2>
          {isOnline && availableOrders.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 font-bold px-2.5 py-1 rounded-full">
              {availableOrders.length} nearby
            </span>
          )}
        </div>

        {!isOnline ? (
          <OfflinePlaceholder onGoOnline={handleToggleOnline} disabled={!isVerified || toggling} />
        ) : availableOrders.length === 0 ? (
          <WaitingForOrders />
        ) : (
          <div className="space-y-3 pb-4">
            {availableOrders.map((order) => (
              <AvailableOrderCard key={order.order_id} order={order} onAccept={() => handleAcceptOrder(order)} loading={claimingId === order.order_id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OnlineToggle({ isOnline, onToggle, loading, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading || disabled}
      className={clsx(
        'w-full py-5 px-6 rounded-2xl flex items-center justify-between transition-all duration-300 active:scale-[0.98]',
        isOnline ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-200' : 'bg-gradient-to-r from-gray-700 to-gray-800 shadow-lg shadow-gray-200',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', isOnline ? 'bg-white/20' : 'bg-white/10')}>
            {isOnline ? <Wifi className="w-6 h-6 text-white" /> : <WifiOff className="w-6 h-6 text-white/70" />}
          </div>
          {isOnline && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-green-500 animate-pulse-slow" />}
        </div>
        <div className="text-left">
          <p className="text-white font-extrabold text-lg leading-tight">
            {loading ? 'Updating...' : isOnline ? 'ONLINE' : 'OFFLINE'}
          </p>
          <p className={clsx('text-xs font-medium mt-0.5', isOnline ? 'text-green-100' : 'text-gray-400')}>
            {disabled ? 'Verification required to go online' : isOnline ? 'Receiving order requests' : 'Tap to go online & earn'}
          </p>
        </div>
      </div>
      <div className={clsx('w-14 h-7 rounded-full flex items-center px-1 transition-all duration-300', isOnline ? 'bg-white/30 justify-end' : 'bg-white/10 justify-start')}>
        <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
      </div>
    </button>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorMap = { orange: 'bg-orange-50 text-orange-600', blue: 'bg-blue-50 text-blue-600', yellow: 'bg-yellow-50 text-yellow-600' };
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
      <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', colorMap[color])}>{icon}</div>
      <p className="text-lg font-extrabold text-gray-900 leading-tight">{value}</p>
      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function ActiveOrderBanner({ order, onContinue }) {
  return (
    <button onClick={onContinue} className="w-full bg-gradient-to-r from-primary-500 to-orange-600 rounded-2xl p-4 text-left shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Bike className="w-5 h-5 text-white" /></div>
          <div>
            <p className="text-white text-xs font-semibold opacity-80">Active Delivery</p>
            <p className="text-white font-extrabold text-sm">{order.restaurant_name || 'Restaurant'}</p>
            <p className="text-orange-100 text-xs mt-0.5">{order.customer_name || 'Customer'} · #{order.order_number || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-xs font-bold px-2 py-1 bg-white/20 rounded-lg">{statusLabel(order.status)}</span>
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>
    </button>
  );
}

function AvailableOrderCard({ order, onAccept, loading }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-extrabold text-gray-900">{order.restaurant_name || 'Restaurant'}</span>
            {order.distance_km && <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">{parseFloat(order.distance_km).toFixed(1)} km</span>}
          </div>
          <p className="text-xs text-gray-400 font-medium">Order #{order.order_number}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Your earnings</p>
          <p className="text-base font-extrabold text-green-600">₹{order.delivery_fee || order.earning || '40'}</p>
        </div>
      </div>
      {order.delivery_address && (
        <div className="flex items-start gap-2 mb-3 bg-gray-50 rounded-xl p-2.5">
          <MapPin className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600 font-medium leading-tight">{order.delivery_address}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-600">₹{order.total || order.order_total || '—'} order</span>
          {order.estimated_time && <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-400">{order.estimated_time} min</span></div>}
        </div>
        <button onClick={onAccept} disabled={loading} className={clsx('px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95', loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-500 shadow-md shadow-orange-200')}>
          {loading ? '...' : 'ACCEPT →'}
        </button>
      </div>
    </div>
  );
}

function OfflinePlaceholder({ onGoOnline, disabled }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4"><WifiOff className="w-9 h-9 text-gray-400" /></div>
      <h3 className="text-lg font-extrabold text-gray-700 mb-1">You're Offline</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-[220px]">Go online to start receiving delivery requests near you</p>
      <button onClick={onGoOnline} disabled={disabled} className="px-8 py-3.5 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-transform disabled:opacity-50">GO ONLINE 🟢</button>
    </div>
  );
}

function WaitingForOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-4 relative">
        <Bike className="w-9 h-9 text-green-500" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
      </div>
      <h3 className="text-lg font-extrabold text-gray-700 mb-1">You're Live! 🟢</h3>
      <p className="text-sm text-gray-400 max-w-[240px]">Waiting for orders... New requests will appear here automatically.</p>
    </div>
  );
}

function statusLabel(status) {
  const map = { accepted_by_driver: 'Accepted', picked_up: 'Picked Up', out_for_delivery: 'On Way', delivered: 'Delivered' };
  return map[status] || status || 'In Progress';
}
