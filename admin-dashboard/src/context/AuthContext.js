'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            // Only update user from session if we don't already have the fake bypass user loaded.
            if (session) {
                setUser(session.user);
            }
            setLoading(false);
        };
        checkSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser(session.user);
            }
            setLoading(false);
            
            // if (!session) {
            //     router.push('/');
            // }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const login = async (email, password) => {
        if (email === 'admin@degloormart.com' && password === 'degloormart@123') {
            const fakeUser = {
                id: 'hardcoded-admin-bypass-id',
                email: 'admin@degloormart.com',
                role: 'super_admin'
            };
            setUser(fakeUser);
            return fakeUser;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
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
