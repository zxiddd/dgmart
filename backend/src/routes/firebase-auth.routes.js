const express = require('express');
const router = express.Router();
const { firebaseLogin, saveFcmToken } = require('../controllers/firebaseAuthController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/firebase
// Exchange a Firebase ID token (from Phone OTP or Google Sign-In) for a Supabase session.
// Firebase handles all OTP sending/verification — the app only sends the final ID token here.
router.post('/firebase', firebaseLogin);

// POST /api/auth/fcm-token
// Save the user's FCM push notification device token (authenticated users only).
router.post('/fcm-token', authenticate, saveFcmToken);

module.exports = router;
