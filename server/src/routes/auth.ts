import { Router } from 'express';
import {
  handleSendCode,
  handleRegister,
  handleLogin,
  handleLogout,
  handleMe,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { emailCodeRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/send-code', emailCodeRateLimiter, handleSendCode);
router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/logout', handleLogout);
router.get('/me', authMiddleware, handleMe);

export default router;
