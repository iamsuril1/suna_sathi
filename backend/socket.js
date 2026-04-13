const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const LiveSession = require("./models/LiveSession");
const ChatMessage = require("./models/ChatMessage");
const Song = require("./models/Song");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // Server-side playback clock — source of truth for ALL clients
  let playbackClock = {
    isPlaying:     false,
    currentTime:   0,       // position when isPlaying last changed or sync received
    lastUpdatedAt: Date.now(), // wall-clock ms when currentTime was recorded
    songId:        null,
    song:          null,
  };

  // Calculate real current position right now
  const livePosition = () => {
    if (!playbackClock.isPlaying) return playbackClock.currentTime;
    const elapsed = (Date.now() - playbackClock.lastUpdatedAt) / 1000;
    return playbackClock.currentTime + elapsed;
  };

  io.on("connection", (socket) => {

    // ── Join live room ──────────────────────────────────
    socket.on("join_live", async () => {
      socket.join("live_room");

      const session = await LiveSession.findOne({ isActive: true });
      if (session) {
        session.listeners = (session.listeners || 0) + 1;
        await session.save();
        io.to("live_room").emit("listener_count", session.listeners);

        // Send exact current position to the joining user
        socket.emit("sync_on_join", {
          isPlaying:   playbackClock.isPlaying,
          currentTime: livePosition(),
          song:        playbackClock.song,
          songId:      playbackClock.songId,
        });
      }
    });

    // ── Leave live room ─────────────────────────────────
    socket.on("leave_live", async () => {
      socket.leave("live_room");
      const session = await LiveSession.findOne({ isActive: true });
      if (session) {
        session.listeners = Math.max(0, (session.listeners || 1) - 1);
        await session.save();
        io.to("live_room").emit("listener_count", session.listeners);
      }
    });

    // ── Admin: play/pause ───────────────────────────────
    socket.on("admin_play_pause", async ({ isPlaying, currentTime }) => {
      if (socket.user?.role !== "admin") return;

      const session = await LiveSession.findOne({ isActive: true });
      if (!session) return;

      session.isPlaying   = isPlaying;
      session.currentTime = currentTime || 0;
      await session.save();

      playbackClock = {
        isPlaying,
        currentTime:   currentTime || 0,
        lastUpdatedAt: Date.now(),
        songId:        session.currentSong?.toString(),
        song:          playbackClock.song,
      };

      io.to("live_room").emit("sync_playback", {
        isPlaying,
        currentTime: currentTime || 0,
        songId:      session.currentSong?.toString(),
      });
    });

    // ── Admin: change song ──────────────────────────────
    socket.on("admin_change_song", async ({ songIndex }) => {
      if (socket.user?.role !== "admin") return;

      const session = await LiveSession.findOne({ isActive: true })
        .populate("playlist");
      if (!session || !session.playlist.length) return;

      const idx  = Math.max(0, Math.min(songIndex, session.playlist.length - 1));
      const song = await Song.findById(session.playlist[idx]._id || session.playlist[idx]);

      session.currentSongIndex = idx;
      session.currentSong      = song._id;
      session.currentTime      = 0;
      session.isPlaying        = true;
      await session.save();

      playbackClock = {
        isPlaying:     true,
        currentTime:   0,
        lastUpdatedAt: Date.now(),
        songId:        song._id.toString(),
        song,
      };

      io.to("live_room").emit("song_changed", {
        song,
        currentSongIndex: idx,
        currentTime:      0,
        isPlaying:        true,
      });
    });

    // ── Admin: periodic time sync (every 5s) ────────────
    socket.on("admin_sync_time", async ({ currentTime }) => {
      if (socket.user?.role !== "admin") return;

      const session = await LiveSession.findOne({ isActive: true });
      if (!session) return;

      session.currentTime = currentTime;
      await session.save();

      playbackClock.currentTime   = currentTime;
      playbackClock.lastUpdatedAt = Date.now();

      // Only non-admin listeners need the sync
      socket.to("live_room").emit("time_sync", { currentTime });
    });

    // ── Admin: end session ──────────────────────────────
    socket.on("admin_end_session", async () => {
      if (socket.user?.role !== "admin") return;
      await LiveSession.updateMany({ isActive: true }, { isActive: false });
      playbackClock = {
        isPlaying: false, currentTime: 0,
        lastUpdatedAt: Date.now(), songId: null, song: null,
      };
      io.to("live_room").emit("session_ended");
    });

    // ── Chat message ────────────────────────────────────
    socket.on("send_message", async ({ message }) => {
      if (!message?.trim()) return;
      const session = await LiveSession.findOne({ isActive: true });
      if (!session) return;

      const sanitized = String(message).trim().slice(0, 300);
      const chatMsg   = await ChatMessage.create({
        sessionId: session._id,
        userId:    socket.user.id,
        userName:  socket.user.name || "User",
        message:   sanitized,
        type:      "message",
      });

      io.to("live_room").emit("new_message", {
        _id:       chatMsg._id,
        userId:    socket.user.id,
        userName:  socket.user.name || "User",
        message:   sanitized,
        type:      "message",
        createdAt: chatMsg.createdAt,
      });
    });

    // ── Reaction ────────────────────────────────────────
    socket.on("send_reaction", async ({ reaction }) => {
      const allowed = ["❤️", "🔥", "🎵", "👏", "😍"];
      if (!allowed.includes(reaction)) return;
      const session = await LiveSession.findOne({ isActive: true });
      if (!session) return;
      io.to("live_room").emit("new_reaction", {
        userId:   socket.user.id,
        userName: socket.user.name || "User",
        reaction,
      });
    });

    // ── Disconnect ──────────────────────────────────────
    socket.on("disconnect", async () => {
      const rooms = Array.from(socket.rooms);
      if (rooms.includes("live_room")) {
        const session = await LiveSession.findOne({ isActive: true });
        if (session) {
          session.listeners = Math.max(0, (session.listeners || 1) - 1);
          await session.save();
          io.to("live_room").emit("listener_count", session.listeners);
        }
      }
    });
  });

  return io;
};