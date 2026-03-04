'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.degloormart.in';

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
            }
            return;
        }

        const initSocket = async () => {
            // Get JWT from Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) return;

            const newSocket = io(BACKEND_URL, {
                auth: { token },
                // Use polling first as fallback for mobile networks, then upgrade.
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: 15,
                reconnectionDelay: 2000,
                withCredentials: true,
            });

            newSocket.on('connect', () => setConnected(true));
            newSocket.on('disconnect', () => setConnected(false));
            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });

            setSocket(newSocket);
        };

        initSocket();

        return () => {
            if (socket) socket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

// Fixed supabase import for the context
import { supabase } from '@/lib/supabase';

export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
