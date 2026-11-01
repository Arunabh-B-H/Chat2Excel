const express = require('express');
const router = express.Router();
const {
  processConversion,
  parseText,
  parseScreenshot,
  getUserConversions,
  getConversionById,
  deleteConversion
} = require('../controllers/conversionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect); // All conversion routes require authentication

// Standardized single 'image' upload handler with seamless fallback support
const handleImageUpload = (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return next(err);
    req.file = req.files?.image?.[0] || req.files?.screenshot?.[0] || req.file;
    next();
  });
};

// Unified dynamic conversion processor (text or base64 screenshot with custom prompts)
router.post('/process', processConversion);

// Backward-compatible endpoints
router.post('/parse-text', parseText);
router.post('/parse-screenshot', handleImageUpload, parseScreenshot);
router.get('/', getUserConversions);
router.get('/:id', getConversionById);
router.delete('/:id', deleteConversion);

module.exports = router;

