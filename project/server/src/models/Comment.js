import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    text: { type: String, trim: true, maxlength: 500, default: '' },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Comment', commentSchema);
