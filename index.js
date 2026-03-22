import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
dotenv.config();

// routes import
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";


const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 routes use করো এখানে
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);


//Database connection
await connectDB();

// Example API
app.get("/", (req, res) => {
  res.send("Server is running");
});

// create http server
const server = http.createServer(app);

// setup socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // frontend URL দিতে পারো, এখন dev-এর জন্য *
    methods: ["GET", "POST"],
  },
});

// 🔹 এখানেই socket logic বসবে
import Message from "./models/Message.js";
import User from "./models/User.js";

let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.on("sendMessage", (data) => {
  // ❌ DB save remove
  // শুধু realtime send
  socket.broadcast.emit("getMessage", data);
});

  // user online
  socket.on("addUser", async (userId) => {
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit("updateUserStatus", { userId, online: true });
  });

  // user offline
  socket.on("disconnect", async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, {
        online: false,
        lastSeen: new Date(),
      });
      io.emit("updateUserStatus", {
        userId: socket.userId,
        online: false,
        lastSeen: new Date(),
      });
    }
    console.log("user disconnected");
  });
});

// start server
server.listen(port, () => console.log(`Server running on port ${port}`));