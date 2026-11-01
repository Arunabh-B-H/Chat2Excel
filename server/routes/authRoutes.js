const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  googleAuth, 
  updatePersona,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/persona', protect, updatePersona);

// Password Recovery OTP Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
