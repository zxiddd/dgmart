import axios from 'axios';
import { supabase } from '@/src/config/supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
