const Song           = require("../models/Song");
const Artist         = require("../models/Artist");
const fs             = require("fs").promises;
const path           = require("path");
const radioScheduler = require("../services/radioScheduler");
const { execFile }   = require("child_process");
const util           = require("util");
const execFileAsync  = util.promisify(execFile);

async function extractDuration(filePath) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const dur = parseFloat(stdout.trim());
    return isNaN(dur) ? 0 : dur;
  } catch {
    return 0;
  }
}

/* GET ALL ARTISTS */
exports.getArtists = async (req, res) => {
  try {
    const artists = await Artist.find().sort({ name: 1 });
    // Add song count per artist
    const artistsWithCount = await Promise.all(
      artists.map(async (a) => {
        const count = await Song.countDocuments({ artistId: a._id });
        return { ...a.toObject(), songCount: count };
      })
    );
    res.json(artistsWithCount);
  } catch {
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

    const existing = await Artist.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ message: "Artist already exists", artist: existing });
    }

    // Handle uploaded photo
    const photo = req.file ? `artists/${req.file.filename}` : "";

    const artist = await Artist.create({
      name:      name.trim(),
      bio:       bio?.trim()   || "",
      genre:     genre?.trim() || "",
      photo,
      createdBy: req.user.id,
    });

    res.status(201).json(artist);
  } catch {
    res.status(500).json({ message: "Failed to create artist" });
  }
};

/* UPDATE ARTIST PHOTO */
exports.updateArtistPhoto = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    // Delete old photo
    if (artist.photo) {
      const oldPath = path.join(__dirname, "../uploads", artist.photo);
      try { await fs.unlink(oldPath); } catch {}
    }

    artist.photo = `artists/${req.file.filename}`;
    await artist.save();

    res.json(artist);
  } catch {
    res.status(500).json({ message: "Failed to update artist photo" });
  }
};

/* ADD SONG (ADMIN) */
exports.addSong = async (req, res) => {
  try {
    const { name, artist, artistId, genre, year, isLiveOnly } = req.body;

    if (!name || !artist || !genre || !year || !req.file) {
      return res.status(400).json({ message: "All fields required" });
    }

    let resolvedArtistId = null;
    if (artistId) {
      const found = await Artist.findById(artistId);
      if (!found) return res.status(400).json({ message: "Selected artist not found" });
      resolvedArtistId = found._id;
    }

    // Extract duration
    const filePath = path.join(__dirname, "../uploads/audio", req.file.filename);
    const duration = await extractDuration(filePath);

    const song = await Song.create({
      name,
      artist,
      artistId:   resolvedArtistId,
      genre,
      year,
      file:       `audio/${req.file.filename}`,
      duration,
      isLiveOnly: isLiveOnly === "true" || isLiveOnly === true,
      createdBy:  req.user.id,
    });

    radioScheduler.reload().catch(console.error);

    res.status(201).json(song);
  } catch (error) {
    console.error("Add song error:", error);
    res.status(500).json({ message: "Failed to add song" });
  }
};

/* GET SONGS with search + genre filter */
exports.getSongs = async (req, res) => {
  try {
    const { search, genre } = req.query;
    const query = { isLiveOnly: { $ne: true } };

    if (search?.trim()) {
      const q = search.trim();
      query.$or = [
        { name:   { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } },
        { genre:  { $regex: q, $options: "i" } },
      ];
    }

    if (genre && genre !== "All Tracks") {
      query.genre = { $regex: new RegExp(`^${genre}$`, "i") };
    }

    const songs = await Song.find(query).sort({ createdAt: -1 });
    res.json(songs);
  } catch {
    res.status(500).json({ message: "Failed to fetch songs" });
  }
};

/* GET ALL GENRES (distinct) */
exports.getGenres = async (req, res) => {
  try {
    const genres = await Song.distinct("genre", { isLiveOnly: { $ne: true } });
    res.json(genres.filter(Boolean).sort());
  } catch {
    res.status(500).json({ message: "Failed to fetch genres" });
  }
};

/* GET ALL SONGS INCLUDING LIVE-ONLY (ADMIN) */
exports.getAllSongs = async (req, res) => {
  try {
    const { search, genre, liveOnly } = req.query;
    const query = {};

    if (liveOnly === "true") {
      query.isLiveOnly = true;
    } else if (liveOnly === "false") {
      query.isLiveOnly = { $ne: true };
    }

    if (search?.trim()) {
      const q = search.trim();
      query.$or = [
        { name:   { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } },
        { genre:  { $regex: q, $options: "i" } },
      ];
    }

    if (genre && genre !== "all") {
      query.genre = { $regex: new RegExp(`^${genre}$`, "i") };
    }

    const songs = await Song.find(query).sort({ createdAt: -1 });
    res.json(songs);
  } catch {
    res.status(500).json({ message: "Failed to fetch songs" });
  }
};

/* GET SONGS BY ARTIST */
exports.getSongsByArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const songs = await Song.find({
      artistId,
      isLiveOnly: { $ne: true },
    }).sort({ createdAt: -1 });
    res.json(songs);
  } catch {
    res.status(500).json({ message: "Failed to fetch artist songs" });
  }
};

/* DELETE SONG */
exports.deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    const sanitizedFilename = path.basename(song.file);
    const uploadsDir        = path.resolve(__dirname, "../uploads");
    const filePath          = path.join(uploadsDir, sanitizedFilename);
    const resolvedPath      = path.resolve(filePath);

    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    try { await fs.unlink(resolvedPath); } catch {}

    await Song.findByIdAndDelete(req.params.id);
    radioScheduler.reload().catch(console.error);

    res.json({ message: "Song deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete song" });
  }
};