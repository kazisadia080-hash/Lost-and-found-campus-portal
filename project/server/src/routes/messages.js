import { Router } from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Item from '../models/Item.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getIo } from '../socket.js';

const router = Router();

// GET /api/messages/conversations — list all users the current user has chatted with
router.get(
  '/conversations',
  auth(),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const sent = await Message.find({ sender: userId }).distinct('recipient');
    const received = await Message.find({ recipient: userId }).distinct('sender');
    const partnerIds = [...new Set([...sent.map(String), ...received.map(String)])];

    const partners = await User.find({ _id: { $in: partnerIds } }).select('name');
    const lastMessages = await Promise.all(
      partnerIds.map((pid) =>
        Message.findOne({
          $or: [
            { sender: userId, recipient: pid },
            { sender: pid, recipient: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .populate('sender', 'name')
          .populate('recipient', 'name')
      )
    );

    const unreadCounts = await Message.aggregate([
      { $match: { recipient: userId, read: false } },
      { $group: { _id: '$sender', count: { $sum: 1 } } },
    ]);
    const unreadMap = {};
    unreadCounts.forEach((u) => { unreadMap[u._id.toString()] = u.count; });

    const conversations = partners.map((p) => {
      const last = lastMessages.find((m) => m && (m.sender._id.toString() === p._id.toString() || m.recipient._id.toString() === p._id.toString()));
      return {
        user: { _id: p._id, name: p.name },
        lastMessage: last ? last.text : '',
        lastAt: last ? last.createdAt : null,
        unread: unreadMap[p._id.toString()] || 0,
      };
    });

    conversations.sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));

    res.json({ conversations });
  })
);

// GET /api/messages/:userId — get conversation with a specific user
router.get(
  '/:userId',
  auth(),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const partnerId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: partnerId },
        { sender: partnerId, recipient: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name')
      .populate('recipient', 'name')
      .populate('item', 'title');

    await Message.updateMany(
      { sender: partnerId, recipient: userId, read: false },
      { $set: { read: true, seenAt: new Date() } }
    );

    const partner = await User.findById(partnerId).select('name');

    res.json({ messages, partner });
  })
);

// POST /api/messages/:userId — send a message
router.post(
  '/:userId',
  auth(),

  asyncHandler(async (req, res) => {
    const { text, attachments } = req.body;
    if ((!text || !text.trim()) && (!attachments || !Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const recipient = await User.findById(req.params.userId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });

    const messagePayload = {
      sender: req.user.id,
      recipient: req.params.userId,
      text: text ? text.trim() : '',
      attachments: Array.isArray(attachments) ? attachments : [],
    };
    if (req.body.itemId) {
      const item = await Item.findById(req.body.itemId);
      if (!item) return res.status(404).json({ message: 'Item not found' });
      messagePayload.item = item._id;
    }
    const message = await Message.create(messagePayload);
    // mark as delivered
    message.deliveredAt = new Date();
    await message.save();
    await message.populate('sender', 'name');
    await message.populate('recipient', 'name');
    await message.populate('item', 'title');

    // create a notification for recipient and emit socket event
    try {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({ user: req.params.userId, from: req.user.id, type: 'message', message: message._id, text: (message.text || '').slice(0, 200) });
      const io = getIo();
      if (io) io.to(`user:${req.params.userId}`).emit('newMessage', { message });
    } catch (err) {
      console.error('Failed to create message notification:', err);
    }

    res.status(201).json({ message });
  })
);

export default router;
