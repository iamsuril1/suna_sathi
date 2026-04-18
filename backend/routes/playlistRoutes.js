const express = require("express");
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const { validatePlaylist } = require("../middleware/Validation");
const {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  getPublicPlaylist,
  makePlaylistPublic,
  makePlaylistPrivate,
  regenerateShareToken,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getPlaylistStats,
  getAllPlaylistsCount,
} = require("../controllers/playlistController");

const router = express.Router();

// Public (no auth)
router.get("/share/:shareToken", getPublicPlaylist);

// Admin stats
router.get("/stats",  auth, admin, getPlaylistStats);
router.get("/count",  auth, admin, getAllPlaylistsCount);

// Protected
router.post("/",                   auth, validatePlaylist, createPlaylist);
router.get("/",                    auth, getMyPlaylists);
router.get("/:id",                 auth, getPlaylistById);
router.put("/:id",                 auth, updatePlaylist);
router.post("/:id/songs",          auth, addSongToPlaylist);
router.delete("/:id/songs",        auth, removeSongFromPlaylist);
router.delete("/:id",              auth, deletePlaylist);

// Sharing
router.post("/:id/make-public",    auth, makePlaylistPublic);
router.post("/:id/make-private",   auth, makePlaylistPrivate);
router.post("/:id/regenerate-token", auth, regenerateShareToken);

module.exports = router;