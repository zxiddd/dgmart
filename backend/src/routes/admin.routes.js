const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { promoCodeSchema, bannerSchema, platformSettingsSchema } = require('../validators/schemas');
const adminController = require('../controllers/adminController');

// Dashboard
router.get('/dashboard', authenticate, isAdmin, adminController.getDashboard);

// Users
router.get('/users', authenticate, isAdmin, adminController.getUsers);
router.put('/users/:userId/toggle', authenticate, isAdmin, adminController.toggleUserStatus);

// Public validate endpoint (used at checkout) - auth only required for user context
router.get('/promos/:code/validate', authenticate, adminController.validatePromoCode);

// All other admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// Restaurants
router.get('/restaurants', adminController.getAllRestaurants);
router.put('/restaurants/:restaurantId/approve', adminController.approveRestaurant);
router.delete('/restaurants/:restaurantId', adminController.deleteRestaurant);
router.patch('/restaurants/:restaurantId/featured', adminController.toggleFeaturedRestaurant);

// Delivery Partners
router.get('/delivery-partners', adminController.getDeliveryPartners);
router.put('/delivery-partners/:partnerId/verify', adminController.verifyDeliveryPartner);

// Orders
router.get('/orders', adminController.getAllOrders);

// Promo Codes
router.get('/promos', adminController.getPromoCodes);
router.post('/promos', adminController.createPromoCode);
router.put('/promos/:promoId', adminController.updatePromoCode);
router.delete('/promos/:promoId', adminController.deletePromoCode);

// Banners
router.get('/banners', adminController.getBanners);
router.post('/banners', validate(bannerSchema), adminController.createBanner);
router.put('/banners/:bannerId', adminController.updateBanner);
router.delete('/banners/:bannerId', adminController.deleteBanner);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', validate(platformSettingsSchema), adminController.updateSettings);

// Notifications
router.post('/notifications/broadcast', adminController.sendBroadcastNotification);

// Reports
router.get('/reports', adminController.getReports);

// Payouts
router.get('/payouts', adminController.getPayouts);
router.post('/payouts/process', adminController.processPayouts);

// Zones
router.get('/zones', adminController.getZones);
router.post('/zones', adminController.createZone);
router.put('/zones/:id', adminController.updateZone);
router.delete('/zones/:id', adminController.deleteZone);

module.exports = router;
