import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();


// 🔹 REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: "Register failed" });
  }
});


// 🔹 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Wrong password" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});
// 🔹 GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // password hide
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;