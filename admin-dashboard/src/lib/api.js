import axios from 'axios';
import { supabase } from '../config/supabase';

const getBaseURL = () => {
    let url = process.env.NEXT_PUBLIC_API_URL;

    if (!url && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost') {
            url = 'http://localhost:5000/api';
        } else {
            url = 'http://172.20.10.2:5000/api';
        }
    }

    if (url) {
        // Remove trailing slash and ensure /api suffix
        url = url.replace(/\/$/, '');
        if (!url.endsWith('/api')) {
            url = `${url}/api`;
        }
        return url;
    }

    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export default api;
