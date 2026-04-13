const Song   = require("../models/Song");
const Artist = require("../models/Artist");
const fs     = require("fs").promises;
const path   = require("path");

/* GET ALL ARTISTS */
exports.getArtists = async (req, res) => {
  try {
    const artists = await Artist.find().sort({ name: 1 });
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch artists" });
  }
};

/* CREATE ARTIST */
exports.createArtist = async (req, res) => {
  try {
    const { name, bio, genre } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Artist name is required" });
    }

    // Check if artist already exists
    const existing = await Artist.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        message: "Artist already exists",
        artist: existing,
      });
    }

    const artist = await Artist.create({
      name:      name.trim(),
      bio:       bio?.trim() || "",
      genre:     genre?.trim() || "",
      createdBy: req.user.id,
    });

    res.status(201).json(artist);
  } catch (error) {
    res.status(500).json({ message: "Failed to create artist" });
  }
};

/* ADD SONG (ADMIN) */
exports.addSong = async (req, res) => {
  try {
    const { name, artist, artistId, genre, year, isLiveOnly } = req.body;

    if (!name || !artist || !genre || !year || !req.file) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Validate artistId if provided
    let resolvedArtistId = null;
    if (artistId) {
      const found = await Artist.findById(artistId);
      if (!found) {
        return res.status(400).json({ message: "Selected artist not found" });
      }
      resolvedArtistId = found._id;
    }

    const song = await Song.create({
      name,
      artist,
      artistId:   resolvedArtistId,
      genre,
      year,
      file:       req.file.filename,
      isLiveOnly: isLiveOnly === "true" || isLiveOnly === true,
      createdBy:  req.user.id,
    });

    res.status(201).json(song);
  } catch (error) {
    console.error("Add song error:", error);
    res.status(500).json({ message: "Failed to add song" });
  }
};

/* GET SONGS — regular only (no live-only) */
exports.getSongs = async (req, res) => {
  try {
    const songs = await Song.find({ isLiveOnly: { $ne: true } }).sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch songs" });
  }
};

/* GET ALL SONGS INCLUDING LIVE-ONLY (ADMIN) */
exports.getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch songs" });
  }
};

/* DELETE SONG */
exports.deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const sanitizedFilename = path.basename(song.file);
    const uploadsDir        = path.resolve(__dirname, "../uploads");
    const filePath          = path.join(uploadsDir, sanitizedFilename);
    const resolvedPath      = path.resolve(filePath);

    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    try {
      await fs.unlink(resolvedPath);
    } catch (fileError) {
      console.error("Failed to delete audio file:", fileError);
    }

    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete song" });
  }
};