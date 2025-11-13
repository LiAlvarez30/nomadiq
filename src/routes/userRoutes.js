import { Router } from 'express';
import { me } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/me', authMiddleware, me);

export default router;
