// backend/models/OTP.js

const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL: auto-deletes document when expiresAt passes
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1 });

module.exports = mongoose.model("OTP", otpSchema);