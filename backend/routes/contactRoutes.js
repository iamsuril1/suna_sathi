const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { body } = require('express-validator');
const {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
  getContactStats
} = require("../controllers/contactController");

const router = express.Router();

// Validation middleware
const validateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

// Public route - anyone can submit contact form
router.post("/", validateContact, submitContact);

// Admin routes - require authentication and admin role
router.get("/", authMiddleware, adminMiddleware, getAllContacts);
router.get("/stats", authMiddleware, adminMiddleware, getContactStats);
router.put("/:id/status", authMiddleware, adminMiddleware, updateContactStatus);
router.delete("/:id", authMiddleware, adminMiddleware, deleteContact);

module.exports = router;