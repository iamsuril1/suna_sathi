import { useEffect, useRef, useState, useCallback } from "react";
import {
  Radio, Music2, Users, Send, Volume2,
  ArrowLeft, Play, Pause, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { connectSocket } from "../services/socket";
import { liveAudio } from "../services/liveAudio";
import api from "../services/api";

const REACTIONS = ["❤️", "🔥", "🎵", "👏", "😍"];

const pad2 = (n) => String(Math.floor(Math.max(0, n))).padStart(2, "0");
const fmt  = (s) => `${pad2(s / 60)}:${pad2(s % 60)}`;

export default function Live() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef  = useRef(null);
  const chatEndRef = useRef(null);

  const [session,           setSession]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [currentSong,       setCurrentSong]       = useState(null);
  const [isPlaying,         setIsPlaying]         = useState(false);
  const [currentTime,       setCurrentTime]       = useState(0);
  const [duration,          setDuration]          = useState(0);
  const [progress,          setProgress]          = useState(0);
  const [volume,            setVolume]            = useState(0.8);
  const [listenerCount,     setListenerCount]     = useState(0);
  const [messages,          setMessages]          = useState([]);
  const [messageInput,      setMessageInput]      = useState("");
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [sessionEnded,      setSessionEnded]      = useState(false);
  const [needsInteraction,  setNeedsInteraction]  = useState(false);

  // ── Sync liveAudio state → React ──────────────────────
  useEffect(() => {
    const unsub = liveAudio.subscribeLive(() => {
      setIsPlaying(liveAudio.liveIsPlaying);
      setCurrentTime(liveAudio.liveCurrentTime);
      setDuration(liveAudio.liveDuration);
      if (liveAudio.liveDuration > 0) {
        setProgress((liveAudio.liveCurrentTime / liveAudio.liveDuration) * 100);
      }
    });
    return unsub;
  }, []);

  useEffect(() => { liveAudio.setLiveVolume(volume); }, [volume]);

  // ── Load session & auto-play from server position ─────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/live/session");

        if (!res.data.isActive) {
          setLoading(false);
          return;
        }

        setSession(res.data);
        setCurrentSong(res.data.currentSong);
        setListenerCount(res.data.listeners || 0);

        // Seek to exact server-estimated position and play
        const seekTo = res.data.estimatedCurrentTime || 0;
        try {
          await liveAudio.loadLiveAndPlay(res.data.currentSong, seekTo);
          setNeedsInteraction(false);
        } catch {
          // Browser blocked autoplay — show tap-to-play banner
          setNeedsInteraction(true);
        }

        const chatRes = await api.get("/api/live/chat");
        setMessages(chatRes.data || []);
      } catch (err) {
        console.error("Failed to load live session:", err);
      } finally {
        setLoading(false);
      }
    };
    load();

    // When leaving page, do NOT stop audio — it keeps playing
    return () => {};
  }, []);

  // ── Socket ─────────────────────────────────────────────
  useEffect(() => {
    if (!session?.isActive) return;

    const token  = localStorage.getItem("token");
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.emit("join_live");

    socket.on("listener_count", setListenerCount);

    // Server sends exact current position when we join
    socket.on("sync_on_join", async ({ isPlaying: playing, currentTime: ct, song }) => {
      if (song) setCurrentSong(song);
      try {
        if (playing) {
          await liveAudio.loadLiveAndPlay(song || currentSong, ct);
          setNeedsInteraction(false);
        } else {
          liveAudio.seekLive(ct);
          liveAudio.pauseLive();
        }
      } catch {
        setNeedsInteraction(true);
      }
    });

    // Admin play/pause broadcast
    socket.on("sync_playback", async ({ isPlaying: playing, currentTime: ct }) => {
      try {
        if (playing) {
          liveAudio.seekLive(ct);
          await liveAudio.resumeLive();
          setNeedsInteraction(false);
        } else {
          liveAudio.seekLive(ct);
          liveAudio.pauseLive();
        }
      } catch {
        setNeedsInteraction(true);
      }
    });

    // Admin changed to a different song — jump to start of new song
    socket.on("song_changed", async ({ song, currentTime: ct, isPlaying: playing }) => {
      setCurrentSong(song);
      try {
        await liveAudio.loadLiveAndPlay(song, ct || 0);
        setNeedsInteraction(false);
        if (!playing) liveAudio.pauseLive();
      } catch {
        setNeedsInteraction(true);
      }
    });

    // Periodic time correction from admin
    socket.on("time_sync", ({ currentTime: ct }) => {
      // Only correct if drift > 3 seconds
      if (Math.abs(liveAudio.liveCurrentTime - ct) > 3) {
        liveAudio.seekLive(ct);
      }
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("new_reaction", ({ reaction }) => {
      const id = Date.now() + Math.random();
      setFloatingReactions((prev) => [...prev, { id, reaction }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    socket.on("session_ended", () => {
      setSessionEnded(true);
      liveAudio.stopLive();
    });

    return () => {
      // Leave room but keep audio playing
      socket.emit("leave_live");
      socket.off("listener_count");
      socket.off("sync_on_join");
      socket.off("sync_playback");
      socket.off("song_changed");
      socket.off("time_sync");
      socket.off("new_message");
      socket.off("new_reaction");
      socket.off("session_ended");
    };
  }, [session?.isActive]);

  // ── Media Session API (lock screen controls) ──────────
  useEffect(() => {
    if (!currentSong || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  currentSong.name   || "Live Stream",
      artist: currentSong.artist || "SunaSathi Live",
      album:  session?.playlistName || "Live Session",
    });
    navigator.mediaSession.setActionHandler("play",  () => {
      liveAudio.resumeLive().catch(() => {});
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      liveAudio.pauseLive();
    });
  }, [currentSong, session]);

  // ── Chat scroll ────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUserPlay = async () => {
    try {
      // Seek to current estimated server position before resuming
      const res = await api.get("/api/live/session");
      const seekTo = res.data.estimatedCurrentTime || liveAudio.liveCurrentTime;
      await liveAudio.loadLiveAndPlay(currentSong, seekTo);
      setNeedsInteraction(false);
    } catch (err) {
      console.error("Play failed:", err);
    }
  };

  const sendMessage = () => {
    const msg = messageInput.trim();
    if (!msg || !socketRef.current) return;
    socketRef.current.emit("send_message", { message: msg });
    setMessageInput("");
  };

  const sendReaction = (reaction) => {
    socketRef.current?.emit("send_reaction", { reaction });
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-400">Joining live stream...</span>
        </div>
      </main>
    );
  }

  // ── No session ─────────────────────────────────────────
  if (!session?.isActive || sessionEnded) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <Radio className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">
            {sessionEnded ? "Stream Ended" : "No Live Stream"}
          </h1>
          <p className="text-gray-400 mb-8">
            {sessionEnded
              ? "The admin has ended the live stream. Thanks for listening!"
              : "There's no active live stream right now. Check back later."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-0.5"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // ── Main UI ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white flex flex-col">

      {/* Header */}
      <div className="bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm font-semibold text-red-400 uppercase tracking-widest">Live</span>
          </div>
          <span className="text-white font-semibold hidden sm:block">
            {session.playlistName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Users className="w-4 h-4" />
          <span>{listenerCount} listening</span>
        </div>
      </div>

      {/* Needs interaction banner */}
      {needsInteraction && (
        <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-indigo-300">
            Tap play to start listening from where the stream is right now
          </p>
          <button
            onClick={handleUserPlay}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-all flex-shrink-0"
          >
            <Play className="w-4 h-4" />
            Play
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Player */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">

          {/* Floating reactions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {floatingReactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-24 text-3xl animate-bounce"
                style={{ left: `${15 + Math.random() * 70}%`, animationDuration: "0.8s" }}
              >
                {r.reaction}
              </div>
            ))}
          </div>

          {/* Album art */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 flex items-center justify-center mb-8 border border-white/10 shadow-2xl shadow-indigo-500/20">
            <Music2 className="w-20 h-20 text-white/10" />
            {isPlaying && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-end gap-1">
                {[3, 5, 8, 6, 4, 7, 5, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-white/60 rounded-full animate-pulse"
                    style={{ height: `${h * 3}px`, animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
            )}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#0B0F1A] border border-white/10 rounded-full text-xs text-gray-400 whitespace-nowrap">
              Hosted by{" "}
              <span className="text-white font-medium">{session.hostedBy?.name}</span>
            </div>
          </div>

          {/* Song info */}
          <div className="text-center mb-5 mt-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {currentSong?.name || "Loading..."}
            </h2>
            <p className="text-gray-400 text-lg">{currentSong?.artist}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {currentSong?.genre && (
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 border border-white/10">
                  {currentSong.genre}
                </span>
              )}
              {currentSong?.year && (
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 border border-white/10">
                  {currentSong.year}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar — display only, not seekable by user */}
          <div className="w-full max-w-md mb-1">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1.5">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 w-full max-w-md mb-6">
            <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xs text-gray-400 w-9 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/*
            Local play/pause — only controls user's local audio.
            The admin controls the actual stream state.
            No "pause" button shown — user either listens or stops
            listening. They can go play another song instead.
          */}
          <div className="mb-6">
            {needsInteraction || !isPlaying ? (
              <button
                onClick={handleUserPlay}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/40 hover:scale-105 transition-all"
                title="Play from current position"
              >
                <Play className="w-6 h-6 ml-0.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm font-medium text-red-400">Streaming Live</span>
              </div>
            )}
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-3">
            {REACTIONS.map((r) => (
              <button
                key={r}
                onClick={() => sendReaction(r)}
                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-[#0B0F1A]/50 h-[380px] lg:h-auto">
          <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
            <h3 className="font-semibold text-white">Live Chat</h3>
            <p className="text-xs text-gray-500">{messages.length} messages</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-8">
                No messages yet. Be the first!
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg._id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-300">
                    {msg.userName?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-semibold ${msg.userId === user?._id ? "text-indigo-400" : "text-gray-300"}`}>
                        {msg.userId === user?._id ? "You" : msg.userName}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Say something..."
                maxLength={300}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white transition-all hover:shadow-lg hover:shadow-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}