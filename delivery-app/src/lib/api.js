import axios from 'axios';
import { supabase } from '@/src/config/supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let cachedToken = null;

api.interceptors.request.use(async (config) => {
  // Try to use cached token first to avoid Supabase lock competition
  if (!cachedToken) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    cachedToken = session?.access_token;
  }
  
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      cachedToken = null;
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
