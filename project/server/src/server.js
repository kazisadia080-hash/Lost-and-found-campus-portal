import 'dotenv/config';
import app from './app.js';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { setIo } from './socket.js';
import User from './models/User.js';
import Item from './models/Item.js';
import Claim from './models/Claim.js';
import Comment from './models/Comment.js';
import Message from './models/Message.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''), credentials: true } });

io.on('connection', (socket) => {
  // clients should emit { type: 'identify', userId }
  socket.on('identify', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });
});

setIo(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// cleanup pending accounts older than 10 hours — run now and then periodically
async function cleanupPending() {
  try {
    const cutoff = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const pending = await User.find({ status: 'pending', createdAt: { $lt: cutoff } });
    for (const u of pending) {
      // remove associated data
      await Claim.deleteMany({ claimant: u._id });
      await Comment.deleteMany({ author: u._id });
      await Message.deleteMany({ $or: [{ sender: u._id }, { recipient: u._id }] });
      const userItems = await Item.find({ postedBy: u._id });
      const itemIds = userItems.map((i) => i._id);
      await Claim.deleteMany({ item: { $in: itemIds } });
      await Comment.deleteMany({ item: { $in: itemIds } });
      await Item.deleteMany({ postedBy: u._id });
      await u.deleteOne();
      console.log('Deleted pending unverified user', u._id.toString());
    }
  } catch (err) {
    console.error('Error cleaning pending users:', err);
  }
}

cleanupPending();
setInterval(cleanupPending, 60 * 60 * 1000);
