import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, lowercase: true, trim: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['delete_account', 'reset_password', 'verify_university'], required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Otp', otpSchema);
