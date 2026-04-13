import { useEffect, useRef, useState, useCallback } from "react";
import {
  Radio, Music2, Play, Pause, SkipBack, SkipForward,
  Users, Square, ArrowLeft, ListMusic, Volume2,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../services/socket";
import { liveAudio } from "../services/liveAudio";
import api from "../services/api";

export default function AdminLive() {
  const navigate        = useNavigate();
  const socketRef       = useRef(null);
  const syncIntervalRef = useRef(null);

  const [session,            setSession]            = useState(null);
  const [playlists,          setPlaylists]          = useState([]);
  const [songs,              setSongs]              = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [starting,           setStarting]           = useState(false);
  const [currentSong,        setCurrentSong]        = useState(null);
  const [currentSongIndex,   setCurrentSongIndex]   = useState(0);
  const [isPlaying,          setIsPlaying]          = useState(false);
  const [currentTime,        setCurrentTime]        = useState(0);
  const [duration,           setDuration]           = useState(0);
  const [progress,           setProgress]           = useState(0);
  const [volume,             setVolume]             = useState(0.8);
  const [listenerCount,      setListenerCount]      = useState(0);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [sessionName,        setSessionName]        = useState("Live Session");
  const [error,              setError]              = useState("");

  const pad2 = (n) => String(Math.floor(Math.max(0, n))).padStart(2, "0");
  const fmt  = (s) => `${pad2(s / 60)}:${pad2(s % 60)}`;

  // ── Sync liveAudio state into React ───────────────────
  useEffect(() => {
    const unsub = liveAudio.subscribe(() => {
      setIsPlaying(liveAudio.isPlaying);
      setCurrentTime(liveAudio.currentTime);
      setDuration(liveAudio.duration);
      if (liveAudio.duration > 0) {
        setProgress((liveAudio.currentTime / liveAudio.duration) * 100);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    liveAudio.setVolume(volume);
  }, [volume]);

  // ── Load data ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [sessionRes, playlistRes, songsRes] = await Promise.all([
          api.get("/api/live/session"),
          api.get("/api/playlists"),
          api.get("/api/songs/all"),
        ]);

        setSongs(songsRes.data   || []);
        setPlaylists(playlistRes.data || []);

        if (sessionRes.data.isActive) {
          setSession(sessionRes.data);
          setCurrentSong(sessionRes.data.currentSong);
          setCurrentSongIndex(sessionRes.data.currentSongIndex || 0);
          setListenerCount(sessionRes.data.listeners || 0);

          // Resume audio if already live
          if (sessionRes.data.currentSong && sessionRes.data.isPlaying) {
            await liveAudio.loadAndPlay(
              sessionRes.data.currentSong,
              sessionRes.data.estimatedCurrentTime || 0
            );
          }
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Socket ─────────────────────────────────────────────
  useEffect(() => {
    if (!session?.isActive) return;

    const token  = localStorage.getItem("token");
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.emit("join_live");
    socket.on("listener_count", setListenerCount);

    // Sync time every 5s
    syncIntervalRef.current = setInterval(() => {
      if (!liveAudio.paused) {
        socket.emit("admin_sync_time", { currentTime: liveAudio.currentTime });
      }
    }, 5000);

    return () => {
      clearInterval(syncIntervalRef.current);
      socket.emit("leave_live");
      socket.off("listener_count");
    };
  }, [session?.isActive]);

  // ── Helpers ────────────────────────────────────────────
  const resolveFullSong = useCallback(
    (songOrId) => {
      if (!songOrId) return null;
      if (typeof songOrId === "object" && songOrId.file) return songOrId;
      const id = typeof songOrId === "object" ? songOrId._id : songOrId;
      return songs.find((s) => s._id === id) || null;
    },
    [songs]
  );

  // ── Controls ───────────────────────────────────────────
  const startSession = async () => {
    if (!songs.length) { setError("No songs available"); return; }
    setStarting(true);
    setError("");
    try {
      const res = await api.post("/api/live/start", {
        playlistId:   selectedPlaylistId === "__live_only__" ? null : selectedPlaylistId || null,
        playlistName: sessionName,
        liveOnly:     selectedPlaylistId === "__live_only__",
      });
      setSession(res.data);
      setCurrentSong(res.data.currentSong);
      setCurrentSongIndex(0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start session");
    } finally {
      setStarting(false);
    }
  };

  const endSession = async () => {
    if (!window.confirm("End the live session? All listeners will be disconnected.")) return;
    try {
      await api.post("/api/live/end");
      socketRef.current?.emit("admin_end_session");
      clearInterval(syncIntervalRef.current);
      liveAudio.pause();
      setSession(null);
      setCurrentSong(null);
      setIsPlaying(false);
    } catch {
      setError("Failed to end session");
    }
  };

  const togglePlay = async () => {
    const newPlaying = !liveAudio.isPlaying;
    if (newPlaying) {
      await liveAudio.play();
    } else {
      liveAudio.pause();
    }
    socketRef.current?.emit("admin_play_pause", {
      isPlaying:   newPlaying,
      currentTime: liveAudio.currentTime,
    });
  };

  const changeSong = useCallback(async (index) => {
    if (!session?.playlist?.length) return;
    const songEntry = session.playlist[index];
    const full      = resolveFullSong(songEntry);

    setCurrentSongIndex(index);
    if (full) {
      setCurrentSong(full);
      await liveAudio.loadAndPlay(full, 0);
    }

    socketRef.current?.emit("admin_change_song", { songIndex: index });
  }, [session, resolveFullSong]);

  const handleNext = useCallback(() => {
    if (!session?.playlist?.length) return;
    changeSong((currentSongIndex + 1) % session.playlist.length);
  }, [session, currentSongIndex, changeSong]);

  const handlePrev = useCallback(() => {
    if (!session?.playlist?.length) return;
    const prev = currentSongIndex === 0
      ? session.playlist.length - 1
      : currentSongIndex - 1;
    changeSong(prev);
  }, [session, currentSongIndex, changeSong]);

  const seek = (e) => {
    if (!liveAudio.duration) return;
    const rect    = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * liveAudio.duration;
    liveAudio.seekTo(newTime);
    socketRef.current?.emit("admin_sync_time", { currentTime: newTime });
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-4 sm:px-6 md:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate("/admin")}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/50 flex-shrink-0">
          <Radio className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Live Stream Control</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Broadcast music to all listeners in real-time
          </p>
        </div>
        {session?.isActive && (
          <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm font-semibold text-red-400">LIVE</span>
            <span className="text-sm text-gray-400 ml-1 hidden sm:inline">
              {listenerCount} listeners
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* ── Setup Panel (no active session) ── */}
      {!session?.isActive ? (
        <div className="max-w-xl">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">

            {/* Panel header */}
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Start a Live Stream</h2>
              <p className="text-gray-400 text-sm mt-1">
                Users will see a notification and can join instantly.
              </p>
            </div>

            <div className="px-6 py-6 space-y-5">

              {/* Session name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Name
                </label>
                <input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. Friday Night Vibes"
                  className="w-full px-4 py-3 bg-[#0B0F1A] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                />
              </div>

              {/* Playlist source — clean custom select */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Music Source
                </label>
                <div className="relative">
                  <select
                    value={selectedPlaylistId}
                    onChange={(e) => setSelectedPlaylistId(e.target.value)}
                    className="w-full appearance-none px-4 py-3 pr-10 bg-[#0B0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm cursor-pointer"
                  >
                    <option value="">
                      All Regular Songs ({songs.filter((s) => !s.isLiveOnly).length} songs)
                    </option>
                    {songs.filter((s) => s.isLiveOnly).length > 0 && (
                      <option value="__live_only__">
                        🔴 Live Only Songs ({songs.filter((s) => s.isLiveOnly).length} songs)
                      </option>
                    )}
                    {playlists.length > 0 && (
                      <optgroup label="──── Your Playlists ────">
                        {playlists.map((p) => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.name} ({p.songs?.length || 0} songs)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                {selectedPlaylistId === "__live_only__" && (
                  <p className="text-xs text-red-400/80 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    Live Only songs are hidden from the regular music library
                  </p>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="px-3 py-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-lg font-bold text-white">
                    {songs.filter((s) => !s.isLiveOnly).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Regular</p>
                </div>
                <div className="px-3 py-3 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                  <p className="text-lg font-bold text-red-400">
                    {songs.filter((s) => s.isLiveOnly).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Live Only</p>
                </div>
                <div className="px-3 py-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-lg font-bold text-white">{playlists.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Playlists</p>
                </div>
              </div>

              {/* Go live button */}
              <button
                onClick={startSession}
                disabled={starting || !songs.length}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
              >
                {starting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Radio className="w-5 h-5" />
                )}
                {starting ? "Starting..." : "Go Live"}
              </button>
            </div>
          </div>
        </div>

      ) : (

        /* ── Active session ── */
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* Player */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">

            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold">Now Playing</h2>
                <p className="text-sm text-gray-400 mt-0.5">{session.playlistName}</p>
              </div>
              <button
                onClick={endSession}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium transition-all text-sm"
              >
                <Square className="w-4 h-4" />
                End Stream
              </button>
            </div>

            {/* Album art */}
            <div className="relative w-48 h-48 mx-auto rounded-2xl bg-gradient-to-br from-red-500/20 via-pink-500/20 to-indigo-500/20 flex items-center justify-center mb-6 border border-white/10">
              <Music2 className="w-16 h-16 text-white/10" />
              {isPlaying && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1">
                  {[3, 5, 8, 5, 3].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-red-400/70 rounded-full animate-pulse"
                      style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Song info */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-1">
                {currentSong?.name || "No song selected"}
              </h3>
              <p className="text-gray-400 text-sm">{currentSong?.artist}</p>
              <p className="text-xs text-gray-600 mt-1">
                Track {currentSongIndex + 1} of {session.playlist?.length}
              </p>
            </div>

            {/* Seekbar */}
            <div className="mb-1">
              <div
                className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative group"
                onClick={seek}
              >
                <div
                  className="h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, marginLeft: "-8px" }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-6 mb-5">
              <button
                onClick={handlePrev}
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-xl shadow-red-500/40 hover:shadow-red-500/60 transition-all hover:scale-105 flex items-center justify-center"
              >
                {isPlaying
                  ? <Pause className="w-7 h-7" />
                  : <Play  className="w-7 h-7 ml-0.5" />}
              </button>
              <button
                onClick={handleNext}
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 mb-8">
              <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-red-500"
              />
              <span className="text-xs text-gray-400 w-9 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{listenerCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Listeners</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{session.playlist?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Songs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{currentSongIndex + 1}</p>
                <p className="text-xs text-gray-500 mt-0.5">Current</p>
              </div>
            </div>
          </div>

          {/* Playlist sidebar */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[680px]">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
              <ListMusic className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-white text-sm">Playlist</h3>
              <span className="text-xs text-gray-500 ml-auto">
                {session.playlist?.length} songs
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {(session.playlist || []).map((songEntry, index) => {
                const s      = resolveFullSong(songEntry);
                if (!s) return null;
                const active = index === currentSongIndex;
                return (
                  <button
                    key={s._id || index}
                    onClick={() => changeSong(index)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-left ${
                      active ? "bg-red-500/10" : ""
                    }`}
                  >
                    {/* Index / playing indicator */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        active
                          ? "bg-red-500/20 text-red-400"
                          : "bg-white/5 text-gray-600"
                      }`}
                    >
                      {active && isPlaying ? (
                        <div className="flex items-end gap-px">
                          {[2, 3, 2].map((h, i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-red-400 rounded-full animate-pulse"
                              style={{ height: `${h * 3}px` }}
                            />
                          ))}
                        </div>
                      ) : (
                        index + 1
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          active ? "text-red-300" : "text-white"
                        }`}
                      >
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{s.artist}</p>
                    </div>

                    {s.isLiveOnly && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 flex-shrink-0">
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}