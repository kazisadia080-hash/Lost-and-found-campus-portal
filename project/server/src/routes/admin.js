import { Router } from 'express';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// all admin routes require admin role
router.use(auth('admin'));

// GET /api/admin/items
router.get(
  '/items',
  asyncHandler(async (req, res) => {
    const items = await Item.find()
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email');
    res.json({ items });
  })
);

// GET /api/admin/stats
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [totalItems, openItems, claimedItems, resolvedItems, pendingClaims, totalUsers] =
      await Promise.all([
        Item.countDocuments(),
        Item.countDocuments({ status: 'open' }),
        Item.countDocuments({ status: 'claimed' }),
        Item.countDocuments({ status: 'resolved' }),
        Claim.countDocuments({ status: 'pending' }),
        User.countDocuments(),
      ]);
    res.json({
      stats: { totalItems, openItems, claimedItems, resolvedItems, pendingClaims, totalUsers },
    });
  })
);

// GET /api/admin/users
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).select('-passwordHash');
    res.json({ users });
  })
);

// DELETE /api/admin/items/:id
router.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await Claim.deleteMany({ item: item._id });
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  })
);

export default router;
