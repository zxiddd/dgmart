'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchProfile = async (sessionUser) => {
        try {
            const { data: userData, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', sessionUser.id)
                .single();

            if (error) {
                console.warn('Profile fetch error (might be expected for new users):', error.message);
                return { ...sessionUser, role: 'customer' };
            }
            return { ...sessionUser, role: userData?.role || 'customer' };
        } catch (err) {
            console.error('Error fetching profile:', err);
            return { ...sessionUser, role: 'customer' };
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.onerror = function (message, source, lineno, colno, error) {
                console.error("Global Error Caught:", message, source, lineno, colno, error);
            };
        }

        const initialize = async () => {
            console.log('App Load: Initializing Auth State...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('App Load Auth State:', session ? `User logged in as ${session.user.email}` : 'No active session');
                if (session?.user) {
                    const enrichedUser = await fetchProfile(session.user);
                    setUser(enrichedUser);
                }
            } catch (err) {
                console.error('App Load Auth Error:', err);
            } finally {
                setLoading(false);
            }
        };
        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event, session?.user?.email);
            if (session?.user) {
                const enrichedUser = await fetchProfile(session.user);
                setUser(enrichedUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const signUp = async (email, password, metadata) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            }
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, signUp, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
