import axios from 'axios';
import { supabase } from '../config/supabase';

const api = axios.create({
<<<<<<< HEAD
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://172.20.10.2:5000/api', // Admin DB runs on local PC IP for cross-device visibility
=======
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
>>>>>>> 3bd9c2b546401d9cb689939f433135a0ba877c54
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
