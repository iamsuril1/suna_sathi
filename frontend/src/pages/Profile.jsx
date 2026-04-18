import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Save, Heart, Music2 } from "lucide-react";
import api from "../services/api";

export default function Profile() {
  const { user, booting, updateProfile, refreshMe, likedSongIds } = useAuth();

  const initial = useMemo(() => {
    const full  = user?.name || "";
    const parts = full.split(" ").filter(Boolean);
    return {
      firstName:          parts.slice(0, -1).join(" ") || parts[0] || "",
      lastName:           parts.length > 1 ? parts[parts.length - 1] : "",
      email:              user?.email || "",
      currentPassword:    "",
      newPassword:        "",
      confirmNewPassword: "",
    };
  }, [user?.name, user?.email]);

  const [form,    setForm]    = useState(initial);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [likedSongs, setLikedSongs] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(false);

  useEffect(() => { setForm(initial); }, [initial]);

  useEffect(() => {
    if (!user && !booting) refreshMe?.().catch(() => {});
  }, [booting, user, refreshMe]);

  useEffect(() => {
    if (likedSongIds.length > 0) loadLikedSongs();
  }, [likedSongIds]);

  const loadLikedSongs = async () => {
    setLoadingLiked(true);
    try {
      const res = await api.get("/api/songs");
      const all = res.data || [];
      setLikedSongs(all.filter((s) => likedSongIds.includes(s._id)));
    } catch {
      setLikedSongs([]);
    } finally {
      setLoadingLiked(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const wantsPasswordChange = Boolean(form.newPassword || form.confirmNewPassword);

    if (wantsPasswordChange) {
      if (form.newPassword !== form.confirmNewPassword) { setError("New passwords do not match"); return; }
      if (!form.currentPassword)                        { setError("Current password is required"); return; }
      if (form.newPassword.length < 6)                  { setError("New password must be at least 6 characters"); return; }
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      email:     form.email.trim(),
    };
    if (wantsPasswordChange) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword     = form.newPassword;
    }

    try {
      setSaving(true);
      await updateProfile(payload);
      setSuccess("Profile updated successfully");
      setForm((p) => ({ ...p, currentPassword: "", newPassword: "", confirmNewPassword: "" }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (booting) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-400">Loading profile...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-4 sm:px-6 md:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Profile Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account details</p>
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className={`px-5 py-4 rounded-xl border backdrop-blur-xl ${
            error
              ? "text-red-300 bg-red-500/10 border-red-500/20"
              : "text-green-300 bg-green-500/10 border-green-500/20"
          }`}>
            {error || success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Personal Info */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">First Name</label>
                <input value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Last Name</label>
                <input value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2 mt-5">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />Email Address
              </label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                placeholder="john@example.com" />
            </div>

            {/* Account info */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-500 mb-1">Account Role</p>
                <p className="text-sm font-medium text-white capitalize">{user?.role || "user"}</p>
              </div>
              <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-500 mb-1">Email Status</p>
                <p className={`text-sm font-medium ${user?.isVerified ? "text-green-400" : "text-yellow-400"}`}>
                  {user?.isVerified ? "Verified" : "Unverified"}
                </p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">Change Password</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">Leave blank to keep your current password</p>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Current Password</label>
                <input type="password" value={form.currentPassword}
                  onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                  placeholder="Enter current password" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">New Password</label>
                  <input type="password" value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    placeholder="New password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                  <input type="password" value={form.confirmNewPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    placeholder="Confirm new password" />
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={() => setForm(initial)}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all">
              Reset
            </button>
            <button disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500
                text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70
                transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Liked Songs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-5 h-5 text-red-400 fill-red-400" />
            <h2 className="text-xl font-bold">Liked Songs</h2>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
              {likedSongIds.length}
            </span>
          </div>

          {loadingLiked ? (
            <div className="text-center py-8">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          ) : likedSongs.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">No liked songs yet. Like songs from the dashboard.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {likedSongs.map((song) => (
                <div key={song._id}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-sm">{song.name}</p>
                    <p className="text-xs text-gray-400 truncate">{song.artist} · {song.genre}</p>
                  </div>
                  <Heart className="w-4 h-4 text-red-400 fill-red-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}