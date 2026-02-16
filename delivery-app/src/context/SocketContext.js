'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext({});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io('http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Socket Connected:', newSocket.id);
            // Join user-specific room
            newSocket.emit('join', `user_${user.id}`);
        });

        newSocket.on('new_assignment', (data) => {
            console.log('New Delivery Assigned!', data);
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-bold">New Delivery Assigned! 📦</span>
                    <span className="text-sm">{data.restaurant_name} → {data.delivery_address.substring(0, 30)}...</span>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            window.location.reload(); // Simple refresh to show new state
                        }}
                        className="bg-primary text-white px-3 py-1 rounded-lg text-sm font-bold"
                    >
                        View Details
                    </button>
                </div>
            ), { duration: 10000 });

            setNotifications(prev => [data, ...prev]);
        });

        newSocket.on('order_status_update', (data) => {
            console.log('Order Status Updated:', data);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, notifications }}>
            {children}
        </SocketContext.Provider>
    );
};
