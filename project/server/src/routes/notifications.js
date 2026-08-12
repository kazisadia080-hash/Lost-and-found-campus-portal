import { Router } from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// GET /api/notifications — list current user's notifications (most recent first)
router.get(
  '/',
  auth(),
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('from', 'name')
      .populate('item', 'title')
      .populate({ path: 'comment', populate: { path: 'item', select: 'title' } });
    res.json({ notifications });
  })
);

// GET /api/notifications/unread-count
router.get(
  '/unread-count',
  auth(),
  asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });
    // also include unread message senders count — frontend may use /api/messages/conversations which includes unread per partner
    res.json({ count });
  })
);

// POST /api/notifications/:id/mark-read
router.post(
  '/:id/mark-read',
  auth(),
  asyncHandler(async (req, res) => {
    const n = await Notification.findById(req.params.id);
    if (!n || n.user.toString() !== req.user.id) return res.status(404).json({ message: 'Notification not found' });
    n.read = true;
    await n.save();
    res.json({ message: 'Marked read' });
  })
);

export default router;
