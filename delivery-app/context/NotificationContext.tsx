'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useSocket } from './SocketContext';

interface NotificationContextType {
    playAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { socket } = useSocket();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAlert = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
        }
    };

    useEffect(() => {
        // Hidden audio element for alerts
        const audio = new Audio('/alert.mp3');
        audio.load();
        audioRef.current = audio;

        if (!socket) return;

        socket.on('newOrder', () => {
            playAlert();
        });

        return () => {
            socket.off('newOrder');
        };
    }, [socket]);

    return (
        <NotificationContext.Provider value={{ playAlert }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
