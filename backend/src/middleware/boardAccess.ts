import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";

export const checkBoardAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const boardId = req.params.boardId || req.body.boardId;
    const userId = req.user!.id;

    if (!boardId) {
      return res.status(400).json({ error: "Board ID is required" });
    }

    // Check if user is owner or member
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: {
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(403).json({ error: "Access denied to this board" });
    }

    // Attach board info to request
    req.board = board;
    req.isOwner = board.ownerId === userId;
    req.memberRole = board.members[0]?.role;

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkBoardAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const boardId = req.params.boardId || req.body.boardId;
    const userId = req.user!.id;

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: "ADMIN",
              },
            },
          },
        ],
      },
    });

    if (!board) {
      return res.status(403).json({
        error: "You must be an admin or owner to perform this action",
      });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};