const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    artist:     { type: String, required: true },
    artistId:   { type: mongoose.Schema.Types.ObjectId, ref: "Artist", default: null },
    genre:      { type: String, required: true },
    year:       { type: Number, required: true },
    file:       { type: String, required: true },
    isLiveOnly: { type: Boolean, default: false },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Song", songSchema);