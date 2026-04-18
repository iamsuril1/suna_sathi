const User = require("../models/User");

/* GET ALL USERS — with filters */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (status === "active") {
      query.blocked = false;
    } else if (status === "blocked") {
      query.blocked = true;
    }

    if (search?.trim()) {
      const q   = search.trim();
      query.$or = [
        { name:  { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch users" });
  }
};

/* GET USER STATS */
exports.getUserStats = async (req, res) => {
  try {
    const total   = await User.countDocuments();
    const active  = await User.countDocuments({ blocked: false });
    const blocked = await User.countDocuments({ blocked: true });
    const admins  = await User.countDocuments({ role: "admin" });

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers  = await User.countDocuments({ createdAt: { $gte: last7Days } });

    res.json({ total, active, blocked, admins, newUsers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

/* DELETE USER */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete user" });
  }
};

/* BLOCK USER */
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot block admin" });
    }

    user.blocked = true;
    await user.save();

    const sanitized = await User.findById(user._id)
      .select("-password -resetPasswordToken -resetPasswordExpires");
    res.json({ message: "User blocked successfully", user: sanitized });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to block user" });
  }
};

/* UNBLOCK USER */
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.blocked = false;
    await user.save();

    const sanitized = await User.findById(user._id)
      .select("-password -resetPasswordToken -resetPasswordExpires");
    res.json({ message: "User unblocked successfully", user: sanitized });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to unblock user" });
  }
};