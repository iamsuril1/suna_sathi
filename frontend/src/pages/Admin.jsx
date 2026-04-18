import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music2, Users, BarChart3, Plus, TrendingUp,
  Clock, ListMusic, Radio,
} from "lucide-react";
import api from "../services/api";

export default function Admin() {
  const navigate = useNavigate();

  const [stats,       setStats]       = useState({ totalSongs: 0, totalUsers: 0, totalPlaylists: 0, recentUsers: 0 });
  const [recentSongs, setRecentSongs] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [liveSession, setLiveSession] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [songsRes, usersRes, playlistRes, liveRes] = await Promise.all([
        api.get("/api/songs/all"),
        api.get("/api/admin/users/stats"),
        api.get("/api/playlists/count"),
        api.get("/api/live/session").catch(() => ({ data: { isActive: false } })),
      ]);

      const songs = songsRes.data || [];

      setStats({
        totalSongs:     songs.length,
        totalUsers:     usersRes.data.total     || 0,
        totalPlaylists: playlistRes.data.total  || 0,
        recentUsers:    usersRes.data.newUsers  || 0,
      });

      setRecentSongs(songs.slice(0, 5));
      setLiveSession(liveRes.data?.isActive ? liveRes.data : null);

      // Load recent users separately
      const usersListRes = await api.get("/api/admin/users");
      setRecentUsers((usersListRes.data || []).slice(0, 5));

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your music platform</p>
        </div>
        <div className="flex items-center gap-3">
          {liveSession?.isActive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/30">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-sm font-semibold text-red-400">Live Active</span>
            </div>
          )}
          <button
            onClick={() => navigate("/admin/add-music")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-0.5">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Music</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: <Music2 className="w-6 h-6 text-indigo-400" />, value: stats.totalSongs,     label: "Total Songs",    color: "from-indigo-500/20 to-purple-500/20", border: "hover:border-indigo-500/50", badge: null },
          { icon: <Users  className="w-6 h-6 text-purple-400" />, value: stats.totalUsers,     label: "Total Users",    color: "from-purple-500/20 to-pink-500/20",  border: "hover:border-purple-500/50", badge: `+${stats.recentUsers}` },
          { icon: <ListMusic className="w-6 h-6 text-pink-400" />, value: stats.totalPlaylists, label: "Total Playlists", color: "from-pink-500/20 to-indigo-500/20",  border: "hover:border-pink-500/50",   badge: null },
          { icon: <Clock  className="w-6 h-6 text-indigo-400" />, value: stats.recentUsers,    label: "New Users (7d)", color: "from-indigo-500/20 to-purple-500/20", border: "hover:border-indigo-500/50", badge: null },
        ].map(({ icon, value, label, color, border, badge }, i) => (
          <div key={i}
            className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${border} transition-all group`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {icon}
              </div>
              {badge && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />{badge}
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</h3>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Songs */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Songs</h2>
            <button onClick={() => navigate("/admin/add-music")}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View All
            </button>
          </div>
          {recentSongs.length === 0 ? (
            <div className="text-center py-12">
              <Music2 className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 mb-4">No songs uploaded yet</p>
              <button onClick={() => navigate("/admin/add-music")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/50 transition-all">
                Upload First Song
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSongs.map((song) => (
                <div key={song._id}
                  className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{song.name}</p>
                    <p className="text-sm text-gray-400 truncate">{song.artist} · {song.genre}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{song.year}</span>
                    {song.isLiveOnly && (
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                        LIVE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Users</h2>
            <button onClick={() => navigate("/admin/users")}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
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
                <div key={user._id}
                  className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-purple-300">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{user.name}</p>
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === "admin"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-white/5 text-gray-400 border border-white/10"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: <Music2   className="w-6 h-6 text-indigo-400" />, title: "Manage Songs",   desc: "Upload and manage music library",          color: "from-indigo-500/20 to-purple-500/20", border: "hover:border-indigo-500/50", path: "/admin/add-music" },
          { icon: <Users    className="w-6 h-6 text-purple-400" />, title: "User Management", desc: "View and manage registered users",          color: "from-purple-500/20 to-pink-500/20",  border: "hover:border-purple-500/50", path: "/admin/users" },
          { icon: <BarChart3 className="w-6 h-6 text-pink-400"  />, title: "Analytics",       desc: "View detailed statistics and insights",   color: "from-pink-500/20 to-indigo-500/20",  border: "hover:border-pink-500/50",   path: "/admin/analytics" },
          { icon: <Radio    className="w-6 h-6 text-red-400"    />, title: "Live Stream",     desc: "Broadcast music live to all users",        color: "from-red-500/20 to-pink-500/20",     border: "hover:border-red-500/50",    path: "/admin/live" },
        ].map(({ icon, title, desc, color, border, path }, i) => (
          <button key={i} onClick={() => navigate(path)}
            className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${border} transition-all text-left group`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </button>
        ))}
      </div>
    </main>
  );
}