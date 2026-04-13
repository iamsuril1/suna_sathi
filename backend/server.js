require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { verifyEmailConnection } = require("./services/emailService");
const setupSocket = require("./socket");

connectDB();
verifyEmailConnection();

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
setupSocket(httpServer);

httpServer.listen(PORT, () => console.log(`Server running on ${PORT}`));