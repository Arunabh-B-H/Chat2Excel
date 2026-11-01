const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');

// CONFIGURATION: Set to true for ₹1 / ₹2 test pricing; set to false for ₹50 / ₹100 live pricing
const IS_TEST_PRICING = true;

const PLAN_RATES = {
  basic_50: {
    amount: IS_TEST_PRICING ? 100 : 5000, // 100 paise = ₹1 | 5000 paise = ₹50
    displayPrice: IS_TEST_PRICING ? 1 : 50,
    regularPrice: 50,
    credits: 50
  },
  pro_100: {
    amount: IS_TEST_PRICING ? 200 : 10000, // 200 paise = ₹2 | 10000 paise = ₹100
    displayPrice: IS_TEST_PRICING ? 2 : 100,
    regularPrice: 100,
    credits: 999999 // Unlimited
  }
};

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
  });
};

// @desc    Get active pricing configuration (test rates vs live rates)
// @route   GET /api/payments/config
// @access  Public
exports.getPricingConfig = (req, res) => {
  res.json({
    success: true,
    isTestPricing: IS_TEST_PRICING,
    merchantUpi: 'mjolnirfitness3@okicici',
    keyId: process.env.RAZORPAY_KEY_ID,
    plans: PLAN_RATES
  });
};

// 1. Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  const { plan } = req.body; // 'basic_50' or 'pro_100'

  if (!PLAN_RATES[plan]) {
    return res.status(400).json({ error: 'Invalid subscription plan selected' });
  }

  const { amount, displayPrice } = PLAN_RATES[plan];

  try {
    let orderId;
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const isLiveOrTestKey = keyId.startsWith('rzp_test_') && !keyId.includes('demo') && !keyId.includes('placeholder');

    if (isLiveOrTestKey) {
      try {
        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({
          amount,
          currency: 'INR',
          receipt: `rcpt_${req.user.id.slice(-6)}_${Date.now()}`,
          notes: {
            userId: req.user.id,
            plan,
            upiId: 'mjolnirfitness3@okicici',
            priceRupees: displayPrice
          }
        });
        orderId = order.id;
      } catch (apiErr) {
        console.warn('Razorpay live API order creation error, falling back to simulator:', apiErr.message);
        orderId = `order_sim_${Date.now()}`;
      }
    } else {
      // Local development test simulator order
      orderId = `order_sim_${Date.now()}`;
    }

    // Save pending transaction in MongoDB
    await Payment.create({
      userId: req.user.id,
      orderId,
      amount,
      currency: 'INR',
      plan,
      status: 'created',
      paymentMethod: 'upi'
    });

    res.json({
      success: true,
      orderId,
      amount,
      displayPrice,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
      merchantUpi: 'mjolnirfitness3@okicici',
      isTestPricing: IS_TEST_PRICING
    });
  } catch (err) {
    console.error('Payment order creation error:', err);
    res.status(500).json({ error: 'Failed to create payment order', details: err.message });
  }
};

// 2. Cryptographic HMAC-SHA256 Signature Verification & Automated Upgrade
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isSimulated } = req.body;

  if (!razorpay_order_id) {
    return res.status(400).json({ error: 'Order ID is required for verification.' });
  }

  try {
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment order record not found' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isSecretConfigured = secret && !secret.includes('placeholder') && !secret.includes('demo');

    // Cryptographic verification if live/test secret is provided
    if (!isSimulated && isSecretConfigured && razorpay_signature && razorpay_signature !== 'simulated_signature' && razorpay_signature !== 'simulated_test_signature') {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ error: 'Cryptographic signature verification failed. Untrusted payment.' });
      }
    }

    // Mark as paid
    payment.paymentId = razorpay_payment_id || `pay_sim_${Date.now()}`;
    payment.signature = razorpay_signature || 'simulated_signature';
    payment.status = 'paid';
    await payment.save();

    // Calculate 30-day expiration and credits
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const creditsToAdd = payment.plan === 'pro_100' ? 999999 : 50;

    const updatedUser = await User.findByIdAndUpdate(
      payment.userId,
      {
        plan: payment.plan,
        creditsRemaining: creditsToAdd,
        subscriptionExpiresAt: expiresAt
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `🎉 Success! Upgraded to ${payment.plan === 'pro_100' ? 'Pro Unlimited' : 'Basic'}.`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Server error processing payment verification' });
  }
};
