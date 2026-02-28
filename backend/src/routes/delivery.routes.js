const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { deliveryPartnerSchema, updateLocationSchema } = require('../validators/schemas');
const deliveryController = require('../controllers/deliveryController');

// Register as delivery partner
router.post('/register', authenticate, validate(deliveryPartnerSchema), deliveryController.registerPartner);

// Online/offline
router.put('/toggle-online', authenticate, deliveryController.toggleOnlineStatus);

// Location
router.put('/location', authenticate, validate(updateLocationSchema), deliveryController.updateLocation);

// Orders
router.get('/orders', authenticate, deliveryController.getAssignedOrders);
router.get('/available-orders', authenticate, deliveryController.getAvailableOrders);
router.post('/orders/:orderId/claim', authenticate, deliveryController.claimOrder);
router.put('/orders/:assignmentId/respond', authenticate, deliveryController.respondToAssignment);
router.put('/orders/:assignmentId/status', authenticate, deliveryController.updateDeliveryStatus);

// Earnings
router.get('/earnings', authenticate, deliveryController.getEarnings);

// History
router.get('/history', authenticate, deliveryController.getDeliveryHistory);

// Profile
router.get('/profile', authenticate, deliveryController.getPartnerProfile);

module.exports = router;
