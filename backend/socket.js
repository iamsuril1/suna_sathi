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
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // Auth middleware
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

  // ── Radio clock — checks every second for song changes ──
  let lastSongIndex = -1;

  const startRadioClock = async () => {
    if (!radioScheduler.loaded) {
      try { await radioScheduler.load(); } catch { return; }
    }

    setInterval(async () => {
      try {
        const session = await LiveSession.findOne({ isActive: true });
        if (!session) return;

        const state = radioScheduler.getCurrentState();
        if (!state) return;

        if (state.songIndex !== lastSongIndex) {
          lastSongIndex = state.songIndex;
          const song    = await Song.findById(state.song._id);
          if (!song) return;

          io.to("live_room").emit("song_changed", {
            song,
            currentSongIndex: state.songIndex,
            currentTime:      0,
            isPlaying:        true,
          });

          console.log(
            `📻 Radio: "${song.name}" (index ${state.songIndex}, ` +
            `pos ${state.positionInSong.toFixed(1)}s)`
          );
        }
      } catch (err) {
        console.error("Radio clock error:", err.message);
      }
    }, 1000);
  };

  startRadioClock();

  // ── Periodic position sync every 10s ──────────────────
  setInterval(async () => {
    try {
      const session = await LiveSession.findOne({ isActive: true });
      if (!session) return;

      const state = radioScheduler.getCurrentState();
      if (!state) return;

      io.to("live_room").emit("time_sync", {
        currentTime: state.positionInSong,
        songIndex:   state.songIndex,
      });
    } catch { /* silent */ }
  }, 10000);

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.user?.id}`);

    // ── Join live room ─────────────────────────────────
    socket.on("join_live", async () => {
      try {
        socket.join("live_room");

        const session = await LiveSession.findOne({ isActive: true });
        if (!session) return;

        session.listeners = (session.listeners || 0) + 1;
        await session.save();
        io.to("live_room").emit("listener_count", session.listeners);

        // Send exact current radio position to joining user
        const state = radioScheduler.getCurrentState();
        if (state) {
          const song = await Song.findById(state.song._id);
          if (song) {
            socket.emit("sync_on_join", {
              isPlaying:   true,
              currentTime: state.positionInSong,
              song,
              songIndex:   state.songIndex,
            });
          }
        }
      } catch (err) {
        console.error("join_live error:", err.message);
      }
    });

    // ── Leave live room ────────────────────────────────
    socket.on("leave_live", async () => {
      try {
        socket.leave("live_room");
        const session = await LiveSession.findOne({ isActive: true });
        if (session) {
          session.listeners = Math.max(0, (session.listeners || 1) - 1);
          await session.save();
          io.to("live_room").emit("listener_count", session.listeners);
        }
      } catch { /* silent */ }
    });

    // ── Admin: end session ─────────────────────────────
    socket.on("admin_end_session", async () => {
      if (socket.user?.role !== "admin") return;
      try {
        await LiveSession.updateMany({ isActive: true }, { isActive: false });
        io.to("live_room").emit("session_ended");
        console.log("📻 Live session ended by admin");
      } catch (err) {
        console.error("admin_end_session error:", err.message);
      }
    });

    // ── Chat ───────────────────────────────────────────
    socket.on("send_message", async ({ message }) => {
      if (!message?.trim()) return;
      try {
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
      } catch (err) {
        console.error("send_message error:", err.message);
      }
    });

    // ── Reaction ───────────────────────────────────────
    socket.on("send_reaction", async ({ reaction }) => {
      const allowed = ["❤️", "🔥", "🎵", "👏", "😍"];
      if (!allowed.includes(reaction)) return;
      try {
        const session = await LiveSession.findOne({ isActive: true });
        if (!session) return;

        io.to("live_room").emit("new_reaction", {
          userId:   socket.user.id,
          userName: socket.user.name || "User",
          reaction,
        });
      } catch { /* silent */ }
    });

    // ── Disconnect ─────────────────────────────────────
    socket.on("disconnect", async () => {
      try {
        const rooms = Array.from(socket.rooms);
        if (rooms.includes("live_room")) {
          const session = await LiveSession.findOne({ isActive: true });
          if (session) {
            session.listeners = Math.max(0, (session.listeners || 1) - 1);
            await session.save();
            io.to("live_room").emit("listener_count", session.listeners);
          }
        }
      } catch { /* silent */ }
      console.log(`🔌 Socket disconnected: ${socket.user?.id}`);
    });
  });

  return io;
};