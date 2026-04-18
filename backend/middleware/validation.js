const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

exports.validateRegister = [
  body("email").isEmail().withMessage("Invalid email address").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  validate,
];

exports.validateLogin = [
  body("email").isEmail().withMessage("Invalid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

exports.validateSong = [
  body("name").trim().notEmpty().withMessage("Song name is required"),
  body("artist").trim().notEmpty().withMessage("Artist name is required"),
  body("genre").trim().notEmpty().withMessage("Genre is required"),
  body("year")
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage("Invalid year"),
  validate,
];

exports.validatePlaylist = [
  body("name")
    .trim().notEmpty().withMessage("Playlist name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Playlist name must be between 1 and 100 characters"),
  validate,
];

exports.validateUpdateProfile = [
  body("email").optional().isEmail().withMessage("Invalid email address").normalizeEmail(),
  body("firstName").optional().trim(),
  body("lastName").optional().trim(),
  body("newPassword").optional().isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  validate,
];

exports.validateForgotPassword = [
  body("email").isEmail().withMessage("Invalid email address").normalizeEmail(),
  validate,
];

exports.validateResetPassword = [
  body("newPassword").isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  validate,
];