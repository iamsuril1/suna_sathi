const router         = require("express").Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
} = require("../middleware/Validation");

// Public
router.post("/register",   validateRegister, authController.register);
router.post("/login",      validateLogin,    authController.login);

// OTP
router.post("/verify-otp", authController.verifyOTP);
router.post("/resend-otp", authController.resendOTP);

// Password reset (public)
router.post("/forgot-password",           authController.forgotPassword);
router.post("/reset-password/:token",     authController.resetPassword);
router.get ("/validate-reset/:token",     authController.validateResetToken);

// Protected
router.get ("/me",         authMiddleware, authController.getMe);
router.put ("/me",         authMiddleware, validateUpdateProfile, authController.updateMe);

// Liked songs (DB-backed, per user)
router.get ("/liked-songs",         authMiddleware, authController.getLikedSongs);
router.post("/liked-songs/toggle",  authMiddleware, authController.toggleLikedSong);

module.exports = router;