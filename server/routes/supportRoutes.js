const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const supportController = require('../controllers/supportController');

router.post('/chat', protect, supportController.handleSupportChat);

module.exports = router;

