import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Music2, Play, User, ArrowLeft, Heart, Eye } from "lucide-react";
import api from "../services/api";

export default function PublicPlaylist() {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPlaylist();
  }, [shareToken]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/api/playlists/share/${shareToken}`);
      setPlaylist(res.data);
    } catch (err) {
      console.error("Failed to load playlist:", err);
      setError(err.response?.data?.message || "Failed to load playlist");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-400">Loading playlist...</span>
        </div>
      </main>
    );
  }

  if (error || !playlist) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
            <Music2 className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <p className="text-gray-400 mb-8">
            {error || "This playlist doesn't exist or has been made private."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-0.5"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-4 sm:px-6 md:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors border border-white/10"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Playlist Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Playlist Cover */}
            <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
              <span className="text-6xl font-bold text-purple-300">
                {playlist.name?.[0]?.toUpperCase()}
              </span>
            </div>

            {/* Playlist Info */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-4 w-fit">
                <Music2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Public Playlist</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold mb-4">{playlist.name}</h1>

              {playlist.description && (
                <p className="text-gray-400 mb-6">{playlist.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Created by <span className="text-white font-medium">{playlist.user?.name || "Unknown"}</span></span>
                </div>

                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-purple-400" />
                  <span><span className="text-white font-medium">{playlist.songs?.length || 0}</span> songs</span>
                </div>

                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-pink-400" />
                  <span><span className="text-white font-medium">{playlist.viewCount || 0}</span> views</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-0.5"
                  type="button"
                >
                  <Play className="w-5 h-5" />
                  Play All
                </button>

                <button
                  onClick={() => navigate("/register")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  type="button"
                >
                  <Heart className="w-5 h-5" />
                  Save Playlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold">Songs</h2>
          </div>

          {playlist.songs?.length === 0 ? (
            <div className="text-center py-20">
              <Music2 className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No songs yet</h3>
              <p className="text-gray-500">This playlist is empty</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-sm font-medium text-gray-400">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Title</div>
                <div className="col-span-3">Artist</div>
                <div className="col-span-2">Genre</div>
                <div className="col-span-1">Year</div>
              </div>

              {/* Song Rows */}
              <div className="divide-y divide-white/5">
                {playlist.songs.map((song, index) => (
                  <div
                    key={song._id || index}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-all"
                  >
                    <div className="col-span-1 flex items-center text-gray-400">
                      <span className="text-sm">{index + 1}</span>
                    </div>

                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Music2 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-white">{song.name}</p>
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center">
                      <span className="text-gray-300 truncate">{song.artist}</span>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <span className="text-gray-400 truncate text-sm">{song.genre}</span>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <span className="text-gray-400 text-sm">{song.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* CTA to Register */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Create Your Own Playlists
            </span>
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Join SunaSathi to create unlimited playlists, discover new music, and share your favorite tracks with friends.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-1"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </main>
  );
}