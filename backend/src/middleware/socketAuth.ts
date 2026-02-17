import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

export const socketAuth = async (socket: Socket, next: any) => {
  try {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      return next(new Error("Authentication error: No cookies"));
    }

    const tokenCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("auth_token="));

    if (!tokenCookie) {
      return next(new Error("Authentication error: No token"));
    }

    const token = tokenCookie.split("=").slice(1).join("=").trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.data.user = user;
    socket.join(user.id);
    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Authentication error"));
  }
};