import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { userAPI, authAPI, setApiToken } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isRegistered: false,
    justRegistered: false,

    // Initialize auth listener
    init: async () => {
        try {
            // Check for existing session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setApiToken(session.access_token);
                set({ user: session.user, session, isAuthenticated: true, isLoading: false });
                await get().fetchProfile();
            } else {
                setApiToken(null);
                set({ user: null, session: null, isAuthenticated: false, isRegistered: false, isLoading: false });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session) {
                    setApiToken(session.access_token);
                    set({ user: session.user, session, isAuthenticated: true, isLoading: false });
                    await get().fetchProfile();
                } else {
                    setApiToken(null);
                    set({ user: null, session: null, profile: null, isAuthenticated: false, isRegistered: false, isLoading: false });
                }
            });
        } catch (error) {
            console.error('Auth init error:', error);
            set({ isLoading: false });
        }
    },

    // Sign In with Email/Password
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    // Sign Up with Email/Password
    signUp: async (email, password, metadata) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // name, phone, etc.
            }
        });
        if (error) throw error;
        return data;
    },

    // Sign Out
    signOut: async () => {
        setApiToken(null);
        await supabase.auth.signOut();
        await AsyncStorage.clear();
        set({ user: null, session: null, profile: null, isAuthenticated: false, isRegistered: false });
    },

    // Address Management
    currentAddress: null,
    addresses: [],

    fetchAddresses: async () => {
        try {
            const res = await userAPI.getAddresses();
            if (res.success && res.data.addresses) {
                set({ addresses: res.data.addresses });
                // Set default as current if none selected
                if (!get().currentAddress && res.data.addresses.length > 0) {
                    const defaultAddr = res.data.addresses.find(a => a.is_default) || res.data.addresses[0];
                    set({ currentAddress: defaultAddr });
                }
            }
        } catch (error) {
            console.log('Fetch addresses error', error);
        }
    },

    setCurrentAddress: (address) => set({ currentAddress: address }),

    // Fetch profile
    fetchProfile: async () => {
        try {
            const res = await userAPI.getProfile();
            if (res.success) {
                set({ profile: res.data.user, isRegistered: true });
                await get().fetchAddresses(); // Fetch addresses after profile
            } else {
                set({ isRegistered: false });
            }
        } catch (err) {
            console.error('Profile fetch CRITICAL error:', err);
            if (err.response) {
                console.error('Response data:', err.response.data);
                console.error('Response status:', err.response.status);
            }
            set({ isRegistered: false });
        }
    },

    // Update profile
    updateProfile: async (data) => {
        const res = await userAPI.updateProfile(data);
        if (res.success) {
            set({ profile: { ...get().profile, ...data } });
        }
        return res;
    },
}));
