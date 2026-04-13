import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ArrowLeft, TrendingUp, Users, Music2, ListMusic, Calendar } from "lucide-react";
import api from "../services/api";

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState({
    totalSongs: 0,
    totalUsers: 0,
    totalPlaylists: 0,
    songsByGenre: [],
    usersByMonth: [],
    topArtists: [],
    userRoles: { admin: 0, user: 0 },
    userStatus: { active: 0, blocked: 0 },
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [songsRes, usersRes, playlistsRes] = await Promise.all([
        api.get("/api/songs"),
        api.get("/api/admin/users"),
        api.get("/api/playlists")
      ]);

      const songs = songsRes.data || [];
      const users = usersRes.data || [];
      const playlists = playlistsRes.data || [];

      // Songs by genre
      const genreCounts = {};
      songs.forEach(song => {
        const genre = song.genre || "Unknown";
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
      const songsByGenre = Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count);

      // Users by month (last 6 months)
      const monthCounts = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[key] = 0;
      }

      users.forEach(user => {
        const userDate = new Date(user.createdAt);
        const key = userDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthCounts.hasOwnProperty(key)) {
          monthCounts[key]++;
        }
      });

      const usersByMonth = Object.entries(monthCounts).map(([month, count]) => ({
        month,
        count
      }));

      // Top artists
      const artistCounts = {};
      songs.forEach(song => {
        const artist = song.artist || "Unknown";
        artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      });
      const topArtists = Object.entries(artistCounts)
        .map(([artist, count]) => ({ artist, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // User roles
      const userRoles = {
        admin: users.filter(u => u.role === "admin").length,
        user: users.filter(u => u.role === "user").length
      };

      // User status
      const userStatus = {
        active: users.filter(u => !u.blocked).length,
        blocked: users.filter(u => u.blocked).length
      };

      setAnalytics({
        totalSongs: songs.length,
        totalUsers: users.length,
        totalPlaylists: playlists.length,
        songsByGenre,
        usersByMonth,
        topArtists,
        userRoles,
        userStatus
      });
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Simple pie chart component
  const PieChart = ({ data, colors }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    const slices = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const largeArc = angle > 180 ? 1 : 0;

      const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);

      currentAngle += angle;

      const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);

      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      return (
        <g key={index}>
          <path
            d={pathData}
            fill={colors[index % colors.length]}
            className="transition-opacity hover:opacity-80"
          />
        </g>
      );
    });

    return (
      <div className="flex items-center gap-8">
        <svg viewBox="0 0 100 100" className="w-48 h-48">
          {slices}
        </svg>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-300">
                {item.label}: <span className="font-semibold text-white">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple bar chart component
  const BarChart = ({ data, color = "#6366F1" }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 truncate max-w-[200px]">{item.label}</span>
              <span className="font-semibold text-white">{item.value}</span>
            </div>
            <div className="w-full h-8 bg-white/5 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-500 flex items-center px-3"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  background: `linear-gradient(to right, ${color}, ${color}dd)`
                }}
              >
                <span className="text-xs text-white font-medium">
                  {((item.value / maxValue) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-400">Loading analytics...</span>
        </div>
      </main>
    );
  }

  const genreColors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];
  const roleColors = ["#6366F1", "#8B5CF6"];
  const statusColors = ["#10B981", "#EF4444"];

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-4 sm:px-6 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin")}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-500/50">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-1">Platform insights and statistics</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 backdrop-blur-xl">
          {error}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Songs</p>
              <p className="text-2xl font-bold text-white">{analytics.totalSongs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{analytics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-indigo-500/20 flex items-center justify-center">
              <ListMusic className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Playlists</p>
              <p className="text-2xl font-bold text-white">{analytics.totalPlaylists}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Songs by Genre - Pie Chart */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-indigo-400" />
            Songs by Genre
          </h2>
          {analytics.songsByGenre.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No songs data available</div>
          ) : (
            <PieChart
              data={analytics.songsByGenre.map(g => ({
                label: g.genre,
                value: g.count
              }))}
              colors={genreColors}
            />
          )}
        </div>

        {/* User Roles - Pie Chart */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            User Roles Distribution
          </h2>
          {analytics.totalUsers === 0 ? (
            <div className="text-center py-12 text-gray-500">No users data available</div>
          ) : (
            <PieChart
              data={[
                { label: "Regular Users", value: analytics.userRoles.user },
                { label: "Administrators", value: analytics.userRoles.admin }
              ]}
              colors={roleColors}
            />
          )}
        </div>

        {/* User Status - Pie Chart */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            User Status
          </h2>
          {analytics.totalUsers === 0 ? (
            <div className="text-center py-12 text-gray-500">No users data available</div>
          ) : (
            <PieChart
              data={[
                { label: "Active Users", value: analytics.userStatus.active },
                { label: "Blocked Users", value: analytics.userStatus.blocked }
              ]}
              colors={statusColors}
            />
          )}
        </div>

        {/* User Growth - Bar Chart */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            User Growth (Last 6 Months)
          </h2>
          {analytics.usersByMonth.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No growth data available</div>
          ) : (
            <BarChart
              data={analytics.usersByMonth.map(m => ({
                label: m.month,
                value: m.count
              }))}
              color="#6366F1"
            />
          )}
        </div>
      </div>

      {/* Top Artists - Bar Chart */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Music2 className="w-5 h-5 text-purple-400" />
          Top Artists by Song Count
        </h2>
        {analytics.topArtists.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No artist data available</div>
        ) : (
          <div className="max-w-3xl">
            <BarChart
              data={analytics.topArtists.map(a => ({
                label: a.artist,
                value: a.count
              }))}
              color="#8B5CF6"
            />
          </div>
        )}
      </div>

      {/* Genre Distribution - Bar Chart */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-pink-400" />
          Genre Distribution
        </h2>
        {analytics.songsByGenre.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No genre data available</div>
        ) : (
          <div className="max-w-3xl">
            <BarChart
              data={analytics.songsByGenre.map(g => ({
                label: g.genre,
                value: g.count
              }))}
              color="#EC4899"
            />
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl border border-indigo-500/20 p-6">
          <h3 className="text-lg font-bold mb-3 text-indigo-300">📊 Key Insights</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Most popular genre: <span className="font-semibold text-white">
              {analytics.songsByGenre[0]?.genre || "N/A"}
            </span> ({analytics.songsByGenre[0]?.count || 0} songs)</li>
            <li>• Top artist: <span className="font-semibold text-white">
              {analytics.topArtists[0]?.artist || "N/A"}
            </span> ({analytics.topArtists[0]?.count || 0} songs)</li>
            <li>• User to admin ratio: <span className="font-semibold text-white">
              {analytics.userRoles.admin > 0 
                ? Math.round(analytics.userRoles.user / analytics.userRoles.admin) 
                : analytics.userRoles.user}:1
            </span></li>
            <li>• Active user rate: <span className="font-semibold text-white">
              {analytics.totalUsers > 0 
                ? ((analytics.userStatus.active / analytics.totalUsers) * 100).toFixed(1) 
                : 0}%
            </span></li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
          <h3 className="text-lg font-bold mb-3 text-purple-300">💡 Recommendations</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {analytics.songsByGenre.length < 3 && (
              <li>• Consider adding more diverse genres to attract wider audience</li>
            )}
            {analytics.userStatus.blocked > 5 && (
              <li>• Review blocked users - {analytics.userStatus.blocked} users are currently blocked</li>
            )}
            {analytics.totalPlaylists < analytics.totalUsers / 2 && (
              <li>• Encourage playlist creation - only {analytics.totalPlaylists} playlists for {analytics.totalUsers} users</li>
            )}
            {analytics.topArtists.length > 0 && analytics.topArtists[0].count > analytics.totalSongs / 4 && (
              <li>• Diversify music library - top artist has {analytics.topArtists[0].count} out of {analytics.totalSongs} songs</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}