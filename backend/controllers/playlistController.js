const Playlist = require("../models/Playlist");
const crypto   = require("crypto");

/* CREATE PLAYLIST */
exports.createPlaylist = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Playlist name required" });

    const playlist = await Playlist.create({
      name,
      user: req.user.id,
    });

    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create playlist" });
  }
};

/* GET MY PLAYLISTS */
exports.getMyPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user.id })
      .populate("songs")
      .sort({ createdAt: -1 });

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch playlists" });
  }
};

/* GET ALL PLAYLISTS COUNT — for admin dashboard */
exports.getAllPlaylistsCount = async (req, res) => {
  try {
    const total    = await Playlist.countDocuments();
    const isPublic = await Playlist.countDocuments({ isPublic: true });
    res.json({ total, public: isPublic });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch playlist stats" });
  }
};

/* GET SINGLE PLAYLIST BY ID */
exports.getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("songs")
      .populate("user", "name");

    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    if (
      playlist.user._id.toString() !== req.user.id &&
      !playlist.isPublic
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch playlist" });
  }
};

/* GET PUBLIC PLAYLIST BY SHARE TOKEN */
exports.getPublicPlaylist = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const playlist = await Playlist.findOne({ shareToken })
      .populate("songs")
      .populate("user", "name");

    if (!playlist)         return res.status(404).json({ message: "Playlist not found" });
    if (!playlist.isPublic) return res.status(403).json({ message: "This playlist is private" });

    playlist.viewCount = (playlist.viewCount || 0) + 1;
    await playlist.save();

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch playlist" });
  }
};

/* MAKE PLAYLIST PUBLIC */
exports.makePlaylistPublic = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    if (!playlist.shareToken) {
      playlist.shareToken = crypto.randomBytes(16).toString("hex");
    }

    playlist.isPublic = true;
    await playlist.save();

    const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/playlist/share/${playlist.shareToken}`;

    res.json({ message: "Playlist is now public", shareToken: playlist.shareToken, shareUrl, playlist });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to make playlist public" });
  }
};

/* MAKE PLAYLIST PRIVATE */
exports.makePlaylistPrivate = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    playlist.isPublic = false;
    await playlist.save();

    res.json({ message: "Playlist is now private", playlist });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to make playlist private" });
  }
};

/* REGENERATE SHARE TOKEN */
exports.regenerateShareToken = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    playlist.shareToken = crypto.randomBytes(16).toString("hex");
    await playlist.save();

    const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/playlist/share/${playlist.shareToken}`;

    res.json({ message: "Share link regenerated", shareToken: playlist.shareToken, shareUrl, playlist });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to regenerate share token" });
  }
};

/* ADD SONG TO PLAYLIST */
exports.addSongToPlaylist = async (req, res) => {
  try {
    const { songId } = req.body;
    const playlist   = await Playlist.findById(req.params.id);

    if (!playlist)                           return res.status(404).json({ message: "Playlist not found" });
    if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });
    if (playlist.songs.includes(songId))     return res.status(400).json({ message: "Song already in playlist" });

    playlist.songs.push(songId);
    await playlist.save();

    const updated = await Playlist.findById(playlist._id).populate("songs");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to add song to playlist" });
  }
};

/* REMOVE SONG FROM PLAYLIST */
exports.removeSongFromPlaylist = async (req, res) => {
  try {
    const { songId } = req.body;
    const playlist   = await Playlist.findById(req.params.id);

    if (!playlist)                                return res.status(404).json({ message: "Playlist not found" });
    if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    playlist.songs = playlist.songs.filter((s) => s.toString() !== songId);
    await playlist.save();

    const updated = await Playlist.findById(playlist._id).populate("songs");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to remove song" });
  }
};

/* DELETE PLAYLIST */
exports.deletePlaylist = async (req, res) => {
  try {
    const result = await Playlist.findOneAndDelete({
      _id:  req.params.id,
      user: req.user.id,
    });

    if (!result) return res.status(404).json({ message: "Playlist not found" });

    res.json({ message: "Playlist deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete playlist" });
  }
};

/* UPDATE PLAYLIST DETAILS */
exports.updatePlaylist = async (req, res) => {
  try {
    const { name, description } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist)                                return res.status(404).json({ message: "Playlist not found" });
    if (playlist.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    if (name)                    playlist.name        = name.trim();
    if (description !== undefined) playlist.description = description.trim();

    await playlist.save();

    res.json({ message: "Playlist updated successfully", playlist });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update playlist" });
  }
};

/* GET PLAYLIST STATS — for admin */
exports.getPlaylistStats = async (req, res) => {
  try {
    const total  = await Playlist.countDocuments();
    const pub    = await Playlist.countDocuments({ isPublic: true });
    const priv   = total - pub;

    const topPlaylists = await Playlist.find({ isPublic: true })
      .sort({ viewCount: -1 })
      .limit(5)
      .populate("user", "name")
      .select("name viewCount songs user");

    res.json({ total, public: pub, private: priv, topPlaylists });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch playlist stats" });
  }
};