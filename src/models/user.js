import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }, // keep select:false
  lastLoginAt: Date,
  loginHistory: [
    {
      ip: String,
      userAgent: String,
      status: { type: String, enum: ["success", "failure"] },
      at: { type: Date, default: Date.now },
    },
  ],
});

// ✅ Hash on save (REGISTER relies on this)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare
userSchema.methods.comparePassword = async function (plainPassword) {
  // prevents bcrypt crash
  if (!plainPassword || !this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model("User", userSchema);
