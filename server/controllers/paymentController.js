const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Initialize Razorpay instance with Live credentials
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay Live keys are missing in environment variables.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

// Pricing configuration endpoint
exports.getPricingConfig = (req, res) => {
  res.json({
    success: true,
    isTestPricing: false,
    merchantUpi: 'mjolnirfitness3@okicici',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_TvLEfmba7T8Wy4',
    plans: {
      basic: { amount: 50 * 100, displayPrice: 50, credits: 25, name: 'Basic Plan (25 Credits)' },
      basic_50: { amount: 50 * 100, displayPrice: 50, credits: 25, name: 'Basic Plan (25 Credits)' },
      pro: { amount: 100 * 100, displayPrice: 100, credits: 60, name: 'Pro Plan (60 Credits)' },
      pro_100: { amount: 100 * 100, displayPrice: 100, credits: 60, name: 'Pro Plan (60 Credits)' }
    }
  });
};

// 1. Create Live Razorpay Order
exports.createOrder = async (req, res) => {
  const planTypeInput = req.body.planType || req.body.plan || 'basic';
  const planType = (planTypeInput === 'pro_100' || planTypeInput === 'pro') ? 'pro' : 'basic';

  // Pricing configuration in INR (amount in paise: ₹1 = 100 paise)
  const plans = {
    basic: { amount: 50 * 100, credits: 25, name: 'Basic Plan (25 Credits)', displayPrice: 50 },
    pro: { amount: 100 * 100, credits: 60, name: 'Pro Plan (60 Credits)', displayPrice: 100 }
  };

  const selectedPlan = plans[planType] || plans.basic;

  try {
    const razorpay = getRazorpayInstance();

    const options = {
      amount: selectedPlan.amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${req.user.id.slice(-6)}`,
      notes: {
        userId: req.user.id,
        planType: planType,
        credits: selectedPlan.credits
      }
    };

    const order = await razorpay.orders.create(options);

    // Save initial payment audit record
    await Payment.create({
      userId: req.user.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planType === 'pro' ? 'pro_100' : 'basic_50',
      status: 'created',
      paymentMethod: 'upi'
    }).catch((err) => console.warn('Payment record create note:', err.message));

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: selectedPlan.name,
      displayPrice: selectedPlan.displayPrice,
      merchantUpi: 'mjolnirfitness3@okicici'
    });
  } catch (err) {
    console.error('Razorpay Live Order Creation Failed:', err);
    res.status(500).json({ error: 'Failed to create payment order', details: err.message });
  }
};

// 2. Verify Payment Signature & Credit User Account
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, plan } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Incomplete payment verification payload' });
  }

  try {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid payment signature match!');
      return res.status(400).json({ error: 'Payment signature verification failed. Untrusted transaction.' });
    }

    const resolvedPlanType = (planType === 'pro' || plan === 'pro_100' || plan === 'pro') ? 'pro' : 'basic';

    // Credits allocated per plan
    const creditMap = {
      basic: 25,
      pro: 60
    };
    const addedCredits = creditMap[resolvedPlanType] || 25;

    // Update payment record in database
    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'paid'
      }
    ).catch(() => {});

    // Update user credits and active plan atomically
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { creditsRemaining: addedCredits },
        $set: { plan: resolvedPlanType === 'pro' ? 'pro_100' : 'basic_50' }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `Payment successful! Added ${addedCredits} credits to your account.`,
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        creditsRemaining: updatedUser.creditsRemaining
      }
    });
  } catch (err) {
    console.error('Payment Verification Error:', err);
    res.status(500).json({ error: 'Server error processing payment verification', details: err.message });
  }
};
