'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/config/supabase';
import { useRouter } from 'next/navigation';
import api from '@/src/lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const res = await api.get('/delivery/profile');
      // API returns: { success: true, data: { partner: {...}, today_earnings: 0 } }
      const partner = res.data?.data?.partner || res.data?.partner || null;
      setProfile(partner);
      return partner;
    } catch {
      return null;
    }
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchProfile();
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // Avoid redundant work if session hasn't actually changed meaningfully for profile
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || !profile) {
          await fetchProfile();
        }
      } else {
        setProfile(null);
        if (event === 'SIGNED_OUT') router.push('/');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const partnerProfile = await fetchProfile();
    if (!partnerProfile) {
      throw new Error('NO_PROFILE');
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, login, logout, loading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
