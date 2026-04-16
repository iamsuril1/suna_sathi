const { Server }     = require("socket.io");
const jwt            = require("jsonwebtoken");
const LiveSession    = require("./models/LiveSession");
const ChatMessage    = require("./models/ChatMessage");
const Song           = require("./models/Song");
const radioScheduler = require("./services/radioScheduler");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || "http://localhost:5173",
      methods:     ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user   = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ── Radio clock ticker ─────────────────────────────────
  // Runs on the server every second, pushes song_changed when
  // the scheduler says a new song has started.
  let lastSongIndex = -1;

  const startRadioClock = async () => {
    if (!radioScheduler.loaded) await radioScheduler.load();

    setInterval(async () => {
      const session = await LiveSession.findOne({ isActive: true });
      if (!session) return;

      const state = radioScheduler.getCurrentState();
      if (!state) return;

      if (state.songIndex !== lastSongIndex) {
        lastSongIndex = state.songIndex;
        const song    = await Song.findById(state.song._id);

        io.to("live_room").emit("song_changed", {
          song,
          currentSongIndex: state.songIndex,
          currentTime:      0,      // always start from 0 when song changes
          isPlaying:        true,
        });

        console.log(
          `Radio: now playing "${song?.name}" ` +
          `(index ${state.songIndex}, pos ${state.positionInSong.toFixed(1)}s)`
        );
      }
    }, 1000); // check every second
  };

  startRadioClock();

  // ── Periodic position sync every 10s ──────────────────
  setInterval(async () => {
    const session = await LiveSession.findOne({ isActive: true });
    if (!session) return;

    const state = radioScheduler.getCurrentState();
    if (!state) return;

    io.to("live_room").emit("time_sync", {
      currentTime: state.positionInSong,
      songIndex:   state.songIndex,
    });
  }, 10000);

  io.on("connection", (socket) => {

    // ── Join live room ────────────────────────────────────
    socket.on("join_live", async () => {
      socket.join("live_room");

      const session = await LiveSession.findOne({ isActive: true });
      if (session) {
        session.listeners = (session.listeners || 0) + 1;
        await session.save();
        io.to("live_room").emit("listener_count", session.listeners);

        // Send exact radio position to this joining user
        const state = radioScheduler.getCurrentState();
        if (state) {
          const song = await Song.findById(state.song._id);
          socket.emit("sync_on_join", {
            isPlaying:   true,
            currentTime: state.positionInSong,
            song,
            songIndex:   state.songIndex,
          });
        }
      }
    });

    // ── Leave live room ───────────────────────────────────
    socket.on("leave_live", async () => {
      socket.leave("live_room");
      const session = await LiveSession.findOne({ isActive: true });
      if (session) {
        session.listeners = Math.max(0, (session.listeners || 1) - 1);
        await session.save();
        io.to("live_room").emit("listener_count", session.listeners);
      }
    });

    // ── Admin: end session ────────────────────────────────
    socket.on("admin_end_session", async () => {
      if (socket.user?.role !== "admin") return;
      await LiveSession.updateMany({ isActive: true }, { isActive: false });
      io.to("live_room").emit("session_ended");
    });

    // ── Chat ──────────────────────────────────────────────
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

    // ── Reaction ──────────────────────────────────────────
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

    // ── Disconnect ────────────────────────────────────────
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