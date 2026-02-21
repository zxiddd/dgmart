'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();
    const socketRef = useRef(null);

    useEffect(() => {
        let newSocket;

        const initSocket = async () => {
            if (!user) return;

            const { supabase } = await import('../config/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://76.13.246.9/api';
            backendUrl = backendUrl.replace(/\/api\/?$/, '');

            newSocket = io(backendUrl, {
                auth: { token },
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 15,
                reconnectionDelay: 2000,
            });

            newSocket.on('connect', () => {
                console.log('🔌 Admin socket connected:', newSocket.id);
                // Join the admin room so we get all live events
                newSocket.emit('admin:join');
            });

            newSocket.on('reconnect', () => {
                newSocket.emit('admin:join');
            });

            newSocket.on('connect_error', (err) => {
                console.error('Admin socket error:', err.message);
            });

            socketRef.current = newSocket;
            setSocket(newSocket);
        };

        initSocket();

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
