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
        if (user) {
            const newSocket = io('http://localhost:5000', {
                withCredentials: true,
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Join restaurant room if needed. 
                // Typically backend joins socket to room based on auth user id or we emit 'join'.
                // Backend socketHandler.js: socket.join(`user:${userId}`) is common.
                // Let's assume standard behavior or emit a join event if needed.
                newSocket.emit('join', { userId: user.id, role: 'restaurant' });
            });

            setSocket(newSocket);

            return () => newSocket.disconnect();
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
