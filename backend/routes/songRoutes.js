const express              = require("express");
const auth                 = require("../middleware/authMiddleware");
const admin                = require("../middleware/adminMiddleware");
const { uploadAudio, uploadArtistPhoto } = require("../middleware/uploadMiddleware");
const { validateSong }     = require("../middleware/Validation");
const {
  addSong,
  getSongs,
  getAllSongs,
  getGenres,
  getSongsByArtist,
  deleteSong,
  getArtists,
  createArtist,
  updateArtistPhoto,
} = require("../controllers/songController");

const router = express.Router();

// Genres (public for logged-in users)
router.get("/genres",               auth,         getGenres);

// Regular songs — search + genre filter via query params
router.get("/",                     auth,         getSongs);

// All songs including live-only (admin)
router.get("/all",                  auth, admin,  getAllSongs);

// Artists
router.get ("/artists",             auth,         getArtists);
router.post("/artists",             auth, admin,
  uploadArtistPhoto.single("photo"), createArtist);
router.put ("/artists/:id/photo",   auth, admin,
  uploadArtistPhoto.single("photo"), updateArtistPhoto);

// Songs by artist
router.get("/by-artist/:artistId",  auth,         getSongsByArtist);

// Song CRUD
router.post(
  "/",
  auth, admin,
  uploadAudio.single("audio"),
  validateSong,
  addSong
);

router.delete("/:id",               auth, admin,  deleteSong);

module.exports = router;