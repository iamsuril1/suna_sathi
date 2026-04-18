const express = require("express");
const authMiddleware  = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getAllUsers,
  getUserStats,
  deleteUser,
  blockUser,
  unblockUser,
} = require("../controllers/adminController");

const router = express.Router();

router.get ("/users",           authMiddleware, adminMiddleware, getAllUsers);
router.get ("/users/stats",     authMiddleware, adminMiddleware, getUserStats);
router.delete("/users/:id",     authMiddleware, adminMiddleware, deleteUser);
router.put ("/users/:id/block", authMiddleware, adminMiddleware, blockUser);
router.put ("/users/:id/unblock", authMiddleware, adminMiddleware, unblockUser);

module.exports = router;