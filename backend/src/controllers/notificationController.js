const db = require('../config/db');

/**
 * Subscribe a user to push notifications
 */
const subscribe = async (req, res, next) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;

        if (!subscription) {
            return res.status(400).json({ success: false, message: 'Subscription is required' });
        }

        // Store or update subscription
        // We use the endpoint as a unique identifier for the subscription
        const endpoint = subscription.endpoint;

        await db.query(`
            INSERT INTO push_subscriptions (user_id, subscription, endpoint)
            VALUES ($1, $2, $3)
            ON CONFLICT (endpoint) 
            DO UPDATE SET user_id = $1, subscription = $2, updated_at = NOW()
        `, [userId, JSON.stringify(subscription), endpoint]);

        res.json({ success: true, message: 'Subscribed successfully' });
    } catch (e) {
        next(e);
    }
};

/**
 * Unsubscribe a user (optional)
 */
const unsubscribe = async (req, res, next) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.id;

        await db.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);

        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (e) {
        next(e);
    }
};

module.exports = {
    subscribe,
    unsubscribe
};
