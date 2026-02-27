self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.notification.body,
            icon: data.notification.icon || '/icons/icon-192x192.png',
            badge: data.notification.badge || '/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.notification.data?.url || '/dashboard',
                assignment_id: data.notification.data?.assignment_id
            },
            actions: [
                { action: 'open', title: 'View Order' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.notification.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            const url = event.notification.data.url;

            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
