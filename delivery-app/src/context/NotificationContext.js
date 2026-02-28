'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [permission, setPermission] = useState('default');
    const [subscription, setSubscription] = useState(null);

    const subscribeUser = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            let sub = await registration.pushManager.getSubscription();

            if (!sub) {
                const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicKey) {
                    console.error('VAPID public key not found');
                    return;
                }

                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                });
            }

            setSubscription(sub);

            // Send to backend
            if (user) {
                await api.post('/notifications/subscribe', { subscription: sub });
                console.log('Push subscription synced with backend');
            }

            return sub;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            // toast.error('Failed to enable push notifications');
        }
    }, [user]);

    const requestPermission = async () => {
        if (!('Notification' in window)) return;

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            await subscribeUser();
            toast.success('🔔 Notifications enabled!');
        } else {
            toast.error('Notifications blocked. You might miss new orders.');
        }
    };

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        if (Notification.permission === 'granted' && user) {
            subscribeUser();
        }
    }, [user, subscribeUser]);

    return (
        <NotificationContext.Provider value={{ permission, requestPermission, subscription }}>
            {children}
        </NotificationContext.Provider>
    );
};
