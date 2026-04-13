const express = require("express");
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const upload  = require("../middleware/uploadMiddleware");
const { validateSong } = require("../middleware/Validation");
const {
  addSong,
  getSongs,
  getAllSongs,
  deleteSong,
  getArtists,
  createArtist,
} = require("../controllers/songController");

const router = express.Router();

// Regular songs (no live-only) — for users
router.get("/",          auth,        getSongs);

// All songs including live-only — for admin
router.get("/all",       auth, admin, getAllSongs);

// Artists
router.get("/artists",   auth,        getArtists);
router.post("/artists",  auth, admin, createArtist);

// Song CRUD
router.post(
  "/",
  auth,
  admin,
  upload.single("audio"),
  validateSong,
  addSong
);

router.delete("/:id", auth, admin, deleteSong);

module.exports = router;