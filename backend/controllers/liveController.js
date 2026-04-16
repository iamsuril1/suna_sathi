const LiveSession    = require("../models/LiveSession");
const ChatMessage    = require("../models/ChatMessage");
const Song           = require("../models/Song");
const radioScheduler = require("../services/radioScheduler");

/* GET CURRENT LIVE SESSION — returns radio-clock state */
exports.getLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ isActive: true })
      .populate("hostedBy", "name");

    if (!session) return res.json({ isActive: false });

    // Ensure scheduler is loaded
    if (!radioScheduler.loaded) await radioScheduler.load();

    const state = radioScheduler.getCurrentState();
    if (!state) {
      return res.json({ isActive: false, reason: "No songs in scheduler" });
    }

    // Populate full song document
    const song = await Song.findById(state.song._id);

    res.json({
      isActive:         true,
      _id:              session._id,
      playlistName:     session.playlistName,
      hostedBy:         session.hostedBy,
      listeners:        session.listeners || 0,
      // Radio clock fields
      currentSong:      song,
      songIndex:        state.songIndex,
      positionInSong:   state.positionInSong,   // exact seconds to seek to
      isPlaying:        true,                   // radio is always playing
      streamStartUtc:   radioScheduler.streamStart.toISOString(),
      totalSongs:       radioScheduler.songs.length,
      totalDuration:    radioScheduler.totalDuration,
    });
  } catch (error) {
    console.error("getLiveSession error:", error);
    res.status(500).json({ message: "Failed to fetch live session" });
  }
};

/* START LIVE SESSION (ADMIN) */
exports.startLiveSession = async (req, res) => {
  try {
    const { playlistName } = req.body;

    await LiveSession.updateMany({ isActive: true }, { isActive: false });

    // Pre-load scheduler
    if (!radioScheduler.loaded) await radioScheduler.load();

    if (!radioScheduler.songs.length) {
      return res.status(400).json({ message: "No songs available to stream" });
    }

    const session = await LiveSession.create({
      isActive:     true,
      hostedBy:     req.user.id,
      playlistName: playlistName || "SunaSathi Radio",
      listeners:    0,
    });

    const populated = await LiveSession.findById(session._id)
      .populate("hostedBy", "name");

    const state = radioScheduler.getCurrentState();
    const song  = await Song.findById(state.song._id);

    res.status(201).json({
      ...populated.toObject(),
      currentSong:    song,
      songIndex:      state.songIndex,
      positionInSong: state.positionInSong,
      isPlaying:      true,
      streamStartUtc: radioScheduler.streamStart.toISOString(),
      totalSongs:     radioScheduler.songs.length,
    });
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
  } catch {
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
  } catch {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

/* GET RADIO STATE — lightweight poll endpoint */
exports.getRadioState = async (req, res) => {
  try {
    if (!radioScheduler.loaded) await radioScheduler.load();

    const state = radioScheduler.getCurrentState();
    if (!state) return res.json({ active: false });

    const song = await Song.findById(state.song._id).select("_id name artist genre year file duration");

    res.json({
      active:         true,
      song,
      songIndex:      state.songIndex,
      positionInSong: state.positionInSong,
      isPlaying:      true,
    });
  } catch {
    res.status(500).json({ message: "Failed to get radio state" });
  }
};