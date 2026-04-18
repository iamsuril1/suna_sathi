const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    token: {
      type:     String,
      required: true,
    },
    expiresAt: {
      type:    Date,
      required: true,
      index:   { expires: 0 }, 
    },
    used: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

passwordResetSchema.index({ token: 1 });

module.exports = mongoose.model("PasswordReset", passwordResetSchema);