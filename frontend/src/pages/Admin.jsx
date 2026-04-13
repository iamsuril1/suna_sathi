import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music2, Users, BarChart3, Plus, TrendingUp, Clock, ListMusic, Shield } from "lucide-react";
import api from "../services/api";
import { Radio } from "lucide-react";


export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    totalPlaylists: 0,
    recentUsers: 0,
  });
  const [recentSongs, setRecentSongs] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Load all data in parallel
      const [songsRes, usersRes, playlistsRes] = await Promise.all([
        api.get("/api/songs"),
        api.get("/api/admin/users"),
        api.get("/api/playlists")
      ]);

      const songs = songsRes.data || [];
      const users = usersRes.data || [];
      const playlists = playlistsRes.data || [];

      // Calculate stats from real data
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentUserCount = users.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= last7Days;
      }).length;

      setStats({
        totalSongs: songs.length,
        totalUsers: users.length,
        totalPlaylists: playlists.length,
        recentUsers: recentUserCount,
      });

      setRecentSongs(songs.slice(0, 5));
      setRecentUsers(users.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-400">Loading dashboard...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-4 sm:px-6 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your music platform</p>
        </div>

        <button
          onClick={() => navigate("/admin/add-music")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Music</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 backdrop-blur-xl">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Songs */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-indigo-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music2 className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.totalSongs.toLocaleString()}</h3>
          <p className="text-sm text-gray-400">Total Songs</p>
        </div>

        {/* Total Users */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-purple-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{stats.recentUsers}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-sm text-gray-400">Total Users</p>
        </div>

        {/* Total Playlists */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListMusic className="w-6 h-6 text-pink-400" />
            </div>
            <span className="text-xs text-gray-500">Platform</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.totalPlaylists.toLocaleString()}</h3>
          <p className="text-sm text-gray-400">Total Playlists</p>
        </div>

        {/* New Users (7 days) */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-indigo-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.recentUsers.toLocaleString()}</h3>
          <p className="text-sm text-gray-400">New Users</p>
        </div>
      </div>

      {/* Recent Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Songs */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Songs</h2>
            <button
              onClick={() => navigate("/admin/add-music")}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All
            </button>
          </div>

          {recentSongs.length === 0 ? (
            <div className="text-center py-12">
              <Music2 className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500">No songs uploaded yet</p>
              <button
                onClick={() => navigate("/admin/add-music")}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all"
              >
                Upload Your First Song
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSongs.map((song) => (
                <div
                  key={song._id || song.id}
                  className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-6 h-6 text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{song.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {song.artist} • {song.genre}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-400">{song.year}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Users</h2>
            <button
              onClick={() => navigate("/admin/users")}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Manage Users
            </button>
          </div>

          {recentUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500">No users yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user._id || user.id}
                  className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-purple-300">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{user.name}</p>
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      {user.role}
                    </span>
                    {user.blocked && (
                      <span className="block text-xs text-red-400 mt-1">Blocked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate("/admin/add-music")}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-indigo-500/50 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Music2 className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Manage Songs</h3>
          <p className="text-sm text-gray-400">Upload, edit, and organize your music library</p>
        </button>

        <button
          onClick={() => navigate("/admin/users")}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-purple-500/50 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">User Management</h3>
          <p className="text-sm text-gray-400">View and manage registered users</p>
        </button>

        <button
          onClick={() => navigate("/admin/analytics")}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-6 h-6 text-pink-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Analytics</h3>
          <p className="text-sm text-gray-400">View detailed statistics and insights</p>
        </button>
        <button
  onClick={() => navigate("/admin/live")}
  className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-red-500/50 transition-all text-left group"
>
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
    <Radio className="w-6 h-6 text-red-400" />
  </div>
  <h3 className="text-lg font-bold text-white mb-2">Live Stream</h3>
  <p className="text-sm text-gray-400">Broadcast music live to all users in real-time</p>
</button>
      </div>
    </main>
  );
}