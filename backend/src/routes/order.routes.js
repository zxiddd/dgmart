const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema, reviewSchema } = require('../validators/schemas');
const orderController = require('../controllers/orderController');

// User order routes
router.post('/preview', authenticate, orderController.previewOrder);
router.post('/', authenticate, validate(createOrderSchema), orderController.createOrder);
router.get('/', authenticate, orderController.getUserOrders);
router.get('/:id', authenticate, orderController.getOrder);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);
router.post('/:id/review', authenticate, validate(reviewSchema), orderController.addReview);
router.post('/:id/reorder', authenticate, orderController.reorder);

// Restaurant order routes
router.get('/restaurant/me', authenticate, orderController.getMyRestaurantOrders);
router.get('/restaurant/:restaurantId', authenticate, orderController.getRestaurantOrders);
router.put('/:id/status', authenticate, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
