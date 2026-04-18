import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft, Search, Music2, Heart, Plus, Share2,
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  ListMusic, X, ChevronRight, Volume2, Clock,
  LayoutGrid, LayoutList, Mic2, ChevronUp, Radio,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import ShareModal from "../components/ShareModal";
import { liveAudio } from "../services/liveAudio";
import { useAuth } from "../context/AuthContext";

const AUDIOBASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads`;

const RECENT_KEY = "recentSongIds";
const MAX_RECENT = 6;

const pad2       = (n) => String(n).padStart(2, "0");
const formatMMSS = (seconds) => {
  const s  = Math.max(0, Number(seconds) || 0);
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${pad2(mm)}:${pad2(ss)}`;
};

const fetchAudioDuration = (url) =>
  new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.src     = url;
    a.onloadedmetadata = () => resolve(a.duration || 0);
    a.onerror          = () => resolve(0);
  });

export default function Dashboard() {
  const { likedSongIds, toggleLike } = useAuth();

  // ── Data ───────────────────────────────────────────────
  const [songs,            setSongs]            = useState([]);
  const [playlists,        setPlaylists]        = useState([]);
  const [songDurations,    setSongDurations]    = useState({});
  const [loadingDurations, setLoadingDurations] = useState(false);
  const [availableGenres,  setAvailableGenres]  = useState(["All Tracks"]);

  // ── View state ─────────────────────────────────────────
  const [mode,             setMode]             = useState("all");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [activeGenre,      setActiveGenre]      = useState("All Tracks");
  const [searchQuery,      setSearchQuery]      = useState("");
  const [viewMode,         setViewMode]         = useState("list");
  const [view,             setView]             = useState("list");

  // ── Player state (synced from liveAudio singleton) ─────
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(0.7);

  // ── Modals ─────────────────────────────────────────────
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong,      setSelectedSong]      = useState(null);
  const [showShareModal,    setShowShareModal]     = useState(false);
  const [shareSong,         setShareSong]          = useState(null);

  // ── Playback options ───────────────────────────────────
  const [isShuffle,  setIsShuffle]  = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // off | all | one

  // ── Recently played ────────────────────────────────────
  const [recentSongIds, setRecentSongIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
    catch { return []; }
  });

  // ── Sleep timer ────────────────────────────────────────
  const [timerActive,           setTimerActive]           = useState(false);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  const [showTimerModal,        setShowTimerModal]        = useState(false);
  const timerRef = useRef(null);

  // ── Live session notification ──────────────────────────
  const [liveSession,      setLiveSession]      = useState(null);
  const [liveBarDismissed, setLiveBarDismissed] = useState(false);
  const [liveStreamActive, setLiveStreamActive] = useState(false);

  // ── Subscribe to normal audio state ───────────────────
  useEffect(() => {
    const unsub = liveAudio.subscribeNormal(() => {
      setIsPlaying(liveAudio.normalIsPlaying);
      setCurrentTime(liveAudio.normalCurrentTime);
      setDuration(liveAudio.normalDuration);
      if (liveAudio.normalDuration > 0) {
        setProgress((liveAudio.normalCurrentTime / liveAudio.normalDuration) * 100);
      }
    });
    return unsub;
  }, []);

  // ── Volume ─────────────────────────────────────────────
  useEffect(() => {
    liveAudio.setNormalVolume(volume);
  }, [volume]);

  // ── Recent songs persistence ───────────────────────────
  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentSongIds));
  }, [recentSongIds]);

  // ── Sleep timer ────────────────────────────────────────
  const cancelTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimerActive(false);
    setTimerRemainingSeconds(0);
  }, []);

  const startTimerMinutes = useCallback((minutes) => {
    const m = Number(minutes);
    if (!Number.isFinite(m) || m <= 0) return;
    const endAt = Date.now() + Math.round(m * 60) * 1000;
    cancelTimer();
    setTimerActive(true);
    setTimerRemainingSeconds(Math.round(m * 60));
    setShowTimerModal(false);
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((endAt - Date.now()) / 1000);
      if (remaining <= 0) {
        liveAudio.pauseNormal();
        setIsPlaying(false);
        cancelTimer();
        return;
      }
      setTimerRemainingSeconds(remaining);
    }, 1000);
  }, [cancelTimer]);

  useEffect(() => () => cancelTimer(), [cancelTimer]);

  // ── Helpers ────────────────────────────────────────────
  const pushRecent = useCallback((songId) => {
    if (!songId) return;
    setRecentSongIds((prev) =>
      [songId, ...prev.filter((id) => id !== songId)].slice(0, MAX_RECENT)
    );
  }, []);

  const normalizePlaylist = useCallback(
    (p) => ({ ...p, id: p?._id || p?.id }),
    []
  );

  // ── Data loading ───────────────────────────────────────
  const loadDurations = useCallback(async (songList) => {
    if (!songList.length) return;
    setLoadingDurations(true);
    const entries = await Promise.all(
      songList.map(async (s) => {
        const url = `${AUDIOBASE}/${encodeURIComponent(s.file)}`;
        const dur = await fetchAudioDuration(url);
        return [s._id, dur];
      })
    );
    setSongDurations(Object.fromEntries(entries));
    setLoadingDurations(false);
  }, []);

  const loadSongs = useCallback(async () => {
    const [songsRes, genresRes] = await Promise.all([
      api.get("/api/songs"),
      api.get("/api/songs/genres"),
    ]);
    const list = songsRes.data || [];
    setSongs(list);
    loadDurations(list);
    setAvailableGenres(["All Tracks", ...(genresRes.data || [])]);
  }, [loadDurations]);

  const refreshPlaylists = useCallback(async () => {
    const res = await api.get("/api/playlists");
    setPlaylists((res.data || []).map(normalizePlaylist));
  }, [normalizePlaylist]);

  // ── Poll live session every 30s ────────────────────────
  useEffect(() => {
    const checkLive = async () => {
      try {
        const res = await api.get("/api/live/session");
        if (res.data?.isActive) {
          setLiveSession(res.data);
          setLiveStreamActive(true);
        } else {
          setLiveSession(null);
          setLiveStreamActive(false);
        }
      } catch {
        setLiveSession(null);
        setLiveStreamActive(false);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([loadSongs(), refreshPlaylists()]);
  }, []);

  // ── Derived state ──────────────────────────────────────
  const queue = useMemo(() => {
    if (mode === "playlist") return selectedPlaylist?.songs || [];
    if (mode === "liked")    return songs.filter((s) => likedSongIds.includes(s._id));
    return songs;
  }, [mode, selectedPlaylist, songs, likedSongIds]);

  // Only playable (non live-only) songs in queue
  const playableQueue = useMemo(
    () => queue.filter((s) => !s.isLiveOnly),
    [queue]
  );

  const currentIndex = useMemo(() => {
    if (!currentSong?._id) return -1;
    return playableQueue.findIndex((s) => s._id === currentSong._id);
  }, [playableQueue, currentSong?._id]);

  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return queue.filter((song) => {
      if (song.isLiveOnly) return false; // never show live-only in user library
      const matchesSearch =
        !q ||
        song.name?.toLowerCase().includes(q) ||
        song.artist?.toLowerCase().includes(q) ||
        song.genre?.toLowerCase().includes(q);
      const matchesGenre =
        activeGenre === "All Tracks" || song.genre === activeGenre;
      return matchesSearch && matchesGenre;
    });
  }, [queue, activeGenre, searchQuery]);

  const recentlyPlayed = useMemo(() => {
    const map = new Map(songs.map((s) => [s._id, s]));
    return recentSongIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .filter((s) => !s.isLiveOnly && s._id !== currentSong?._id);
  }, [songs, recentSongIds, currentSong?._id]);

  const artists = useMemo(() => {
    const map = {};
    songs.forEach((s) => {
      if (!s.artist || s.isLiveOnly) return;
      if (!map[s.artist]) map[s.artist] = { name: s.artist, songs: [], genres: new Set() };
      map[s.artist].songs.push(s);
      if (s.genre) map[s.artist].genres.add(s.genre);
    });
    return Object.values(map).sort((a, b) => b.songs.length - a.songs.length);
  }, [songs]);

  const totalQueueDuration = useMemo(
    () => filteredSongs.reduce((sum, s) => sum + (songDurations[s._id] || 0), 0),
    [filteredSongs, songDurations]
  );

  // ── Playback controls ──────────────────────────────────
  const playSong = useCallback(async (song) => {
    if (!song?._id || !song.file) return;
    if (song.isLiveOnly) return; // guard: never play live-only in normal player

    setCurrentSong(song);
    setProgress(0);
    setCurrentTime(0);
    setView("player");
    pushRecent(song._id);

    try {
      await liveAudio.loadNormalAndPlay(song, 0);
    } catch (err) {
      console.warn("Play failed:", err);
    }
  }, [pushRecent]);

  const togglePlay = useCallback(async () => {
    if (!currentSong) return;
    if (liveAudio.normalIsPlaying) {
      liveAudio.pauseNormal();
      setIsPlaying(false);
    } else {
      try {
        await liveAudio.resumeNormal();
        setIsPlaying(true);
      } catch { setIsPlaying(false); }
    }
  }, [currentSong]);

  const handleNext = useCallback(() => {
    if (!playableQueue.length) return;
    if (isShuffle && playableQueue.length > 1) {
      playSong(playableQueue[Math.floor(Math.random() * playableQueue.length)]);
      return;
    }
    const nextIndex = (currentIndex + 1) % playableQueue.length;
    if (repeatMode === "off" && nextIndex === 0 && currentIndex !== -1) {
      liveAudio.pauseNormal();
      setIsPlaying(false);
      return;
    }
    playSong(playableQueue[nextIndex]);
  }, [playableQueue, currentIndex, isShuffle, repeatMode, playSong]);

  const handlePrev = useCallback(() => {
    if (!playableQueue.length) return;
    if (liveAudio.normalCurrentTime > 3) {
      liveAudio.seekNormal(0);
      return;
    }
    const prevIndex = currentIndex <= 0
      ? playableQueue.length - 1
      : currentIndex - 1;
    playSong(playableQueue[prevIndex]);
  }, [playableQueue, currentIndex, playSong]);

  const seek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    const t    = pct * liveAudio.normalDuration;
    liveAudio.seekNormal(t);
  }, []);

  // Handle song ended for repeat one
  useEffect(() => {
    const unsub = liveAudio.subscribeNormal((event) => {
      if (event === "ended") {
        if (repeatMode === "one") {
          liveAudio.seekNormal(0);
          liveAudio.resumeNormal().catch(() => {});
        } else {
          handleNext();
        }
      }
    });
    return unsub;
  }, [repeatMode, handleNext]);

  // ── Playlist helpers ───────────────────────────────────
  const openAddToPlaylist = async (song) => {
    setSelectedSong(song);
    await refreshPlaylists();
    setShowPlaylistModal(true);
  };

  const addSongToPlaylist = async (playlistId) => {
    const song = selectedSong || currentSong;
    if (!song?._id) return;
    await api.post(`/api/playlists/${playlistId}/songs`, { songId: song._id });
    setShowPlaylistModal(false);
    setSelectedSong(null);
    await refreshPlaylists();
  };

  const openShareModal = (song) => {
    setShareSong(song);
    setShowShareModal(true);
  };

  // ── Artist color helper ────────────────────────────────
  const artistColor = (name) => {
    const colors = [
      "from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30",
      "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
      "from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30",
      "from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30",
      "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
    ];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  };

  const showMiniPlayer = !!currentSong && view !== "player";

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#0B0F1A] text-white flex flex-col">

      {/* ── Live Stream Notification Bar ── */}
      {liveSession?.isActive && !liveBarDismissed && (
        <div className="relative z-40 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20 border-b border-red-500/30 backdrop-blur-xl flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm font-bold text-red-400 uppercase tracking-widest">
                  Live Now
                </span>
              </div>
              <div className="h-4 w-px bg-white/20 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-white text-sm font-medium truncate">
                  🎵 {liveSession.playlistName || "Live Session"}
                </span>
                <span className="text-gray-400 text-xs ml-2 hidden sm:inline">
                  hosted by {liveSession.hostedBy?.name} · {liveSession.listeners || 0} listening
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/live"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-all shadow-lg shadow-red-500/40"
              >
                <Radio className="w-4 h-4" />
                Join Stream
              </Link>
              <button
                onClick={() => setLiveBarDismissed(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body (sidebar + content) ── */}
      <div className={`flex flex-1 overflow-hidden ${showMiniPlayer ? "pb-[88px]" : ""}`}>

        <Sidebar
          playlists={playlists}
          activeMode={mode}
          activePlaylistId={selectedPlaylist?.id || null}
          onHome={() => { setMode("all"); setSelectedPlaylist(null); setView("list"); }}
          onSelectPlaylist={(p) => {
            const n = normalizePlaylist(p);
            setMode("playlist");
            setSelectedPlaylist(n);
            setView("list");
          }}
          onSelectLiked={() => { setMode("liked"); setSelectedPlaylist(null); setView("list"); }}
          onPlaylistsChanged={refreshPlaylists}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              LIST VIEW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {view === "list" && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
              <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow">
                        <Music2 className="w-4 h-4 inline mr-1.5" />Songs
                      </button>
                      <button
                        onClick={() => setView("artists")}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-all">
                        <Mic2 className="w-4 h-4 inline mr-1.5" />Artists
                      </button>
                    </div>
                    <h1 className="text-2xl font-bold">
                      {mode === "playlist"
                        ? selectedPlaylist?.name || "Playlist"
                        : mode === "liked" ? "Liked Songs" : "Browse Music"}
                    </h1>
                  </div>

                  <div className="flex items-center gap-3 lg:ml-auto">
                    <div className="relative flex-1 lg:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search songs or artists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
                        title="List view">
                        <LayoutList className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
                        title="Grid view">
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{filteredSongs.length} songs</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {loadingDurations
                      ? "Loading durations..."
                      : `Total: ${formatMMSS(totalQueueDuration)}`}
                  </span>
                  {artists.length > 0 && (
                    <><span>·</span><span>{artists.length} artists</span></>
                  )}
                </div>

                {/* Genre pills — dynamic from API */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {availableGenres.map((g) => (
                    <button
                      key={g}
                      onClick={() => setActiveGenre(g)}
                      className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        activeGenre === g
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                {/* Empty state */}
                {filteredSongs.length === 0 ? (
                  <div className="text-center py-20">
                    <Music2 className="w-16 h-16 mx-auto text-gray-700 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No songs found</h3>
                    <p className="text-gray-500">
                      {songs.length === 0
                        ? "Upload songs as admin to get started"
                        : "Try a different search or genre"}
                    </p>
                  </div>

                ) : viewMode === "list" ? (

                  /* ── TABLE ── */
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">Title</div>
                      <div className="col-span-3">Artist</div>
                      <div className="col-span-2">Genre</div>
                      <div className="col-span-1 text-right">
                        <Clock className="w-3.5 h-3.5 inline" />
                      </div>
                    </div>
                    <div className="divide-y divide-white/5">
                      {filteredSongs.map((song, index) => {
                        const dur     = songDurations[song._id];
                        const active  = currentSong?._id === song._id;
                        const playing = active && isPlaying;
                        return (
                          <div
                            key={song._id}
                            onClick={() => playSong(song)}
                            className={`grid grid-cols-12 gap-4 px-6 py-3.5 hover:bg-white/5 cursor-pointer transition-all group ${active ? "bg-indigo-500/5" : ""}`}
                          >
                            <div className="col-span-1 flex items-center text-gray-400">
                              {playing ? (
                                <div className="flex items-center gap-0.5">
                                  {[3, 4, 2].map((h, i) => (
                                    <div key={i}
                                      className="w-1 bg-indigo-400 rounded-full animate-pulse"
                                      style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
                                  ))}
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm group-hover:hidden">{index + 1}</span>
                                  <Play className="w-4 h-4 hidden group-hover:block text-white" />
                                </>
                              )}
                            </div>
                            <div className="col-span-5 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Music2 className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <p className={`font-medium truncate text-sm ${active ? "text-indigo-300" : "text-white"}`}>
                                  {song.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{song.year}</p>
                              </div>
                            </div>
                            <div className="col-span-3 flex items-center">
                              <span className="text-gray-300 truncate text-sm">{song.artist}</span>
                            </div>
                            <div className="col-span-2 flex items-center">
                              <span className="text-xs text-gray-400 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                                {song.genre}
                              </span>
                            </div>
                            <div className="col-span-1 flex items-center justify-end gap-1.5">
                              <span className="text-gray-400 text-xs">
                                {dur !== undefined ? formatMMSS(dur) : "--:--"}
                              </span>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleLike(song._id); }}
                                  className="p-1 rounded hover:bg-white/10">
                                  <Heart className={`w-3.5 h-3.5 ${likedSongIds.includes(song._id) ? "text-red-400 fill-red-400" : "text-gray-400"}`} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openAddToPlaylist(song); }}
                                  className="p-1 rounded hover:bg-white/10">
                                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openShareModal(song); }}
                                  className="p-1 rounded hover:bg-white/10">
                                  <Share2 className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                ) : (

                  /* ── GRID ── */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredSongs.map((song) => {
                      const dur     = songDurations[song._id];
                      const active  = currentSong?._id === song._id;
                      const playing = active && isPlaying;
                      return (
                        <div
                          key={song._id}
                          onClick={() => playSong(song)}
                          className={`group relative flex flex-col rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 overflow-hidden ${
                            active
                              ? "border-indigo-500/50 bg-indigo-500/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="relative aspect-square bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Music2 className="w-10 h-10 text-white/20" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {playing ? (
                                <div className="flex items-end gap-0.5 h-6">
                                  {[3, 5, 4].map((h, i) => (
                                    <div key={i}
                                      className="w-1 bg-white rounded-full animate-pulse"
                                      style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
                                  ))}
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                  <Play className="w-5 h-5 text-white ml-0.5" />
                                </div>
                              )}
                            </div>
                            {playing && (
                              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-indigo-500 rounded-full text-xs text-white font-semibold">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />NOW
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white/80">
                              {dur !== undefined ? formatMMSS(dur) : "--:--"}
                            </div>
                          </div>
                          <div className="p-3 flex flex-col gap-1">
                            <p className={`font-medium text-sm truncate ${active ? "text-indigo-300" : "text-white"}`}>
                              {song.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-white/5 rounded border border-white/10">
                                {song.genre}
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleLike(song._id); }}
                                  className="p-1 rounded hover:bg-white/10">
                                  <Heart className={`w-3.5 h-3.5 ${likedSongIds.includes(song._id) ? "text-red-400 fill-red-400" : "text-gray-400"}`} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openAddToPlaylist(song); }}
                                  className="p-1 rounded hover:bg-white/10">
                                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openShareModal(song); }}
                                  className="p-1 rounded hover:bg-white/10">
                                  <Share2 className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ARTISTS VIEW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {view === "artists" && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setView("list")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors border border-white/10">
                    <ArrowLeft className="w-4 h-4" />Back
                  </button>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Mic2 className="w-6 h-6 text-purple-400" />Artists
                  </h1>
                  <span className="text-sm text-gray-500">{artists.length} artists</span>
                </div>

                {artists.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    No artists yet. Upload songs to see artists.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {artists.map((artist) => {
                      const colorClass = artistColor(artist.name);
                      const artistDur  = artist.songs.reduce(
                        (sum, s) => sum + (songDurations[s._id] || 0), 0
                      );
                      return (
                        <div
                          key={artist.name}
                          onClick={() => { setSearchQuery(artist.name); setView("list"); }}
                          className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer transition-all hover:-translate-y-1"
                        >
                          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center border text-3xl font-bold`}>
                            {artist.name[0]?.toUpperCase()}
                          </div>
                          <div className="text-center min-w-0 w-full">
                            <p className="font-semibold text-white text-sm truncate">{artist.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{artist.songs.length} songs</p>
                            {artistDur > 0 && (
                              <p className="text-xs text-gray-600">{formatMMSS(artistDur)}</p>
                            )}
                            <div className="flex flex-wrap gap-1 justify-center mt-2">
                              {[...artist.genres].slice(0, 2).map((g) => (
                                <span key={g}
                                  className="text-xs px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-gray-400">
                                  {g}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              FULL PLAYER VIEW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {view === "player" && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
              <div className="max-w-7xl mx-auto">
                <button
                  onClick={() => setView("list")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 mb-6">
                  <ArrowLeft className="w-4 h-4" />Back to songs
                </button>

                <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-6">

                  {/* LEFT — Queue + Recent */}
                  <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white text-sm">Up Next</h3>
                        <ListMusic className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {playableQueue.slice(currentIndex + 1).slice(0, 5).map((song) => (
                          <button key={song._id} onClick={() => playSong(song)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <Music2 className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate text-white">{song.name}</p>
                              <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {songDurations[song._id] !== undefined
                                ? formatMMSS(songDurations[song._id])
                                : "--:--"}
                            </span>
                          </button>
                        ))}
                        {playableQueue.slice(currentIndex + 1).length === 0 && (
                          <p className="text-xs text-gray-600 text-center py-4">No songs up next</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                      <h3 className="font-semibold text-white text-sm mb-3">Recently Played</h3>
                      <div className="space-y-1">
                        {recentlyPlayed.length === 0 ? (
                          <p className="text-xs text-gray-500">No recent songs yet.</p>
                        ) : recentlyPlayed.slice(0, 5).map((song) => (
                          <button key={song._id} onClick={() => playSong(song)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                              <Music2 className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate text-white">{song.name}</p>
                              <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {songDurations[song._id] !== undefined
                                ? formatMMSS(songDurations[song._id])
                                : "--:--"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CENTER — Player */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                    {/* Status badge */}
                    <div className="flex items-center justify-center mb-5">
                      {isPlaying ? (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/30">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                            Now Playing
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          <span className="text-xs text-gray-500 uppercase tracking-widest">Paused</span>
                        </div>
                      )}
                    </div>

                    {/* Album art */}
                    <div className="relative aspect-square max-w-xs mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Music2 className="w-24 h-24 text-white/10" />
                      {isPlaying && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1">
                          {[3, 5, 8, 6, 4, 7, 5, 3].map((h, i) => (
                            <div key={i}
                              className="w-1.5 bg-white/50 rounded-full animate-pulse"
                              style={{ height: `${h * 3}px`, animationDelay: `${i * 0.08}s` }} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Song info */}
                    <div className="text-center mb-5">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {currentSong?.name || "Select a song"}
                      </h2>
                      <p className="text-gray-400">{currentSong?.artist}</p>
                      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10">
                          {currentSong?.genre}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10">
                          {currentSong?.year}
                        </span>
                        {songDurations[currentSong?._id] !== undefined && (
                          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-xs text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatMMSS(songDurations[currentSong._id])}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div
                        className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer relative group"
                        onClick={seek}>
                        <div
                          className="absolute left-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }} />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `${progress}%`, marginLeft: "-7px" }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
                      <span>{formatMMSS(currentTime)}</span>
                      <span>{formatMMSS(duration)}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-3 mb-5">
                      <button
                        onClick={() => setIsShuffle((s) => !s)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isShuffle
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}>
                        <Shuffle className="w-4 h-4" />
                      </button>
                      <button onClick={handlePrev}
                        className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button
                        onClick={togglePlay}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all hover:scale-105 flex items-center justify-center">
                        {isPlaying
                          ? <Pause className="w-6 h-6" />
                          : <Play  className="w-6 h-6 ml-0.5" />}
                      </button>
                      <button onClick={handleNext}
                        className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
                        <SkipForward className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setRepeatMode((m) =>
                            m === "off" ? "all" : m === "all" ? "one" : "off"
                          )
                        }
                        className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all ${
                          repeatMode !== "off"
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}>
                        <Repeat className="w-4 h-4" />
                        {repeatMode === "one" && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ fontSize: "8px" }}>
                            1
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-3 mb-5">
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <input
                        type="range" min={0} max={1} step={0.01} value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="flex-1 accent-indigo-500" />
                      <span className="text-xs text-gray-400 w-9 text-right">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>

                    {/* Sleep timer */}
                    <div className="pt-5 border-t border-white/10">
                      {timerActive ? (
                        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            <div>
                              <p className="text-xs text-gray-400">Sleep Timer</p>
                              <p className="text-lg font-semibold text-white">
                                {formatMMSS(timerRemainingSeconds)}
                              </p>
                            </div>
                          </div>
                          <button onClick={cancelTimer}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowTimerModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">Set Sleep Timer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT — Actions */}
                  <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                      <h3 className="font-semibold text-white text-sm mb-3">Actions</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            icon: (
                              <Heart className={`w-5 h-5 ${
                                likedSongIds.includes(currentSong?._id)
                                  ? "text-red-400 fill-red-400"
                                  : "text-gray-400"
                              }`} />
                            ),
                            label: "Like",
                            action: () => currentSong?._id && toggleLike(currentSong._id),
                          },
                          {
                            icon: <Plus className="w-5 h-5 text-gray-400" />,
                            label: "Add",
                            action: () => openAddToPlaylist(currentSong),
                          },
                          {
                            icon: <Share2 className="w-5 h-5 text-gray-400" />,
                            label: "Share",
                            action: () => openShareModal(currentSong),
                          },
                        ].map(({ icon, label, action }) => (
                          <button key={label} onClick={action}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                            {icon}
                            <span className="text-xs text-gray-400">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {currentSong?.artist && (
                      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                        <h3 className="font-semibold text-white text-sm mb-3">Artist</h3>
                        <div
                          onClick={() => { setSearchQuery(currentSong.artist); setView("list"); }}
                          className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl p-2 -m-2 transition-colors">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${artistColor(currentSong.artist)} flex items-center justify-center text-xl font-bold border`}>
                            {currentSong.artist[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm">{currentSong.artist}</p>
                            <p className="text-xs text-gray-400">
                              {songs.filter((s) => s.artist === currentSong.artist && !s.isLiveOnly).length} songs
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    )}

                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                      <h3 className="font-semibold text-white text-sm mb-3">Song Info</h3>
                      <div className="space-y-2">
                        {[
                          ["Genre",    currentSong?.genre],
                          ["Year",     currentSong?.year],
                          ["Duration", songDurations[currentSong?._id] !== undefined
                            ? formatMMSS(songDurations[currentSong._id])
                            : "Loading..."],
                        ].map(([label, val]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">{label}</span>
                            <span className="text-gray-300 text-xs font-medium">{val || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Return to live stream card */}
                    {liveStreamActive && (
                      <Link
                        to="/live"
                        className="block bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/20 p-5 hover:bg-red-500/20 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Radio className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              <p className="text-sm font-semibold text-red-300">Live Stream Active</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {liveSession?.playlistName || "Tap to rejoin"}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-red-400" />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              MINI PLAYER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {showMiniPlayer && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1120]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">

              {/* Seek bar */}
              <div
                className="w-full h-1 bg-white/10 cursor-pointer group relative"
                onClick={seek}>
                <div
                  className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${progress}%` }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, marginLeft: "-6px" }} />
              </div>

              <div className="flex items-center gap-3 px-4 sm:px-6 py-3">

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 border border-white/10">
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5">
                      {[2, 3, 2].map((h, i) => (
                        <div key={i}
                          className="w-1 bg-indigo-400 rounded-full animate-pulse"
                          style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  ) : (
                    <Music2 className="w-5 h-5 text-indigo-400" />
                  )}
                </div>

                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate leading-tight">
                    {currentSong.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
                  {/* Live stream hint */}
                  {liveStreamActive && liveAudio.liveActive && (
                    <p className="text-xs text-red-400/70 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block flex-shrink-0" />
                      Live stream paused locally
                    </p>
                  )}
                </div>

                {/* Time */}
                <div className="hidden sm:flex flex-col items-end text-xs flex-shrink-0 min-w-[68px] text-right">
                  <span className="text-white font-medium tabular-nums">{formatMMSS(currentTime)}</span>
                  <span className="text-gray-500 tabular-nums">{formatMMSS(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={handlePrev}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                    {isPlaying
                      ? <Pause className="w-5 h-5" />
                      : <Play  className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button onClick={handleNext}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all">
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Return to live */}
                {liveStreamActive && (
                  <Link
                    to="/live"
                    className="w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-all flex-shrink-0"
                    title="Return to live stream">
                    <Radio className="w-4 h-4" />
                  </Link>
                )}

                {/* Open full player */}
                <button
                  onClick={() => setView("player")}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all flex-shrink-0"
                  title="Open full player">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Modals ── */}
          {showPlaylistModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-[#0d1120] rounded-2xl p-6 w-full max-w-md border border-white/10">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">Add to playlist</h2>
                  <button onClick={() => setShowPlaylistModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {playlists.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No playlists yet. Create one from the sidebar.
                    </p>
                  ) : playlists.map((p) => (
                    <button key={p.id} onClick={() => addSongToPlaylist(p.id)}
                      className="flex items-center gap-3 w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-indigo-500/50">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <span className="text-sm font-bold text-purple-300">
                          {p.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.songs?.length || 0} songs</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showTimerModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-[#0d1120] rounded-2xl p-6 w-full max-w-xs border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Sleep Timer</h2>
                  <button onClick={() => setShowTimerModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">Stop playback after</p>
                <div className="space-y-2">
                  {[5, 10, 15, 30, 45, 60].map((m) => (
                    <button key={m} onClick={() => startTimerMinutes(m)}
                      className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-indigo-500/50 text-white text-sm font-medium">
                      {m} minutes
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showShareModal && (
            <ShareModal
              song={shareSong}
              onClose={() => { setShowShareModal(false); setShareSong(null); }}
            />
          )}
        </div>
      </div>
    </main>
  );
}