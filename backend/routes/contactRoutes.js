const express = require("express");
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const { body, validationResult } = require("express-validator");
const {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
  getContactStats,
} = require("../controllers/contactController");

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

const validateContact = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("subject").trim().notEmpty().withMessage("Subject is required")
    .isLength({ min: 5, max: 200 }).withMessage("Subject must be 5–200 characters"),
  body("message").trim().notEmpty().withMessage("Message is required")
    .isLength({ min: 10, max: 2000 }).withMessage("Message must be 10–2000 characters"),
  validate,
];

// Public
router.post("/", validateContact, submitContact);

// Admin
router.get  ("/",          auth, admin, getAllContacts);
router.get  ("/stats",     auth, admin, getContactStats);
router.put  ("/:id/status", auth, admin, updateContactStatus);
router.delete("/:id",      auth, admin, deleteContact);

module.exports = router;