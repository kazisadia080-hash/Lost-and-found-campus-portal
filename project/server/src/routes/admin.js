import { Router } from 'express';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
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

// PATCH /api/admin/users/:id/status — set user status (active, suspended, banned)
router.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = status;
    await user.save();
    res.json({ message: 'User status updated', user });
  })
);

// DELETE /api/admin/users/:id — delete a user immediately (admin action)
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Claim.deleteMany({ claimant: user._id });
    await Comment.deleteMany({ author: user._id });
    await Message.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] });

    const userItems = await Item.find({ postedBy: user._id });
    const itemIds = userItems.map((i) => i._id);
    await Claim.deleteMany({ item: { $in: itemIds } });
    await Comment.deleteMany({ item: { $in: itemIds } });
    await Item.deleteMany({ postedBy: user._id });

    await user.deleteOne();
    res.json({ message: 'User deleted' });
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
