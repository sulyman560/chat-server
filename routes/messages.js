import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// 🔹 SEND MESSAGE (ADD THIS)
router.post("/", async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
    });

    await newMessage.save();

    res.json(newMessage);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Message send failed" });
  }
});

// 🔹 GET messages
router.get("/:senderId/:receiverId", async (req, res) => {
  const { senderId, receiverId } = req.params;

  const messages = await Message.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  }).sort({ createdAt: 1 });

  res.json(messages);
});

export default router;