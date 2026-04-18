const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    bio:       { type: String, default: "" },
    genre:     { type: String, default: "" },
    photo:     { type: String, default: "" }, // filename stored in uploads/artists/
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

artistSchema.index({ name: 1 });

module.exports = mongoose.model("Artist", artistSchema);