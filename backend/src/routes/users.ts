import { Router } from 'express';
import { updateProfile, getUserProfile, uploadAvatarMiddleware } from '../controllers/users';
import { authenticate } from '../middleware/auth';

const router = Router();

// Route to update profile (with optional avatar file upload)
router.put('/profile', authenticate, uploadAvatarMiddleware, updateProfile);

// Route to fetch a specific user's public profile
router.get('/:id', authenticate, getUserProfile);

export default router;
