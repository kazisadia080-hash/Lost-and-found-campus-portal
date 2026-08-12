import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['comment', 'reply', 'message', 'claim'], required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    text: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
