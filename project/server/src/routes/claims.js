import { Router } from 'express';
import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// PATCH /api/claims/:id — item owner or admin (approve/reject)
router.patch(
  '/:id',
  auth(),
  asyncHandler(async (req, res) => {
    const claim = await Claim.findById(req.params.id).populate('item');
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const item = claim.item;
    const isOwner = item.postedBy.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the item owner can review claims' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    claim.status = status;
    claim.resolvedAt = new Date();
    await claim.save();

    if (status === 'approved') {
      await Claim.updateMany(
        { item: item._id, _id: { $ne: claim._id }, status: 'pending' },
        { $set: { status: 'rejected', resolvedAt: new Date() } }
      );
      item.status = 'claimed';
      await item.save();
    }

    await claim.populate('claimant', 'name email');
    await claim.populate({ path: 'item', populate: { path: 'postedBy', select: 'name email' } });
    res.json({ claim });
  })
);

export default router;
