import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { socketAuth } from "./middleware/socketAuth.js";

import authRouter from "./routes/auth.route.js";
import boardRouter from "./routes/board.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
      process.env.ORIGIN || "",
      process.env.PRODUCTION_ORIGIN || "",
      process.env.PRODUCTION_ORIGIN_2 || ""
    ],
    credentials: true
  }
});

// ✅ Board Room Tracking
export const boardRooms = new Map<string, Set<string>>();

// ✅ Socket Middleware
io.use(socketAuth);

// ✅ Socket Event Handlers
io.on("connection", (socket) => {
  console.log(`User ${socket.data.user.email} connected: ${socket.id}`);

  socket.on("joinBoard", (boardId: string) => {
    socket.join(`board:${boardId}`);

    if (!boardRooms.has(boardId)) {
      boardRooms.set(boardId, new Set());
    }

    boardRooms.get(boardId)?.add(socket.id);
    console.log(`Socket ${socket.id} joined board ${boardId}`);
  });

  socket.on("leaveBoard", (boardId: string) => {
    socket.leave(`board:${boardId}`);
    boardRooms.get(boardId)?.delete(socket.id);
    console.log(`Socket ${socket.id} left board ${boardId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Cleanup boardRooms map
    for (const [boardId, sockets] of boardRooms.entries()) {
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        boardRooms.delete(boardId);
      }
    }
  });
});

// ✅ Express Middlewares
app.use(
  cors({
    origin: [
      process.env.ORIGIN || "",
      process.env.PRODUCTION_ORIGIN || "",
      process.env.PRODUCTION_ORIGIN_2 || ""
    ],
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/boards", boardRouter);

// ✅ Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on http://localhost:${PORT}`);
});