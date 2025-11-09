import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead
} from '../controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication
router.use(auth);

// Send a message
router.post('/send', sendMessage);

// Get messages between current user and another user
router.get('/messages/:userId', getMessages);

// Get list of conversations
router.get('/conversations', getConversations);

// Mark messages as read
router.put('/messages/:userId/read', markMessagesAsRead);

export default router;

