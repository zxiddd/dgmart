'use client';
import { useEffect } from 'react';
import { registerPushNotifications } from '@/src/lib/pushNotifications';

export default function PushNotificationRegistrar({ accessToken }) {
  useEffect(() => {
    if (!accessToken) return;
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.degloormart.in/api');
    registerPushNotifications(apiBase, accessToken).catch(console.error);
  }, [accessToken]);

  return null;
}
