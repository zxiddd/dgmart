const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create Razorpay order
router.post('/create-order', authenticate, paymentController.createPaymentOrder);

// Verify payment
router.post('/verify', authenticate, paymentController.verifyPayment);

// Refund
router.post('/refund', authenticate, paymentController.processRefund);

// Wallet payment
router.post('/wallet-pay', authenticate, paymentController.payFromWallet);

// Recharge Wallet
router.post('/recharge', authenticate, paymentController.createRechargeOrder);

// Webhook (Public, signature verified in controller)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
