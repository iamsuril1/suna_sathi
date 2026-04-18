const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema(
  {
    isActive:         { type: Boolean, default: false },
    hostedBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    playlistName:     { type: String,  default: "SunaSathi Radio" },
    listeners:        { type: Number,  default: 0 },
    // Legacy fields kept for compatibility but radio clock drives playback
    currentSong:      { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null },
    currentSongIndex: { type: Number,  default: 0 },
    isPlaying:        { type: Boolean, default: true },
    currentTime:      { type: Number,  default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveSession", liveSessionSchema);