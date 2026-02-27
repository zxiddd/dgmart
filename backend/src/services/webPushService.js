const webpush = require('web-push');
const db = require('../config/db');

// Set VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@degloormart.in',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a user's registered subscriptions
 */
const sendWebPush = async (userId, title, body, data = {}) => {
    try {
        console.log(`Searching subscriptions for user: ${userId}`);
        const { rows } = await db.query('SELECT subscription FROM push_subscriptions WHERE user_id = $1', [userId]);

        if (rows.length === 0) {
            console.log(`No push subscriptions found for user: ${userId}`);
            return;
        }

        const payload = JSON.stringify({
            notification: {
                title,
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                data: {
                    ...data,
                    url: data.url || '/dashboard'
                }
            }
        });

        const promises = rows.map(row =>
            webpush.sendNotification(row.subscription, payload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription expired or no longer valid, delete it
                        console.log('Expired subscription found, deleting...');
                        return db.query('DELETE FROM push_subscriptions WHERE subscription = $1', [JSON.stringify(row.subscription)]);
                    }
                    console.error('Error sending web push:', err.message);
                })
        );

        await Promise.all(promises);
        console.log(`Web push notifications sent to ${rows.length} devices for user: ${userId}`);
    } catch (err) {
        console.error('Failed to send web push:', err.message);
    }
};

module.exports = { sendWebPush };
