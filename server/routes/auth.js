import express from 'express';
import {
  register,
  login,
  getMe,
  verifyToken,
  updateProfile
} from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);
router.get('/verify', auth, verifyToken);
router.put('/profile', auth, updateProfile);

export default router;