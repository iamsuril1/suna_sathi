// backend/routes/authRoutes.js
// REPLACE your existing authRoutes.js with this

const router         = require("express").Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
} = require("../middleware/Validation");

// Public
router.post("/register",    validateRegister,       authController.register);
router.post("/login",       validateLogin,          authController.login);

// OTP
router.post("/verify-otp",  authController.verifyOTP);
router.post("/resend-otp",  authController.resendOTP);

// Protected (must be logged in)
router.get ("/me",          authMiddleware,         authController.getMe);
router.put ("/me",          authMiddleware, validateUpdateProfile, authController.updateMe);

module.exports = router;