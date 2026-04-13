import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Shield, Ban, CheckCircle, Trash2, ArrowLeft, AlertCircle } from "lucide-react";
import api from "../services/api";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsersList();
  }, [searchQuery, filterRole, filterStatus, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsersList = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Status filter
    if (filterStatus === "active") {
      filtered = filtered.filter((user) => !user.blocked);
    } else if (filterStatus === "blocked") {
      filtered = filtered.filter((user) => user.blocked);
    }

    setFilteredUsers(filtered);
  };

  const blockUser = async (userId) => {
    try {
      setError("");
      setSuccess("");
      await api.put(`/api/admin/users/${userId}/block`);
      setSuccess("User blocked successfully");
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to block user");
    }
  };

  const unblockUser = async (userId) => {
    try {
      setError("");
      setSuccess("");
      await api.put(`/api/admin/users/${userId}/unblock`);
      setSuccess("User unblocked successfully");
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unblock user");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await api.delete(`/api/admin/users/${userId}`);
      setSuccess("User deleted successfully");
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-400">Loading users...</span>
        </div>
      </main>
    );
  }

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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">User Management</h1>
            <p className="text-gray-400 mt-1">Manage platform users and permissions</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 backdrop-blur-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 backdrop-blur-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 
                focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
                focus:outline-none focus:border-indigo-500/50 transition-all"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
                focus:outline-none focus:border-indigo-500/50 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-sm text-gray-400 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-sm text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {users.filter((u) => !u.blocked).length}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-sm text-gray-400 mb-1">Blocked</p>
          <p className="text-2xl font-bold text-red-400">
            {users.filter((u) => u.blocked).length}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-sm text-gray-400 mb-1">Admins</p>
          <p className="text-2xl font-bold text-indigo-400">
            {users.filter((u) => u.role === "admin").length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchQuery || filterRole !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "No users registered yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-sm font-medium text-gray-400">
              <div className="col-span-4">User</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <div
                  key={user._id || user.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-all"
                >
                  {/* User Info */}
                  <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-purple-300">
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{user.name || "Unknown"}</p>
                      <p className="text-sm text-gray-400 md:hidden truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="hidden md:flex col-span-3 items-center">
                    <span className="text-gray-300 truncate">{user.email}</span>
                  </div>

                  {/* Role */}
                  <div className="col-span-1 md:col-span-2 flex items-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-white/5 text-gray-400 border border-white/10"
                      }`}
                    >
                      {user.role === "admin" && <Shield className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 md:col-span-1 flex items-center">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        user.blocked
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-green-500/20 text-green-300 border border-green-500/30"
                      }`}
                    >
                      {user.blocked ? "Blocked" : "Active"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
                    {user.role !== "admin" && (
                      <>
                        {user.blocked ? (
                          <button
                            onClick={() => unblockUser(user._id || user.id)}
                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                            title="Unblock user"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => blockUser(user._id || user.id)}
                            className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all"
                            title="Block user"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteUser(user._id || user.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          title="Delete user"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}