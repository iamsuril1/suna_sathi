const User = require("../models/User");

/* GET ALL USERS */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch users" });
  }
};

/* DELETE USER */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot block admin" });
    }

    user.blocked = true;
    await user.save();
    
    const sanitizedUser = await User.findById(user._id).select("-password");
    res.json({ message: "User blocked successfully", user: sanitizedUser });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to block user" });
  }
};

/* UNBLOCK USER */
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.blocked = false;
    await user.save();
    
    const sanitizedUser = await User.findById(user._id).select("-password");
    res.json({ message: "User unblocked successfully", user: sanitizedUser });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to unblock user" });
  }
};