const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const {
  getLiveSession,
  startLiveSession,
  endLiveSession,
  getChatMessages,
} = require("../controllers/liveController");

router.get("/session", auth, getLiveSession);
router.post("/start", auth, admin, startLiveSession);
router.post("/end", auth, admin, endLiveSession);
router.get("/chat", auth, getChatMessages);

module.exports = router;