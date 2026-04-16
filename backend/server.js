require("dotenv").config();
const http           = require("http");
const app            = require("./app");
const connectDB      = require("./config/db");
const { verifyEmailConnection } = require("./services/emailService");
const setupSocket    = require("./socket");
const radioScheduler = require("./services/radioScheduler");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  verifyEmailConnection();

  // Pre-load radio scheduler so first request is instant
  await radioScheduler.load();
  console.log(
    ` Radio scheduler ready — stream started ` +
    `${radioScheduler.streamStart.toISOString()}`
  );

  const httpServer = http.createServer(app);
  setupSocket(httpServer);

  httpServer.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});