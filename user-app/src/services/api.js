import axios from 'axios';
import { supabase } from '../config/supabase';

// For Android Emulator use: 'http://10.0.2.2:5000/api'
// For Physical Device use: 'http://YOUR_PC_IP:5000/api' (Current: 172.20.10.2)
// For Web/Desktop use: 'http://localhost:5000/api'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.degloormart.in/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase auth token to every request
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (err) {
        console.log('Token error:', err);
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // If 401, token is definitely invalid/expired
        if (error.response?.status === 401) {
            console.log('🚪 Session Expired (401). Forcing logout...');
            supabase.auth.signOut();
        }

        const message = error.response?.data?.message || error.message || 'Something went wrong';
        console.log('API Error:', message);

        return Promise.reject({
            message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
);

// ============ AUTH ============
export const authAPI = {
    // Register is now handled via Supabase Auth SignUp, but if we have additional profile setup:
    register: (data) => api.post('/auth/register', data),
};

// ============ USERS ============
export const userAPI = {
    getProfile: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/me', data),
    getAddresses: () => api.get('/users/addresses'),
    addAddress: (data) => api.post('/users/addresses', data),
    updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
    deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
    getWallet: () => api.get('/users/wallet'),
    getFavorites: () => api.get('/users/favorites'),
    toggleFavorite: (restaurantId) => api.post(`/users/favorites/${restaurantId}`),
    getNotifications: () => api.get('/users/notifications'),
    markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
    markAllRead: () => api.put('/users/notifications/read-all'),
    getZones: () => api.get('/users/zones'),
};

// ============ RESTAURANTS ============
export const restaurantAPI = {
    list: (params) => api.get('/restaurants', { params }),
    getById: (id) => api.get(`/restaurants/${id}`),
};

// ============ MENU ============
export const menuAPI = {
    getCategories: (restaurantId) => api.get(`/menu/${restaurantId}/categories`),
    getItems: (restaurantId) => api.get(`/menu/${restaurantId}/items`),
};

// ============ ORDERS ============
export const orderAPI = {
    create: (data) => api.post('/orders', data),
    list: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { cancellation_reason: reason }),
    review: (id, data) => api.post(`/orders/${id}/review`, data),
    reorder: (id) => api.post(`/orders/${id}/reorder`),
    preview: (data) => api.post('/orders/preview', data),
};

// ============ PAYMENTS ============
export const paymentAPI = {
    createOrder: (data) => api.post('/payments/create-order', data),
    verify: (data) => api.post('/payments/verify', data),
    walletPay: (data) => api.post('/payments/wallet-pay', data),
    recharge: (amount) => api.post('/payments/recharge', { amount }),
};

// ============ SUPPORT ============
export const supportAPI = {
    createTicket: (data) => api.post('/support/tickets', data),
    getTickets: () => api.get('/support/tickets'),
    getTicket: (id) => api.get(`/support/tickets/${id}`),
    reply: (id, data) => api.post(`/support/tickets/${id}/reply`, data),
};

// ============ BANNERS ============
export const bannerAPI = {
    list: () => api.get('/banners'),
};

export default api;
