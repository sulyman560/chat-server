import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    online: { type: Boolean, default: false },   // online status
    lastSeen: { type: Date, default: Date.now } // last seen
  }, { timestamps: true });

export default mongoose.model("User", userSchema);