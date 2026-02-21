/**
 * Socket.io singleton for the React Native user app.
 * Creates one persistent connection per session, auto-reconnects.
 */
import { io } from 'socket.io-client';
import { supabase } from '../config/supabase';

const BACKEND_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://76.13.246.9/api')
    .replace(/\/api\/?$/, '');

let socket = null;
let connecting = false;

export const getSocket = async () => {
    if (socket?.connected) return socket;
    if (connecting) return null;

    try {
        connecting = true;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { connecting = false; return null; }

        socket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 3000,
        });

        socket.on('connect', () => {
            console.log('📡 User socket connected:', socket.id);
            connecting = false;
        });

        socket.on('connect_error', (err) => {
            console.log('Socket connect error:', err.message);
            connecting = false;
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return socket;
    } catch (err) {
        connecting = false;
        console.log('Socket init error:', err.message);
        return null;
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const subscribeToOrder = async (orderId, onUpdate) => {
    const s = await getSocket();
    if (!s) return () => { };

    // Join the order room to get targeted events
    s.emit('order:subscribe', orderId);

    const handler = (update) => {
        if (update.order_id === orderId || update.id === orderId) {
            onUpdate(update);
        }
    };

    s.on('order_update', handler);
    s.on('order_status_updated', handler);

    // Return cleanup
    return () => {
        s.emit('order:unsubscribe', orderId);
        s.off('order_update', handler);
        s.off('order_status_updated', handler);
    };
};
