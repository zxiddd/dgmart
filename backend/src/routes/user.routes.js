const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileSchema, addressSchema } = require('../validators/schemas');
const userController = require('../controllers/userController');
const supportController = require('../controllers/supportController');

// Profile
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);

// Addresses
router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, validate(addressSchema), userController.addAddress);
router.put('/addresses/:id', authenticate, validate(addressSchema), userController.updateAddress);
router.delete('/addresses/:id', authenticate, userController.deleteAddress);

// Wallet
router.get('/wallet', authenticate, userController.getWallet);

// Favorites
router.get('/favorites', authenticate, userController.getFavorites);
router.post('/favorites/:restaurant_id', authenticate, userController.toggleFavorite);

// Notifications
router.get('/notifications', authenticate, supportController.getNotifications);
router.put('/notifications/:notificationId/read', authenticate, supportController.markNotificationRead);
router.put('/notifications/read-all', authenticate, supportController.markAllNotificationsRead);

// Zones
router.get('/zones', authenticate, userController.getZones);

module.exports = router;
