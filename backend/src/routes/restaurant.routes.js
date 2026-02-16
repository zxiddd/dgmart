const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createRestaurantSchema, updateRestaurantSchema, restaurantFilterSchema } = require('../validators/schemas');
const restaurantController = require('../controllers/restaurantController');

// Authenticated routes - specific routes first
router.get('/me', authenticate, restaurantController.getMyRestaurant);
router.post('/', authenticate, validate(createRestaurantSchema), restaurantController.createRestaurant);

// Public routes - generic routes last
router.get('/', optionalAuth, validate(restaurantFilterSchema, 'query'), restaurantController.listRestaurants);
router.get('/:id', optionalAuth, restaurantController.getRestaurant);
router.put('/:id', authenticate, validate(updateRestaurantSchema), restaurantController.updateRestaurant);
router.put('/:id/toggle', authenticate, restaurantController.toggleRestaurantStatus);
router.get('/:id/dashboard', authenticate, restaurantController.getRestaurantDashboard);

module.exports = router;
