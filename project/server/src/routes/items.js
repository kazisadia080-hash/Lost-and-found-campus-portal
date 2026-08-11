import { Router } from 'express';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// GET /api/items — public, with filters
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, status, type, q, from, to, postedBy } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (postedBy) filter.postedBy = postedBy;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];
    }
    if (from || to) {
      filter.dateLostOrFound = {};
      if (from) filter.dateLostOrFound.$gte = new Date(from);
      if (to) filter.dateLostOrFound.$lte = new Date(to);
    }
    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email phone');
    res.json({ items });
  })
);

// GET /api/items/my/me — items posted by current user (must come before /:id)
router.get(
  '/my/me',
  auth(),
  asyncHandler(async (req, res) => {
    const items = await Item.find({ postedBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email phone');

    const itemIds = items.map((item) => item._id);
    const counts = await Claim.aggregate([
      { $match: { item: { $in: itemIds }, status: 'pending' } },
      { $group: { _id: '$item', count: { $sum: 1 } } },
    ]);
    const countMap = counts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    const itemsWithCounts = items.map((item) => {
      const obj = item.toObject();
      obj.pendingClaimCount = countMap[item._id.toString()] || 0;
      return obj;
    });

    res.json({ items: itemsWithCounts });
  })
);

// GET /api/items/my-claims/me — claims submitted by current user
router.get(
  '/my-claims/me',
  auth(),
  asyncHandler(async (req, res) => {
    const claims = await Claim.find({ claimant: req.user.id })
      .populate({ path: 'item', populate: { path: 'postedBy', select: 'name email phone' } })
      .populate('claimant', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ claims });
  })
);

// GET /api/items/:id — public
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id).populate('postedBy', 'name email phone');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  })
);

// POST /api/items — auth required
router.post(
  '/',
  auth(),
  asyncHandler(async (req, res) => {
    const { type, title, description, category, location, dateLostOrFound, images } = req.body;
    if (!type || !title || !description || !category || !location || !dateLostOrFound) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const imgs = Array.isArray(images) ? images.slice(0, 3) : [];
    const item = await Item.create({
      type,
      title,
      description,
      category,
      location,
      dateLostOrFound: new Date(dateLostOrFound),
      images: imgs,
      postedBy: req.user.id,
      status: 'open',
    });
    await item.populate('postedBy', 'name email');
    res.status(201).json({ item });
  })
);

// PATCH /api/items/:id — owner or admin
router.patch(
  '/:id',
  auth(),
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const isOwner = item.postedBy.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const allowed = ['title', 'description', 'category', 'location', 'dateLostOrFound', 'status', 'type', 'images'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) item[key] = req.body[key];
    }
    await item.save();
    await item.populate('postedBy', 'name email');
    res.json({ item });
  })
);

// DELETE /api/items/:id — owner or admin, always allowed
router.delete(
  '/:id',
  auth(),
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const isOwner = item.postedBy.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Claim.deleteMany({ item: item._id });
    await Comment.deleteMany({ item: item._id });
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  })
);

// POST /api/items/:id/claims — auth required
router.post(
  '/:id/claims',
  auth(),
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.postedBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim your own item' });
    }
    const { verificationNote } = req.body;
    if (!verificationNote || !verificationNote.trim()) {
      return res.status(400).json({ message: 'Verification note is required' });
    }
    const existing = await Claim.findOne({ item: item._id, claimant: req.user.id, status: 'pending' });
    if (existing) return res.status(409).json({ message: 'You already have a pending claim on this item' });

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user.id,
      verificationNote: verificationNote.trim(),
      status: 'pending',
    });
    await claim.populate('claimant', 'name email');
    res.status(201).json({ claim });
  })
);

// GET /api/items/:id/claims — owner of the item or admin
router.get(
  '/:id/claims',
  auth(),
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const claims = await Claim.find({ item: item._id })
      .populate('claimant', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ claims });
  })
);

// GET /api/items/:id/my-claim — get current user's claim on an item
router.get(
  '/:id/my-claim',
  auth(),
  asyncHandler(async (req, res) => {
    const claim = await Claim.findOne({ item: req.params.id, claimant: req.user.id })
      .populate('claimant', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ claim });
  })
);

// GET /api/items/:id/comments — public
router.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const comments = await Comment.find({ item: req.params.id })
      .populate('author', 'name')
      .populate({ path: 'parent', populate: { path: 'author', select: 'name' } })
      .sort({ createdAt: 1 });
    res.json({ comments });
  })
);

// POST /api/items/:id/comments — auth required
router.post(
  '/:id/comments',
  auth(),
  asyncHandler(async (req, res) => {
    const { text, parentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    let parent = null;
    if (parentId) {
      parent = await Comment.findById(parentId);
      if (!parent || parent.item.toString() !== item._id.toString()) {
        return res.status(400).json({ message: 'Invalid parent comment' });
      }
    }

    const comment = await Comment.create({
      item: item._id,
      author: req.user.id,
      parent: parent ? parent._id : null,
      text: text.trim(),
    });
    await comment.populate('author', 'name');
    await comment.populate({ path: 'parent', populate: { path: 'author', select: 'name' } });
    res.status(201).json({ comment });
  })
);

// DELETE /api/items/:id/comments/:commentId — author or admin
router.delete(
  '/:id/comments/:commentId',
  auth(),
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  })
);

export default router;
