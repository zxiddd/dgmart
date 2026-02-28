import axios from 'axios';
import { supabase } from '@/config/supabase';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (error) {
        console.error('Error getting session in interceptor:', error);
    }
    return config;
});

// Global 401 interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.error('API Error: 401 Unauthorized - redirecting to login');
            try {
                await supabase.auth.signOut();
            } catch (signOutError) {
                console.error('Error signing out on 401:', signOutError);
            }
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
