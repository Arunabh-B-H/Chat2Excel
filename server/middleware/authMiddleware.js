const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Always let preflight OPTIONS requests pass through for CORS
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      token = authHeader.split(' ')[1];

      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ error: 'Session expired or not logged in. Please sign in again.' });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_chat2excel_dev_token_998877'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'User account not found. Please log in again.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Auth token verification error:', error.message);
      return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
  }

  return res.status(401).json({ error: 'Not authorized. Please log in to continue.' });
};

module.exports = { protect };
