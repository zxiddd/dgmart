'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [restaurantId, setRestaurantId] = useState(null);
    const { user } = useAuth();
    // Keep a ref to avoid stale closures in event handlers
    const socketRef = useRef(null);

    // Fetch the restaurant ID once user is known
    useEffect(() => {
        if (!user) { setRestaurantId(null); return; }
        api.get('/orders/restaurant/me')
            .then(res => {
                // The restaurant id can come from the restaurant profile endpoint
            })
            .catch(() => { });

        api.get('/restaurants/me')
            .then(res => {
                if (res?.data?.restaurant?.id) {
                    setRestaurantId(res.data.restaurant.id);
                }
            })
            .catch(() => {
                // Fallback: try the dashboard endpoint
                api.get('/restaurants/my')
                    .then(r => {
                        const id = r?.data?.data?.id || r?.data?.id;
                        if (id) setRestaurantId(id);
                    })
                    .catch(() => { });
            });
    }, [user]);

    useEffect(() => {
        let newSocket;
        const initSocket = async () => {
            if (!user) return;
            const { supabase } = await import('@/config/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dgmart-plr3.onrender.com/api';
            backendUrl = backendUrl.replace(/\/api\/?$/, '');

            newSocket = io(backendUrl, {
                auth: { token },
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
            });

            newSocket.on('connect', () => {
                console.log('🔌 Restaurant socket connected:', newSocket.id);
                // Join restaurant room with the real restaurant DB id
                if (restaurantId) {
                    newSocket.emit('restaurant:join', restaurantId);
                }
            });

            newSocket.on('reconnect', () => {
                if (restaurantId) {
                    newSocket.emit('restaurant:join', restaurantId);
                }
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket error:', err.message);
            });

            socketRef.current = newSocket;
            setSocket(newSocket);
        };

        initSocket();

        return () => {
            if (newSocket) newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Re-join restaurant room when restaurantId becomes available
    useEffect(() => {
        if (socketRef.current?.connected && restaurantId) {
            socketRef.current.emit('restaurant:join', restaurantId);
        }
    }, [restaurantId]);

    return (
        <SocketContext.Provider value={{ socket, restaurantId }}>
            {children}
        </SocketContext.Provider>
    );
};
