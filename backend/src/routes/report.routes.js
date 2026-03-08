const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.use(authenticate, isAdmin);

// Rider Reports
router.get('/riders', reportController.getRidersList);
router.get('/rider/:riderId', reportController.getRiderReport);
router.get('/rider/:riderId/download', reportController.downloadRiderCSV);

// Restaurant Reports
router.get('/restaurants', reportController.getRestaurantsList);
router.get('/restaurant/:restaurantId', reportController.getRestaurantReport);
router.get('/restaurant/:restaurantId/download', reportController.downloadRestaurantCSV);

module.exports = router;
