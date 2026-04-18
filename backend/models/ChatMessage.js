const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "LiveSession",
      required: true,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    userName: {
      type:     String,
      required: true,
    },
    message: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 300,
    },
    type: {
      type:    String,
      enum:    ["message", "reaction"],
      default: "message",
    },
    reaction: {
      type:    String,
      default: null,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);