const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Only allow MP3 files
  if (file.mimetype === "audio/mpeg") {
    cb(null, true);
  } else {
    cb(new Error("Only MP3 files are allowed"), false);
  }
};

module.exports = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file at a time
  }
});