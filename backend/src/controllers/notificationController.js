const db = require('../config/db');

/**
 * Subscribe a user to push notifications
 */
const subscribe = async (req, res, next) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;

        console.log(`📡 [TRACE] Attempting to subscribe user ${userId} to Web Push...`);

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ success: false, message: 'Subscription with endpoint is required' });
        }

        const endpoint = subscription.endpoint;

        await db.query(`
            INSERT INTO push_subscriptions (user_id, subscription, endpoint)
            VALUES ($1, $2, $3)
            ON CONFLICT (endpoint) 
            DO UPDATE SET user_id = $1, subscription = $2, updated_at = NOW()
        `, [userId, JSON.stringify(subscription), endpoint]);

        console.log(`✅ [TRACE] Web Push subscription saved for user ${userId}`);
        res.json({ success: true, message: 'Subscribed successfully' });
    } catch (e) {
        console.error(`❌ [TRACE] Web Push Subscribe error:`, e.message);
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
