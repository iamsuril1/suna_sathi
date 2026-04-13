const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const songRoutes = require("./routes/songRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

// Security middleware - Updated for audio streaming
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // IMPORTANT: Allows audio files to be loaded
  contentSecurityPolicy: false // Disable for development, configure properly for production
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 submissions per hour
  message: { message: 'Too many contact submissions, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CORS - Enhanced for audio streaming
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Apply general rate limiter to all API routes
app.use("/api/", generalLimiter);

// Apply stricter rate limiter to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Apply contact rate limiter
app.use("/api/contact", contactLimiter);

// Routes
const liveRoutes = require("./routes/liveRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/live", liveRoutes);

// Static files for audio uploads - with proper CORS headers for streaming
app.use("/uploads", (req, res, next) => {
  // Set CORS headers explicitly for audio files
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.header('Accept-Ranges', 'bytes');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}, express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => res.json({ 
  status: "API running",
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || "Internal server error" 
  });
});

module.exports = app;