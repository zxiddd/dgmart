const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema } = require('../validators/schemas');
const userController = require('../controllers/userController');

// Register (requires Supabase Auth Token)
router.post('/register', authenticate, validate(registerSchema), userController.register);

module.exports = router;
