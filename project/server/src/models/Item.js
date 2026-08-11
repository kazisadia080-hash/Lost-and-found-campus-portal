import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Electronics', 'ID Cards', 'Bags', 'Keys', 'Books', 'Other'],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    dateLostOrFound: { type: Date, required: true },
    images: { type: [String], default: [] }, // base64 data URIs
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'claimed', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model('Item', itemSchema);
