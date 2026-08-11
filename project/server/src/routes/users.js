import { Router } from 'express';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// GET /api/users/:id — public profile info
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('name email studentId role createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  })
);

export default router;
