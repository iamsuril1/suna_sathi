const express   = require("express");
const cors      = require("cors");
const path      = require("path");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes     = require("./routes/authRoutes");
const adminRoutes    = require("./routes/adminRoutes");
const songRoutes     = require("./routes/songRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const contactRoutes  = require("./routes/contactRoutes");
const liveRoutes     = require("./routes/liveRoutes");

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy:     false,
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { message: "Too many requests" },
  standardHeaders: true, legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: "Too many authentication attempts" },
  standardHeaders: true, legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 3,
  message: { message: "Too many contact submissions" },
  standardHeaders: true, legacyHeaders: false,
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(cors({
  origin:         process.env.FRONTEND_URL || "http://localhost:5173",
  credentials:    true,
  exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
  methods:        ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "Range"],
}));

app.use("/api/",              generalLimiter);
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/contact",       contactLimiter);

app.use("/api/auth",      authRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/songs",     songRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/contact",   contactRoutes);
app.use("/api/live",      liveRoutes);

// Static file serving with Range support for large audio
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", (req, res, next) => {
  const origin = process.env.FRONTEND_URL || "http://localhost:5173";
  res.header("Access-Control-Allow-Origin",   origin);
  res.header("Access-Control-Allow-Methods",  "GET, HEAD, OPTIONS");
  res.header("Access-Control-Allow-Headers",  "Range, Accept-Ranges, Content-Type");
  res.header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
  res.header("Accept-Ranges",                 "bytes");
  res.header("Cross-Origin-Resource-Policy",  "cross-origin");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
}, express.static(uploadsPath, {
  maxAge:     "1d",
  setHeaders: (res) => {
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400");
  },
}));

app.get("/", (req, res) => res.json({
  status: "API running", version: "2.0.0",
  timestamp: new Date().toISOString(),
}));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large. Maximum audio size is 1GB." });
  }
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;