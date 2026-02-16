import axios from 'axios';
import { supabase } from '../config/supabase';

const api = axios.create({
    baseURL: 'http://172.20.10.8:5000/api', // Admin DB runs on local PC IP for cross-device visibility
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
