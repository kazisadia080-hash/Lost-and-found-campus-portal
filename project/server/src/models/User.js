import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      phone: { type: String, required: true, trim: true },
      studentId: { type: String, trim: true, default: '' },
      role: { type: String, enum: ['student', 'teacher', 'librarian', 'staff', 'other', 'admin', 'user'], default: 'student' },
      universityEmail: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
      universityVerified: { type: Boolean, default: false },
      universityVerifiedAt: { type: Date },
      status: { type: String, enum: ['pending', 'active', 'suspended', 'banned'], default: 'active' },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);
