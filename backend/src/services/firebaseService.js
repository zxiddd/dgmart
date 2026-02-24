const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
    const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

/**
 * Verify a Firebase ID token and return the decoded token payload
 */
const verifyFirebaseToken = async (idToken) => {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
};

/**
 * Send a push notification to a single FCM token
 */
const sendPushNotification = async ({ token, title, body, data = {} }) => {
    if (!token) return;
    try {
        await admin.messaging().send({
            token,
            notification: { title, body },
            data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
            android: {
                priority: 'high',
                notification: { sound: 'default', channelId: 'degloormart_orders' },
            },
        });
    } catch (err) {
        console.warn(`FCM send failed for token: ${token}`, err.message);
    }
};

/**
 * Send a push notification to multiple FCM tokens
 */
const sendPushToMany = async ({ tokens, title, body, data = {} }) => {
    if (!tokens || tokens.length === 0) return;
    const validTokens = tokens.filter(Boolean);
    if (validTokens.length === 0) return;

    await Promise.allSettled(
        validTokens.map(token => sendPushNotification({ token, title, body, data }))
    );
};

module.exports = { verifyFirebaseToken, sendPushNotification, sendPushToMany };
