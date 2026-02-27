'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        } else {
            console.log('Push notifications not supported in this browser.');
            setLoading(false);
        }
    }, []);

    async function checkSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (err) {
            console.error('Error checking subscription:', err);
        } finally {
            setLoading(false);
        }
    }

    async function subscribeToPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            await api.post('/push-subscribe', { subscription: sub, device_type: 'web' });
            setSubscription(sub);
            toast.success('Notifications enabled!');
        } catch (err) {
            console.error('Subscription failed:', err);
            toast.error('Failed to enable notifications. Please check site permissions.');
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribeFromPush() {
        setLoading(true);
        try {
            await subscription.unsubscribe();
            // Optional: Notify backend to remove the subscription
            setSubscription(null);
            toast.success('Notifications disabled');
        } catch (err) {
            console.error('Failed to unsubscribe:', err);
        } finally {
            setLoading(false);
        }
    }

    if (!isSupported) return null;

    return (
        <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white/50" />
            ) : subscription ? (
                <button
                    onClick={unsubscribeFromPush}
                    className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                    <Bell className="w-4 h-4" />
                    Notifications Active
                </button>
            ) : (
                <button
                    onClick={subscribeToPush}
                    className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                    <BellOff className="w-4 h-4" />
                    Enable Notifications
                </button>
            )}
        </div>
    );
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
