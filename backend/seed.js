require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const seeds = [
  {
    name: "Admin User",
    email: "admin@sunasathi.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Test User",
    email: "user@sunasathi.com",
    password: "user123",
    role: "user",
  },
];

const seed = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB\n");

    for (const s of seeds) {
      const exists = await User.findOne({ email: s.email });

      if (exists) {
        console.log(` Skipped  → ${s.email} (already exists)`);
        continue;
      }

      const hashed = await bcrypt.hash(s.password, 10);
      await User.create({
        name:       s.name,
        email:      s.email,
        password:   hashed,
        role:       s.role,
        blocked:    false,
        isVerified: true,
      });

      console.log(`✅ Created  → ${s.email}  |  role: ${s.role}  |  password: ${s.password}`);
    }

    console.log("\nSeeding complete.");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
};

seed();