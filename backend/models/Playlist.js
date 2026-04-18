const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:    String,
      default: "",
      trim:    true,
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  "Song",
      },
    ],
    isPublic: {
      type:    Boolean,
      default: false,
    },
    shareToken: {
      type:   String,
      unique: true,
      sparse: true,
      index:  true,
    },
    viewCount: {
      type:    Number,
      default: 0,
    },
    coverImage: {
      type:    String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Virtual song count
playlistSchema.virtual("songCount").get(function () {
  return this.songs?.length || 0;
});

playlistSchema.index({ user: 1, createdAt: -1 });
playlistSchema.index({ isPublic: 1, viewCount: -1 });

module.exports = mongoose.model("Playlist", playlistSchema);