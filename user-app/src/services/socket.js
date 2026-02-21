import io from 'socket.io-client';
import { supabase } from '../config/supabase';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://172.20.10.2:5000'; // Initializing with same IP as API

let socket = null;

export const socketService = {
    connect: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (socket?.connected) return socket;

            socket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket'],
                autoConnect: true,
            });

            socket.on('connect', () => {
                console.log('Socket connected:', socket.id);
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socket.on('connect_error', (err) => {
                console.log('Socket connect error:', err);
            });

            return socket;
        } catch (error) {
            console.error('Socket connection error:', error);
        }
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    getSocket: () => socket,

    // Helper to subscribe to order updates
    subscribeToOrder: (orderId) => {
        if (socket) socket.emit('order:subscribe', orderId);
    },

    unsubscribeFromOrder: (orderId) => {
        if (socket) socket.emit('order:unsubscribe', orderId);
    }
};
