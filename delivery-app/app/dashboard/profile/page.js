'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import api from '@/src/lib/api';
import {
  User, Phone, Mail, Bike, Star, Package,
  TrendingUp, Shield, LogOut, ChevronRight,
  CheckCircle2, Clock, Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function ProfilePage() {
  const { user, profile, logout, fetchProfile } = useAuth();
  const { isOnline } = useSocket();
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/delivery/profile');
        setPartnerData(res.data?.partner || null);
      } catch {
        setPartnerData(profile);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const data = partnerData || profile;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out');
    } catch {
      toast.error('Logout failed');
    } finally {
      setLoggingOut(false);
    }
  };

  const initials = data?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DP';

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-extrabold text-gray-900">Profile</h1>
      </div>

      {loading ? (
        <div className="px-4 pt-4 space-y-4">
          <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* Profile Hero Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-primary-500 to-orange-600 px-5 pt-6 pb-10" />
            <div className="px-5 pb-5 -mt-8">
              <div className="flex items-end gap-4 mb-4">
                <div className="w-16 h-16 bg-white border-4 border-white rounded-2xl shadow-lg flex items-center justify-center text-primary-600 font-extrabold text-xl">
                  {initials}
                </div>
                <div className="flex-1 pb-1">
                  <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
                    {data?.name || user?.email?.split('@')[0] || 'Rider'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={clsx(
                      'w-2 h-2 rounded-full',
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                    <span className={clsx(
                      'text-xs font-bold',
                      isOnline ? 'text-green-600' : 'text-gray-400'
                    )}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification badge */}
              <div className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                data?.is_verified ? 'bg-green-50' : 'bg-amber-50'
              )}>
                {data?.is_verified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-green-700">Verified Partner</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700">Verification Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Deliveries" value={data?.total_deliveries || 0} icon="📦" />
            <StatMini label="Rating" value={`${parseFloat(data?.rating || 5).toFixed(1)}★`} icon="⭐" />
            <StatMini label="Earned" value={`₹${data?.total_earnings || 0}`} icon="💰" />
          </div>

          {/* Info Cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Personal Info</p>
            </div>
            <InfoRow icon={<Mail className="w-4 h-4 text-gray-400" />} label="Email" value={user?.email || '—'} />
            <InfoRow icon={<Phone className="w-4 h-4 text-gray-400" />} label="Phone" value={data?.phone || user?.phone || '—'} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Vehicle Info</p>
            </div>
            <InfoRow
              icon={<Bike className="w-4 h-4 text-gray-400" />}
              label="Vehicle Type"
              value={data?.vehicle_type ? capitalize(data.vehicle_type) : '—'}
            />
            <InfoRow
              icon={<Shield className="w-4 h-4 text-gray-400" />}
              label="Vehicle Number"
              value={data?.vehicle_number || '—'}
            />
            {data?.zone && (
              <InfoRow
                icon={<Package className="w-4 h-4 text-gray-400" />}
                label="Assigned Zone"
                value={data.zone}
              />
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-between px-5 py-4 bg-white border border-red-100 rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm font-bold text-red-600">
                {loggingOut ? 'Logging out...' : 'Log Out'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>

          <p className="text-center text-xs text-gray-300 pb-2">
            DegloorMart Delivery Partner v1.0
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

function StatMini({ label, value, icon }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-base font-extrabold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{label}</p>
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
