'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
<<<<<<< HEAD
        let newSocket;
        const initSocket = async () => {
            if (user) {
                const { data: { session } } = await import('@/config/supabase').then(m => m.supabase.auth.getSession());
                const token = session?.access_token;

                if (token) {
                    newSocket = io('http://localhost:5000', {
                        auth: { token },
                        withCredentials: true,
                    });
=======
        if (user) {
            // Get backend URL from environment variable, removing '/api' suffix if present
            const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
            
            const newSocket = io(backendUrl, {
                withCredentials: true,
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('join', { userId: user.id, role: 'restaurant' });
            });
>>>>>>> 3bd9c2b546401d9cb689939f433135a0ba877c54

                    newSocket.on('connect', () => {
                        console.log('Socket connected:', newSocket.id);
                        newSocket.emit('restaurant:join', user.id); // Updated to match backend handler
                    });

                    newSocket.on('connect_error', (err) => {
                        console.error('Socket connection error:', err.message);
                    });

                    setSocket(newSocket);
                }
            }
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
