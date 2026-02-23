const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Stripe Payment Routes
router.post('/create-checkout-session', authMiddleware, paymentController.createCheckoutSession);
router.post('/verify', authMiddleware, paymentController.verifyPayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.post('/refund', adminMiddleware, paymentController.refundPayment);

// GCash Payment Routes (Legacy)
router.post('/gcash/create', authMiddleware, paymentController.createGCashPayment);
router.post('/gcash/checkout-session', authMiddleware, paymentController.createGCashCheckoutSession);
router.post('/gcash/verify', authMiddleware, paymentController.verifyGCashPayment);
router.post('/gcash/webhook', paymentController.handleGCashWebhook);
router.get('/gcash/status/:referenceId', authMiddleware, paymentController.getGCashPaymentStatus);
router.post('/gcash/cancel', authMiddleware, paymentController.cancelGCashPayment);

// PayMongo Payment Intent Routes (Recommended)
router.post('/paymongo/create-payment-intent', authMiddleware, paymentController.createPayMongoPaymentIntent);
router.post('/paymongo/verify-payment', authMiddleware, paymentController.verifyPayMongoPayment);
router.post('/paymongo/webhook', paymentController.handleGCashWebhook); // Use existing webhook handler

// Exchange Rate Route
router.get('/exchange-rate', paymentController.getExchangeRate);

module.exports = router;