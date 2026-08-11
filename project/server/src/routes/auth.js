import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import { signToken, auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendOtpEmail } from '../config/email.js';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone, studentId, role, adminCode } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, phone and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    let finalRole = 'user';
    if (role === 'admin') {
      const expected = process.env.ADMIN_REGISTRATION_CODE;
      if (!expected) {
        return res.status(403).json({ message: 'Admin registration is not configured on the server' });
      }
      if (!adminCode || adminCode !== expected) {
        return res.status(403).json({ message: 'Invalid admin registration code' });
      }
      finalRole = 'admin';
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      studentId: studentId || '',
      role: finalRole,
    });
    const token = signToken(user);
    res.status(201).json({ token, user });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  auth(),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  })
);

// PATCH /api/auth/me — update name, studentId, and/or password
router.patch(
  '/me',
  auth(),
  asyncHandler(async (req, res) => {
    const { name, currentPassword, newPassword, studentId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' });
      user.name = name.trim();
    }

    if (studentId !== undefined) {
      user.studentId = studentId.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ user });
  })
);

// POST /api/auth/forgot-password — request reset OTP (no auth required)
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: 'If that email exists, an OTP has been sent.' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ user: user._id, email: user.email, code, purpose: 'reset_password', expiresAt });

    try {
      await sendOtpEmail(user.email, code, 'reset_password');
    } catch (err) {
      console.error('sendOtpEmail failed (forgot-password):', err);
      return res.status(500).json({ message: 'Failed to send OTP email. Check server email configuration.' });
    }

    res.json({ message: 'If that email exists, an OTP has been sent.' });
  })
);

// POST /api/auth/reset-password — verify OTP and set new password (no auth required)
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid or expired OTP' });

    const otpDoc = await Otp.findOne({
      user: user._id,
      purpose: 'reset_password',
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc || otpDoc.code !== otp) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    otpDoc.used = true;
    await otpDoc.save();

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  })
);

// POST /api/auth/delete-otp — request OTP for account deletion
router.post(
  '/delete-otp',
  auth(),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ user: user._id, code, purpose: 'delete_account', expiresAt });

    try {
      await sendOtpEmail(user.email, code, 'delete_account');
    } catch (err) {
      console.error('sendOtpEmail failed (delete-otp):', err);
      return res.status(500).json({ message: 'Failed to send OTP email. Check server email configuration.' });
    }

    res.json({ message: 'OTP sent to your email' });
  })
);

// DELETE /api/auth/me — delete account (requires OTP)
router.delete(
  '/me',
  auth(),
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpDoc = await Otp.findOne({
      user: user._id,
      purpose: 'delete_account',
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc || otpDoc.code !== otp) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    otpDoc.used = true;
    await otpDoc.save();

    await Comment.deleteMany({ author: user._id });
    await Message.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] });

    const userItems = await Item.find({ postedBy: user._id });
    const itemIds = userItems.map((i) => i._id);
    await Claim.deleteMany({ item: { $in: itemIds } });
    await Claim.deleteMany({ claimant: user._id });
    await Comment.deleteMany({ item: { $in: itemIds } });
    await Item.deleteMany({ postedBy: user._id });

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account deleted successfully' });
  })
);

export default router;