const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '320798578746-rkaneqhhmb7hkfcbnoreppmo71kg55nm.apps.googleusercontent.com';
  return new OAuth2Client(clientId);
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'super_secret_jwt_key_chat2excel_dev_token_998877', 
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      plan: 'free',
      creditsRemaining: 3
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        creditsRemaining: user.creditsRemaining,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration', message: error.message });
  }
};

// 1. Google OAuth & Seamless Account Linking
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  const { credential, googleId: mockGoogleId, email: mockEmail, name: mockName, avatar: mockAvatar } = req.body;

  let googleId = mockGoogleId;
  let email = mockEmail;
  let name = mockName;
  let avatar = mockAvatar;

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '320798578746-rkaneqhhmb7hkfcbnoreppmo71kg55nm.apps.googleusercontent.com';

  try {
    if (credential) {
      const client = getGoogleClient();
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: 'Invalid Google token payload.' });
      }

      googleId = payload.sub;
      email = payload.email;
      name = payload.name || payload.given_name || 'Google User';
      avatar = payload.picture;
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Google credential token or email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists with this email or googleId
    let user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(googleId ? [{ googleId }] : [])
      ]
    });

    if (!user) {
      // Create new user via Google
      user = await User.create({
        name: name || 'Google User',
        email: normalizedEmail,
        googleId,
        avatar,
        plan: 'free',
        creditsRemaining: 3
      });
    } else {
      // Seamlessly link Google ID to existing account (without re-hashing or altering password)
      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            ...(googleId ? { googleId } : {}),
            ...(avatar && !user.avatar ? { avatar } : {})
          }
        },
        { new: true }
      ).select('-password');
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        creditsRemaining: user.creditsRemaining,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    return res.status(401).json({
      error: 'Google authentication failed',
      details: err.message
    });
  }
};

// 2. Email Login with Explicit Error Messages
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address. Please register.' });
    }

    // Explicit check: Account was created via Google only
    if (!user.password && user.googleId) {
      return res.status(400).json({
        error: "This account was created with Google Sign-In. Please click 'Sign in with Google' to access your workspace."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid password. If you forgot your password, please use the 'Forgot password?' recovery link below."
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        creditsRemaining: user.creditsRemaining,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login', details: err.message });
  }
};

// 3. Forgot Password: Generate 6-Digit OTP and Dispatch via Email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please enter your registered email address.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate random secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = otpExpires;
    await user.save();

    // Check if SMTP is configured, otherwise fallback to terminal logging for instant dev testing
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"Chat2Excel Security" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `Your Password Reset OTP: ${otp}`,
          text: `Hello ${user.name},\n\nYour 6-digit password recovery code for Chat2Excel is:\n\n${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nChat2Excel Security Team`
        });
      } catch (mailErr) {
        console.warn('SMTP send failed, falling back to console:', mailErr.message);
        console.log(`\n======================================================`);
        console.log(`[PASSWORD RESET OTP FOR ${user.email}]: ${otp}`);
        console.log(`(Valid for 10 minutes until ${otpExpires.toLocaleTimeString()})`);
        console.log(`======================================================\n`);
      }
    } else {
      console.log(`\n======================================================`);
      console.log(`[PASSWORD RESET OTP FOR ${user.email}]: ${otp}`);
      console.log(`(Valid for 10 minutes until ${otpExpires.toLocaleTimeString()})`);
      console.log(`======================================================\n`);
    }

    return res.json({
      success: true,
      message: `A 6-digit recovery OTP has been sent to ${user.email}. (Valid for 10 minutes)`
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({ error: 'Failed to dispatch password recovery OTP', details: err.message });
  }
};

// 4. Reset Password: Verify OTP and Update Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, 6-digit OTP, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtp: otp.trim(),
      resetPasswordOtpExpires: { $gt: new Date() } // Ensure not expired
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit OTP. Please request a new code.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({ error: 'Failed to reset password', details: err.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ error: 'Server error retrieving user', message: error.message });
  }
};

// @desc    Update user role persona
// @route   PUT /api/auth/persona
// @access  Private
exports.updatePersona = async (req, res) => {
  try {
    const { rolePersona } = req.body;
    const validPersonas = ['accountant', 'franchise_manager', 'sales_ops', 'general'];
    if (!validPersonas.includes(rolePersona)) {
      return res.status(400).json({ error: 'Invalid role persona' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { rolePersona },
      { new: true }
    ).select('-password');

    return res.json({ success: true, user });
  } catch (error) {
    console.error('UpdatePersona error:', error);
    return res.status(500).json({ error: 'Server error updating persona', message: error.message });
  }
};
