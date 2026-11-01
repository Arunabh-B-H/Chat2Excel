const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '320798578746-rkaneqhhmb7hkfcbnoreppmo71kg55nm.apps.googleusercontent.com'
);

const generateToken = (id) => {
  return jwt.sign(
    { id },
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

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Account created with social login. Please sign in via Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        creditsRemaining: user.creditsRemaining,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login', message: error.message });
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

// @desc    Google OAuth Verification & Login
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { credential, googleId: mockGoogleId, email: mockEmail, name: mockName, avatar: mockAvatar } = req.body;

    let googleId = mockGoogleId;
    let email = mockEmail;
    let name = mockName;
    let avatar = mockAvatar;

    // Verify Google ID Token Credential when provided
    if (credential) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || '320798578746-rkaneqhhmb7hkfcbnoreppmo71kg55nm.apps.googleusercontent.com',
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
    let user = await User.findOne({
      $or: [
        { googleId: googleId },
        { email: normalizedEmail }
      ]
    });

    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email: normalizedEmail,
        googleId,
        avatar,
        plan: 'free',
        creditsRemaining: 3
      });
    } else {
      let updated = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        creditsRemaining: user.creditsRemaining,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google auth verification error:', error);
    return res.status(401).json({ error: 'Google authentication verification failed', message: error.message });
  }
};

