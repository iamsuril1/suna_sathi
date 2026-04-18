const jwt    = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User            = require("../models/User");
const OTP             = require("../models/OTP");
const PasswordReset   = require("../models/PasswordReset");
const { sendOTPEmail, sendPasswordResetEmail } = require("../services/emailService");

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const FRONTEND_URL   = process.env.FRONTEND_URL   || "http://localhost:5173";

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET missing in .env");
  process.exit(1);
}

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const sanitizeUser = (userDoc) => {
  const u = userDoc?.toObject ? userDoc.toObject() : { ...userDoc };
  const { password, resetPasswordToken, resetPasswordExpires, ...safe } = u;
  return safe;
};

const generateOTP = () => String(crypto.randomInt(100000, 999999));

const createAndSendOTP = async (email, userName) => {
  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await OTP.deleteMany({ email });
  await OTP.create({ email, otp, expiresAt, attempts: 0 });
  await sendOTPEmail(email, otp, userName);
};

// ── POST /api/auth/register ─────────────────────────────
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const existing       = await User.findOne({ email: sanitizedEmail });

    if (existing && !existing.isVerified) {
      await createAndSendOTP(sanitizedEmail, existing.name);
      return res.status(200).json({
        message:              "Account exists but not verified. A new OTP has been sent.",
        requiresVerification: true,
        email:                sanitizedEmail,
      });
    }

    if (existing && existing.isVerified) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const fullName = (firstName || lastName)
      ? `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim()
      : (name || "").trim();

    const hashed = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name:       fullName || "User",
      email:      sanitizedEmail,
      password:   hashed,
      role:       role || "user",
      blocked:    false,
      isVerified: false,
      likedSongs: [],
    });

    await createAndSendOTP(sanitizedEmail, user.name);

    return res.status(201).json({
      message:              "Registered! Check your email for the 6-digit verification code.",
      requiresVerification: true,
      email:                sanitizedEmail,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

// ── POST /api/auth/verify-otp ────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const otpRecord      = await OTP.findOne({ email: sanitizedEmail });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or expired. Please request a new one." });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      const left = 4 - otpRecord.attempts;
      return res.status(400).json({
        message: `Incorrect OTP. ${left} attempt${left !== 1 ? "s" : ""} remaining.`,
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    const user = await User.findOneAndUpdate(
      { email: sanitizedEmail },
      { isVerified: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    await OTP.deleteOne({ _id: otpRecord._id });
    const token = signToken(user);

    return res.json({
      message: "Email verified! Welcome to SunaSathi 🎵",
      token,
      user:    sanitizeUser(user),
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

// ── POST /api/auth/resend-otp ────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user           = await User.findOne({ email: sanitizedEmail });

    if (!user)            return res.status(404).json({ message: "No account found with this email" });
    if (user.isVerified)  return res.status(400).json({ message: "This account is already verified" });

    const existing = await OTP.findOne({ email: sanitizedEmail });
    if (existing) {
      const secondsAgo = (Date.now() - new Date(existing.createdAt).getTime()) / 1000;
      if (secondsAgo < 60) {
        const wait = Math.ceil(60 - secondsAgo);
        return res.status(429).json({
          message: `Please wait ${wait} second${wait !== 1 ? "s" : ""} before requesting a new OTP.`,
        });
      }
    }

    await createAndSendOTP(sanitizedEmail, user.name);
    return res.json({ message: "New OTP sent! Check your email." });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// ── POST /api/auth/login ─────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user           = await User.findOne({ email: sanitizedEmail });

    const hash = user?.password || "$2a$10$invalidhashtopreventtimingXXXXXXXXXXXXXXXXXXXXXXXXXX";
    const ok   = await bcrypt.compare(String(password), hash);

    if (!user || !ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.blocked) {
      return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
    }

    if (!user.isVerified) {
      await createAndSendOTP(sanitizedEmail, user.name);
      return res.status(403).json({
        message:              "Email not verified. A new OTP has been sent to your email.",
        requiresVerification: true,
        email:                sanitizedEmail,
      });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};

// ── GET /api/auth/me ─────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user)        return res.status(401).json({ message: "Invalid token" });
    if (user.blocked) return res.status(403).json({ message: "Your account has been blocked." });

    return res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    return res.status(500).json({ message: "Failed to load profile" });
  }
};

// ── PUT /api/auth/me ─────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { firstName, lastName, name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user)        return res.status(404).json({ message: "User not found" });
    if (user.blocked) return res.status(403).json({ message: "Your account has been blocked." });

    if (email && String(email).toLowerCase().trim() !== user.email) {
      const sanitizedEmail = String(email).toLowerCase().trim();
      const exists         = await User.findOne({ email: sanitizedEmail });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      user.email      = sanitizedEmail;
      user.isVerified = false;
    }

    const computedName = (firstName || lastName)
      ? `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim()
      : (name || "").trim();
    if (computedName) user.name = computedName;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const ok = await bcrypt.compare(String(currentPassword), user.password);
      if (!ok) return res.status(401).json({ message: "Current password incorrect" });
      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      user.password = await bcrypt.hash(String(newPassword), 10);
    }

    await user.save();
    const updated = await User.findById(user._id).select("-password -resetPasswordToken -resetPasswordExpires");
    return res.json(updated);
  } catch (err) {
    console.error("Update me error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

// ── POST /api/auth/forgot-password ───────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user           = await User.findOne({ email: sanitizedEmail });

    // Always return success to prevent email enumeration
    if (!user || !user.isVerified) {
      return res.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });

    // Generate secure token
    const rawToken  = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PasswordReset.create({
      userId:    user._id,
      token:     rawToken,
      expiresAt,
      used:      false,
    });

    const resetUrl = `${FRONTEND_URL}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(sanitizedEmail, resetUrl, user.name);

    return res.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Failed to send reset email" });
  }
};

// ── POST /api/auth/reset-password/:token ─────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token }       = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const resetRecord = await PasswordReset.findOne({ token });

    if (!resetRecord) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    if (resetRecord.used) {
      return res.status(400).json({ message: "This reset link has already been used" });
    }

    if (new Date() > resetRecord.expiresAt) {
      await PasswordReset.deleteOne({ _id: resetRecord._id });
      return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(String(newPassword), 10);
    // Clear any legacy reset fields
    user.resetPasswordToken   = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Mark token as used and delete
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    return res.json({ message: "Password reset successfully! You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

// ── GET /api/auth/validate-reset/:token ──────────────────
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const record    = await PasswordReset.findOne({ token, used: false });

    if (!record || new Date() > record.expiresAt) {
      return res.status(400).json({ valid: false, message: "Invalid or expired reset link" });
    }

    return res.json({ valid: true });
  } catch (err) {
    return res.status(500).json({ valid: false, message: "Server error" });
  }
};

// ── POST /api/auth/liked-songs ───────────────────────────
exports.getLikedSongs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("likedSongs");
    return res.json({ likedSongs: user?.likedSongs || [] });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch liked songs" });
  }
};

// ── POST /api/auth/liked-songs/toggle ────────────────────
exports.toggleLikedSong = async (req, res) => {
  try {
    const { songId } = req.body;
    if (!songId) return res.status(400).json({ message: "songId required" });

    const user = await User.findById(req.user.id);
    if (!user)  return res.status(404).json({ message: "User not found" });

    const idx = user.likedSongs.findIndex((id) => id.toString() === songId);
    if (idx === -1) {
      user.likedSongs.push(songId);
    } else {
      user.likedSongs.splice(idx, 1);
    }

    await user.save();
    return res.json({ likedSongs: user.likedSongs });
  } catch (err) {
    return res.status(500).json({ message: "Failed to toggle liked song" });
  }
};