const jwt    = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User           = require("../models/User");
const OTP            = require("../models/OTP");
const { sendOTPEmail } = require("../services/emailService");

// ── Validate JWT secret ─────────────────────────────────────────────────────
const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET missing in .env");
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const sanitizeUser = (userDoc) => {
  const u = userDoc?.toObject ? userDoc.toObject() : { ...userDoc };
  const { password, ...safe } = u;
  return safe;
};

// Cryptographically secure 6-digit OTP
const generateOTP = () => String(crypto.randomInt(100000, 999999));

// Create OTP record in DB and send the email
const createAndSendOTP = async (email, userName) => {
  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Remove any existing OTP for this email first
  await OTP.deleteMany({ email });

  await OTP.create({ email, otp, expiresAt, attempts: 0 });
  await sendOTPEmail(email, otp, userName);
};

// ── POST /api/auth/register ─────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const existing       = await User.findOne({ email: sanitizedEmail });

    // User exists but never verified → resend OTP
    if (existing && !existing.isVerified) {
      await createAndSendOTP(sanitizedEmail, existing.name);
      return res.status(200).json({
        message: "Account exists but not verified. A new OTP has been sent to your email.",
        requiresVerification: true,
        email: sanitizedEmail,
      });
    }

    // Already verified
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
    });

    await createAndSendOTP(sanitizedEmail, user.name);

    return res.status(201).json({
      message: "Registered! Check your email for the 6-digit verification code.",
      requiresVerification: true,
      email: sanitizedEmail,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

// ── POST /api/auth/verify-otp ───────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const otpRecord      = await OTP.findOne({ email: sanitizedEmail });

    if (!otpRecord) {
      return res.status(400).json({
        message: "OTP not found or expired. Please request a new one.",
      });
    }

    // Too many wrong attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Wrong OTP
    if (otpRecord.otp !== String(otp).trim()) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      const left = 4 - otpRecord.attempts;
      return res.status(400).json({
        message: `Incorrect OTP. ${left} attempt${left !== 1 ? "s" : ""} remaining.`,
      });
    }

    // Expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    // ✅ Success — verify user
    const user = await User.findOneAndUpdate(
      { email: sanitizedEmail },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = signToken(user);

    return res.json({
      message: "Email verified! Welcome to SunaSathi 🎵",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

// ── POST /api/auth/resend-otp ───────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user           = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified" });
    }

    // Rate limit: 60s cooldown between resends
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

// ── POST /api/auth/login ────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user           = await User.findOne({ email: sanitizedEmail });

    // Timing-safe: always run bcrypt even when user not found
    const hash = user?.password || "$2a$10$invalidhashtopreventtimingXXXXXXXXXXXXXXXXXXXXXXXXXX";
    const ok   = await bcrypt.compare(String(password), hash);

    if (!user || !ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.blocked) {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // Not verified → send fresh OTP
    if (!user.isVerified) {
      await createAndSendOTP(sanitizedEmail, user.name);
      return res.status(403).json({
        message: "Email not verified. A new OTP has been sent to your email.",
        requiresVerification: true,
        email: sanitizedEmail,
      });
    }

    const token = signToken(user);
    return res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};

// ── GET /api/auth/me ────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user)        return res.status(401).json({ message: "Invalid token" });
    if (user.blocked) return res.status(403).json({ message: "Your account has been blocked." });

    return res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    return res.status(500).json({ message: "Failed to load profile" });
  }
};

// ── PUT /api/auth/me ────────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { firstName, lastName, name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user)        return res.status(404).json({ message: "User not found" });
    if (user.blocked) return res.status(403).json({ message: "Your account has been blocked." });

    // Email change
    if (email && String(email).toLowerCase().trim() !== user.email) {
      const sanitizedEmail = String(email).toLowerCase().trim();
      const exists = await User.findOne({ email: sanitizedEmail });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      user.email      = sanitizedEmail;
      user.isVerified = false; // must re-verify new email
    }

    // Name change
    const computedName = (firstName || lastName)
      ? `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim()
      : (name || "").trim();
    if (computedName) user.name = computedName;

    // Password change
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
    const updated = await User.findById(user._id).select("-password");
    return res.json(updated);
  } catch (err) {
    console.error("Update me error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};