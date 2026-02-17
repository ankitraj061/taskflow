import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { io, boardRooms } from "../index.js";
import { createActivity } from "../utils/activity.js";

export const createBoard = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    const board = await prisma.board.create({
      data: {
        title,
        description,
        ownerId: req.user!.id,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Create activity
    await createActivity({
      boardId: board.id,
      userId: req.user!.id,
      type: "BOARD_CREATED",
      metadata: { title },
    });

    // Emit to owner only
    io.to(req.user!.id).emit("boardCreated", board);

    res.json(board);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getBoards = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { ownerId: req.user!.id },
        { members: { some: { userId: req.user!.id } } },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.board.count({ where }),
    ]);

    res.json({
      boards,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBoard = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params as { boardId: string };

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        lists: {
          orderBy: { position: "asc" },
          include: {
            tasks: {
              orderBy: { position: "asc" },
              include: {
                assignees: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true },
                    },
                  },
                },
                labels: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBoard = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description } = req.body;

    // Check access: owner or admin member
    const board = await prisma.board.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const isOwner = board.ownerId === req.user!.id;
    const isAdmin = board.members.some(
      (m: { userId: any; role: string }) =>
        m.userId === req.user!.id && m.role === "ADMIN"
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.board.update({
      where: { id },
      data: { title, description },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Create activity
    await createActivity({
      boardId: id,
      userId: req.user!.id,
      type: "BOARD_UPDATED",
      metadata: { title, description },
    });

    // Emit to all board members
    io.to(`board:${id}`).emit("boardUpdated", updated);

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check if user owns the board
    const board = await prisma.board.findUnique({
      where: { id },
    });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    if (board.ownerId !== req.user!.id) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this board" });
    }

    await prisma.board.delete({
      where: { id },
    });

    // Emit to all board members
    io.to(`board:${id}`).emit("boardDeleted", id);

    res.json({ message: "Board deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getBoardActivities = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params as { boardId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { boardId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: { boardId } }),
    ]);

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};