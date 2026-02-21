import axios from 'axios';
import { supabase } from '../config/supabase';

const getBaseURL = () => {
    let url = process.env.NEXT_PUBLIC_API_URL;

    if (!url && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost') {
            url = 'http://localhost:5000/api';
        } else {
            // Render environment should always have NEXT_PUBLIC_API_URL
            console.warn('⚠️ NEXT_PUBLIC_API_URL is missing in browser! Falling back to healthy health check URL.');
            url = 'https://api.degloormart.in/api';
        }
    }

    if (url) {
        url = url.replace(/\/$/, '');
        if (!url.endsWith('/api')) {
            url = `${url}/api`;
        }
        return `${url}/`;
    }

    return 'https://api.degloormart.in/api/';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 60000, // 60 seconds (conservative for Render cold starts)
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    console.log('📡 [API] Sending request to:', config.url);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Response interceptor to handle session timeouts
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('🚪 Admin Session Expired. Redirecting to login...');
            supabase.auth.signOut().then(() => {
                if (typeof window !== 'undefined') window.location.href = '/';
            });
        }
        return Promise.reject(error);
    }
);

export default api;
