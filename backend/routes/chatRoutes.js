const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Send message and get AI response
router.post('/send', chatController.sendMessage);

// Get chat history
router.get('/history', chatController.getChatHistory);

// Rate AI response
router.post('/rate', chatController.rateResponse);

// Clear chat history
router.post('/clear', chatController.clearHistory);

module.exports = router;
