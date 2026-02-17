import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
type AuthUser = {
  id: string;
  name: string;
  email: string;
};


interface JwtPayload {
  id: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies["auth_token"];

  if (!token) {
    res.status(401).json({
      error: "Unauthorized: No token provided"
    });
    return;
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    // Fetch user directly from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      res.status(401).json({
        error: "Unauthorized: User not found"
      });
      return;
    }

    req.user = user;

    console.log("Authenticated User:", user.email);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      error: "Unauthorized: Invalid or expired token"
    });
  }
};
