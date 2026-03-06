'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { useRouter } from 'next/navigation';
import { registerPushNotifications } from '@/lib/pushNotifications';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setSession(session);
            setLoading(false);
            if (session?.access_token) {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api';
                registerPushNotifications(apiBase, session.access_token).catch(() => {});
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setSession(session);
            setLoading(false);
            if (!session) {
                router.push('/');
            } else if (session?.access_token) {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api';
                registerPushNotifications(apiBase, session.access_token).catch(() => {});
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, session, login, logout, loading }}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
