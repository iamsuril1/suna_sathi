import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Library, PlusCircle, ListMusic, Heart, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  playlists,
  activeMode       = "all",
  activePlaylistId = null,
  onHome,
  onSelectPlaylist,
  onSelectLiked,
  onPlaylistsChanged,
}) {
  const navigate = useNavigate();
  const { user, likedSongIds } = useAuth();

  const inputRef          = useRef(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [openPlaylists,   setOpenPlaylists]   = useState(true);
  const [open,            setOpen]            = useState(false);

  useEffect(() => {
    const handler = () => onPlaylistsChanged?.();
    window.addEventListener("playlistsupdated", handler);
    return () => window.removeEventListener("playlistsupdated", handler);
  }, [onPlaylistsChanged]);

  const createPlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    await api.post("/api/playlists", { name });
    setNewPlaylistName("");
    inputRef.current?.blur();
    await onPlaylistsChanged?.();
  };

  const closeDrawer = () => setOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button type="button" onClick={() => setOpen(true)}
        className="lg:hidden fixed left-4 bottom-4 z-50 p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-2xl shadow-indigo-500/50"
        aria-label="Open sidebar">
        <ListMusic className="w-6 h-6" />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <button type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={closeDrawer} aria-label="Close sidebar backdrop" />
      )}

      <aside className={[
        "bg-[#0B0F1A]/80 backdrop-blur-xl text-white border-r border-white/10",
        "flex flex-col gap-6 overflow-y-auto",
        "h-[calc(100dvh-72px)] lg:h-[calc(100vh-72px)] sticky top-[72px]",
        "w-72 lg:w-64 p-6",
        "fixed lg:sticky z-50 lg:z-40 left-0 top-[72px]",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        "transition-transform duration-300",
      ].join(" ")}>

        {/* Close button (mobile) */}
        <div className="lg:hidden flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-400">Navigation</span>
          <button type="button" onClick={closeDrawer}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          {/* Home */}
          <button type="button"
            onClick={() => { closeDrawer(); onHome?.(); }}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
              activeMode === "all"
                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/50"
                : "hover:bg-white/5 text-gray-400 hover:text-white"
            }`}>
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          {/* Library */}
          <button type="button"
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <Library className="w-5 h-5" />
            <span>Library</span>
          </button>

          {/* Admin: Add Music */}
          {user?.role === "admin" && (
            <button type="button"
              onClick={() => { closeDrawer(); navigate("/admin/add-music"); }}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <PlusCircle className="w-5 h-5" />
              <span>Add Music</span>
            </button>
          )}

          {/* Create playlist */}
          <div className="mt-6 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-white">Create Playlist</span>
            </div>
            <input
              ref={inputRef}
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); createPlaylist().catch(console.error); }
              }}
              placeholder="Playlist name..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500
                focus:outline-none focus:border-indigo-500/50 mb-2"
            />
            <button type="button"
              onClick={() => createPlaylist().catch(console.error)}
              disabled={!newPlaylistName.trim()}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium
                hover:shadow-lg hover:shadow-indigo-500/50 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed">
              Create
            </button>
          </div>

          {/* Playlists toggle */}
          <button type="button"
            onClick={() => setOpenPlaylists((v) => !v)}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all mt-4">
            <ListMusic className="w-5 h-5" />
            <span>Playlists</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-auto">
              {playlists.length}
            </span>
          </button>

          {openPlaylists && (
            <div className="space-y-1 pl-1 max-h-48 overflow-y-auto">
              {playlists.length === 0 ? (
                <p className="text-xs text-gray-600 px-3 py-2">No playlists yet</p>
              ) : playlists.map((p) => (
                <button key={p.id} type="button"
                  onClick={() => { closeDrawer(); onSelectPlaylist?.(p); }}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm ${
                    activeMode === "playlist" && activePlaylistId === p.id
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/50"
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  }`}>
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                    <span className="text-xs font-bold text-purple-300">
                      {p.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="text-xs text-gray-500">{(p.songs?.length || 0)} songs</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Liked songs */}
          <button type="button"
            onClick={() => { closeDrawer(); onSelectLiked?.(); }}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all mt-4 ${
              activeMode === "liked"
                ? "bg-gradient-to-r from-pink-500/20 to-red-500/20 text-white border border-pink-500/50"
                : "hover:bg-white/5 text-gray-400 hover:text-white"
            }`}>
            <Heart className="w-5 h-5" />
            <span>Liked Songs</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-auto">
              {likedSongIds.length}
            </span>
          </button>
        </nav>
      </aside>
    </>
  );
}