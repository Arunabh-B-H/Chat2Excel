const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  orderId: { 
    type: String, 
    required: true,
    index: true 
  },
  paymentId: { 
    type: String 
  },
  signature: { 
    type: String 
  },
  amount: { 
    type: Number, 
    required: true 
  }, // in paise (e.g. 5000 for ₹50, 10000 for ₹100)
  currency: { 
    type: String, 
    default: 'INR' 
  },
  plan: { 
    type: String, 
    enum: ['basic_50', 'pro_100'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['created', 'paid', 'failed'], 
    default: 'created' 
  },
  paymentMethod: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Payment', paymentSchema);

