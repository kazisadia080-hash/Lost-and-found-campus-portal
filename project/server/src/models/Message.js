import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    text: { type: String, trim: true, maxlength: 1000, default: '' },
    attachments: { type: [String], default: [] },
    read: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    seenAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
