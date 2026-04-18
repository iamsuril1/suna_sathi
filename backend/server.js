require("dotenv").config();

const http           = require("http");
const app            = require("./app");
const connectDB      = require("./config/db");
const { verifyEmailConnection } = require("./services/emailService");
const setupSocket    = require("./socket");
const radioScheduler = require("./services/radioScheduler");

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    // Verify email service
    verifyEmailConnection();

    // Pre-load radio scheduler
    await radioScheduler.load();
    console.log(
      ` Radio scheduler ready — broadcast started ` +
      `${radioScheduler.streamStart.toISOString()}`
    );

    // Create HTTP server + attach Socket.io
    const httpServer = http.createServer(app);
    setupSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received — shutting down gracefully");
      httpServer.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received — shutting down gracefully");
      httpServer.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();