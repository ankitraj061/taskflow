import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { io } from "../index.js";
import { createActivity } from "../utils/activity.js";

export const createList = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params as { boardId: string };
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "List title is required" });
    }

    // Get the highest position
    const maxPosition = await prisma.taskList.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = (maxPosition?.position ?? -1) + 1;

    const list = await prisma.taskList.create({
      data: {
        title: title.trim(),
        position,
        boardId,
      },
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
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "LIST_CREATED",
      metadata: { listTitle: title.trim() },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("listCreated", list);

    res.json(list);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateList = async (req: Request, res: Response) => {
  try {
    const { boardId, listId } = req.params as { boardId: string; listId: string };
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "List title is required" });
    }

    const list = await prisma.taskList.update({
      where: { id: listId },
      data: { title: title.trim() },
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
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "LIST_UPDATED",
      metadata: { listTitle: title.trim() },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("listUpdated", list);

    res.json(list);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteList = async (req: Request, res: Response) => {
  try {
    const { boardId, listId } = req.params as { boardId: string; listId: string };

    const list = await prisma.taskList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    if (list.boardId !== boardId) {
      return res.status(403).json({ error: "List does not belong to this board" });
    }

    await prisma.taskList.delete({
      where: { id: listId },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "LIST_DELETED",
      metadata: { listTitle: list.title },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("listDeleted", listId);

    res.json({ message: "List deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const reorderLists = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params as { boardId: string };
    const { listIds } = req.body;

    if (!Array.isArray(listIds) || listIds.length === 0) {
      return res.status(400).json({ error: "Invalid list order data" });
    }

    // Update positions in a transaction
    const updates = listIds.map((listId: string, index: number) =>
      prisma.taskList.update({
        where: { id: listId },
        data: { position: index },
      })
    );

    await prisma.$transaction(updates);

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "LIST_REORDERED",
      metadata: { listIds },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("listsReordered", listIds);

    res.json({ message: "Lists reordered successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};