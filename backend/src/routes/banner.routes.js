const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

// Public routes
router.get('/', bannerController.getBanners);

// Admin routes (Protected in future, currently open for development speed)
// In a real app, you would add authMiddleware here
router.post('/', bannerController.createBanner);
router.put('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;
