'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '@/src/config/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, session } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user || !session) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const initSocket = async () => {
      const token = session.access_token;
      if (!token) return;

      let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api';
      backendUrl = backendUrl.replace(/\/api\/?$/, '');

      const newSocket = io(backendUrl, {
        auth: { token },
        transports: ['websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket error:', err.message);
        setIsConnected(false);
      });

      newSocket.on('reconnect', () => {
        setIsConnected(true);
        if (isOnline) newSocket.emit('delivery:join');
      });

      // New available order from backend broadcast
      newSocket.on('new_available_order', (order) => {
        setAvailableOrders((prev) => {
          const exists = prev.find((o) => o.order_id === order.order_id);
          if (exists) return prev;
          return [order, ...prev];
        });
        toast(
          `New order from ${order.restaurant_name || 'a restaurant'}! ₹${order.delivery_fee || ''}`,
          {
            icon: '🛵',
            duration: 5000,
            style: { background: '#1a1a2e', color: '#fff', borderRadius: '12px' },
          }
        );
      });

      // Another rider claimed this order — remove it
      newSocket.on('order_claimed', ({ order_id }) => {
        setAvailableOrders((prev) => prev.filter((o) => o.order_id !== order_id));
      });

      // Active order status update
      newSocket.on('order_status_update', (data) => {
        setActiveOrder((prev) => (prev ? { ...prev, ...data } : prev));
      });

      // Assignment status update
      newSocket.on('assignment_status_update', (data) => {
        setActiveOrder((prev) => (prev ? { ...prev, ...data } : prev));
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    };

    initSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const goOnline = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('delivery:join');
      setIsOnline(true);
      fetchAvailableOrders();
    }
  }, []);

  const fetchAvailableOrders = useCallback(async () => {
    try {
      let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api';
      const res = await fetch(`${backendUrl}/delivery/available-orders`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAvailableOrders(data.data.orders || data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch available orders:', err);
    }
  }, [session]);

  const goOffline = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('delivery:leave');
      setIsOnline(false);
      setAvailableOrders([]);
    }
  }, []);

  const claimOrder = useCallback((orderId) => {
    setAvailableOrders((prev) => prev.filter((o) => o.order_id !== orderId));
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        availableOrders,
        setAvailableOrders,
        activeOrder,
        setActiveOrder,
        isOnline,
        setIsOnline,
        goOnline,
        goOffline,
        claimOrder,
        fetchAvailableOrders,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
