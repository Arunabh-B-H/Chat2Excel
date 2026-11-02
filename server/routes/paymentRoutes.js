const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPricingConfig } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public pricing configuration endpoint
router.get('/config', getPricingConfig);

// Protected payment endpoints
router.use(protect);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/verify-payment', verifyPayment);

module.exports = router;
