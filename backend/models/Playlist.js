const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    description: {
      type: String,
      default: ''
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // Only enforces uniqueness when value exists
      index: true
    },
    viewCount: {
      type: Number,
      default: 0
    },
    coverImage: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Index for faster queries
playlistSchema.index({ user: 1, createdAt: -1 });
playlistSchema.index({ isPublic: 1, viewCount: -1 });

module.exports = mongoose.model("Playlist", playlistSchema);