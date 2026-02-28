const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Subscribe to push notifications
router.post('/subscribe', authenticate, notificationController.subscribe);

// Unsubscribe
router.post('/unsubscribe', authenticate, notificationController.unsubscribe);

module.exports = router;
