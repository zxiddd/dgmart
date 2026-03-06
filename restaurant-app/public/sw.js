// DegloorMart Restaurant — Service Worker
// Handles VAPID push notifications with alarm for new orders

const CACHE_NAME = 'dm-restaurant-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    data = { notification: { title: 'DegloorMart', body: event.data?.text() } };
  }

  const notification = data.notification || data;
  const title = notification.title || '🔔 New Notification';
  const options = {
    body: notification.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: notification.tag || 'dm-restaurant',
    requireInteraction: notification.requireInteraction ?? false,
    data: notification.data || {},
    vibrate: notification.vibrate || [200, 100, 200, 100, 200, 100, 400],
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'notification_click', url });
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
