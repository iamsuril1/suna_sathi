const LiveSession = require("../models/LiveSession");
const ChatMessage = require("../models/ChatMessage");
const Song        = require("../models/Song");

/* GET CURRENT LIVE SESSION */
exports.getLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ isActive: true })
      .populate("currentSong")
      .populate("hostedBy", "name")
      .populate("playlist");

    if (!session) return res.json({ isActive: false });

    // Calculate estimated current playback time
    let estimatedTime = session.currentTime || 0;
    if (session.isPlaying && session.updatedAt) {
      const elapsed = (Date.now() - new Date(session.updatedAt).getTime()) / 1000;
      estimatedTime = Math.max(0, (session.currentTime || 0) + elapsed);
    }

    res.json({
      ...session.toObject(),
      estimatedCurrentTime: estimatedTime,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch live session" });
  }
};

/* START LIVE SESSION (ADMIN) */
exports.startLiveSession = async (req, res) => {
  try {
    const { playlistId, playlistName, liveOnly } = req.body;

    await LiveSession.updateMany({ isActive: true }, { isActive: false });

    let songs = [];

    if (liveOnly) {
      const liveSongs = await Song.find({ isLiveOnly: true }).select("_id");
      songs = liveSongs.map((s) => s._id);
    } else if (playlistId) {
      const Playlist = require("../models/Playlist");
      const playlist = await Playlist.findById(playlistId).populate("songs");
      if (playlist) songs = playlist.songs.map((s) => s._id);
    }

    if (!songs.length) {
      const allSongs = await Song.find({ isLiveOnly: { $ne: true } }).select("_id");
      songs = allSongs.map((s) => s._id);
    }

    if (!songs.length) {
      const allSongs = await Song.find().select("_id");
      songs = allSongs.map((s) => s._id);
    }

    if (!songs.length) {
      return res.status(400).json({ message: "No songs available to stream" });
    }

    const session = await LiveSession.create({
      isActive:         true,
      hostedBy:         req.user.id,
      playlist:         songs,
      playlistName:     playlistName || "Live Session",
      currentSong:      songs[0],
      currentSongIndex: 0,
      isPlaying:        false,
      currentTime:      0,
      listeners:        0,
    });

    const populated = await LiveSession.findById(session._id)
      .populate("currentSong")
      .populate("hostedBy", "name")
      .populate("playlist");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Start live error:", error);
    res.status(500).json({ message: "Failed to start live session" });
  }
};

/* END LIVE SESSION (ADMIN) */
exports.endLiveSession = async (req, res) => {
  try {
    await LiveSession.updateMany({ isActive: true }, { isActive: false });
    res.json({ message: "Live session ended" });
  } catch (error) {
    res.status(500).json({ message: "Failed to end live session" });
  }
};

/* GET CHAT MESSAGES */
exports.getChatMessages = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ isActive: true });
    if (!session) return res.json([]);

    const messages = await ChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};