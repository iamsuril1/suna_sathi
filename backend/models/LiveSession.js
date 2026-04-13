const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    hostedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    currentSong: { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null },
    currentSongIndex: { type: Number, default: 0 },
    playlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    playlistName: { type: String, default: "Live Session" },
    startedAt: { type: Date, default: Date.now },
    isPlaying: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    listeners: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveSession", liveSessionSchema);