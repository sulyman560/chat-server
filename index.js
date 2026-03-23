import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import User from "./models/User.js";
dotenv.config();
await connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// routes
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// test api
app.get("/", (req, res) => res.send("Server running"));

// http server + socket
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://chatapp-steel-one.vercel.app", methods: ["GET", "POST"] },
  //path: "/socket.io", // online server এ sometimes custom path দরকার
});

let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  // 🔥 USER ONLINE
  socket.on("addUser", async (userId) => {
    socket.userId = userId;

    if (!onlineUsers[userId]) {
      onlineUsers[userId] = [];
    }

    onlineUsers[userId].push(socket.id);

    await User.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: null,
    });

    io.emit("updateUserStatus", {
      userId,
      online: true,
      lastSeen: null,
    });
  });

  // 🔥 MESSAGE
  socket.on("sendMessage", (data) => {
    socket.broadcast.emit("getMessage", data);
  });

  // 🔥 USER OFFLINE
  socket.on("disconnect", async () => {
    if (socket.userId && onlineUsers[socket.userId]) {
      // remove this socket
      onlineUsers[socket.userId] = onlineUsers[socket.userId].filter(
        (id) => id !== socket.id
      );

      // যদি আর কোনো socket না থাকে, তখন offline করো
      if (onlineUsers[socket.userId].length === 0) {
        delete onlineUsers[socket.userId];

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
    }

    console.log("Disconnected:", socket.id);
  });
});

const sendAllUsersStatus = async () => {
  const allUsers = await User.find({}, "_id online lastSeen");
  io.emit("allUsersStatus", allUsers);
};

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  socket.on("addUser", async (userId) => {
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, { online: true, lastSeen: null });
    sendAllUsersStatus(); // 🔹 emit full status
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { online: false, lastSeen: new Date() });
      sendAllUsersStatus(); // 🔹 emit full status
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server run on port http://localhost:${PORT}`));