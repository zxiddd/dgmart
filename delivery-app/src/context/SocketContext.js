'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { supabase } from '@/config/supabase';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        let newSocket;
        const initSocket = async () => {
            if (user) {
                // Get session for token
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                if (token) {
                    // Get backend URL from environment variable, removing '/api' suffix if present
                    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'https://api.degloormart.in';

                    newSocket = io(backendUrl, {
                        auth: { token },
                        // Start with polling so mobile networks that block raw WebSocket
                        // connections still work, then upgrade to websocket when available.
                        transports: ['polling', 'websocket'],
                        withCredentials: true,
                        reconnectionAttempts: 5,
                        reconnectionDelay: 2000,
                    });

                    newSocket.on('connect', () => {
                        console.log('Socket connected:', newSocket.id);
                        newSocket.emit('join', { userId: user.id, role: 'delivery' });
                        // The backend socketHandler.js also handles joining rooms based on userId
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
