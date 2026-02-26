const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema } = require('../validators/schemas');
const userController = require('../controllers/userController');
const otpController = require('../controllers/otpController');

// Register (requires Supabase Auth Token)
router.post('/register', authenticate, validate(registerSchema), userController.register);

// Custom Fast OTP Implementation (bypassing native Supabase SMS)
router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);

// Email+Password / Phone+Password flows
router.post('/register-with-password', otpController.registerWithPassword);
router.post('/login-with-password', otpController.loginWithPassword);
router.post('/verify-existing-phone', authenticate, otpController.verifyExistingPhone);

module.exports = router;
