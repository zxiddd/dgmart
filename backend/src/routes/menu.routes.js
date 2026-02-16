const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { menuCategorySchema, menuItemSchema } = require('../validators/schemas');
const menuController = require('../controllers/menuController');

// Categories
router.get('/:restaurantId', menuController.getFullMenu);
router.get('/:restaurantId/categories', menuController.getCategories);
router.post('/:restaurantId/categories', authenticate, validate(menuCategorySchema), menuController.createCategory);
router.put('/:restaurantId/categories/:categoryId', authenticate, validate(menuCategorySchema), menuController.updateCategory);
router.delete('/:restaurantId/categories/:categoryId', authenticate, menuController.deleteCategory);

// Items
router.get('/:restaurantId/items', menuController.getItems);
router.post('/:restaurantId/items', authenticate, validate(menuItemSchema), menuController.createItem);
router.put('/:restaurantId/items/:itemId', authenticate, menuController.updateItem);
router.delete('/:restaurantId/items/:itemId', authenticate, menuController.deleteItem);
router.put('/:restaurantId/items/:itemId/toggle', authenticate, menuController.toggleItemAvailability);

module.exports = router;
