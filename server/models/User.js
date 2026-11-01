const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String 
  },
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  avatar: { 
    type: String 
  },
  rolePersona: { 
    type: String, 
    enum: ['accountant', 'franchise_manager', 'sales_ops', 'general'], 
    default: 'accountant' 
  },
  plan: { 
    type: String, 
    enum: ['free', 'basic_50', 'pro_100'], 
    default: 'free' 
  },
  creditsRemaining: { 
    type: Number, 
    default: 3 
  },
  subscriptionExpiresAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);

