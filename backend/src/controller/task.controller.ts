import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { io } from "../index.js";
import { createActivity } from "../utils/activity.js";

export const createTask = async (req: Request, res: Response) => {
  try {
    const { boardId, listId } = req.params as { boardId: string; listId: string };
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Task title is required" });
    }

    // Verify list belongs to board
    const list = await prisma.taskList.findUnique({
      where: { id: listId },
    });

    if (!list || list.boardId !== boardId) {
      return res.status(404).json({ error: "List not found" });
    }

    // Get the highest position in the list
    const maxPosition = await prisma.task.findFirst({
      where: { listId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = (maxPosition?.position ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        position,
        listId,
      },
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
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "TASK_CREATED",
      metadata: { taskTitle: title.trim(), listId },
    });

    // IMPORTANT: Emit to board members
    console.log(`🔊 Emitting taskCreated to board:${boardId}`, { task, listId });
    io.to(`board:${boardId}`).emit("taskCreated", { task, listId });

    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { boardId, taskId } = req.params as { boardId: string; taskId: string };
    const { title, description } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        labels: true,
        list: true,
      },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "TASK_UPDATED",
      metadata: { taskTitle: task.title },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("taskUpdated", task);

    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { boardId, taskId } = req.params as { boardId: string; taskId: string };

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.list.boardId !== boardId) {
      return res.status(403).json({ error: "Task does not belong to this board" });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "TASK_DELETED",
      metadata: { taskTitle: task.title },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("taskDeleted", { taskId, listId: task.listId });

    res.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const moveTask = async (req: Request, res: Response) => {
  try {
    const { boardId, taskId } = req.params as { boardId: string; taskId: string };
    const { sourceListId, destinationListId, position } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.list.boardId !== boardId) {
      return res.status(403).json({ error: "Task does not belong to this board" });
    }

    const oldListId = task.listId;
    const oldList = task.list;

    // Update task position and list
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        listId: destinationListId,
        position,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        labels: true,
        list: true,
      },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "TASK_MOVED",
      metadata: {
        taskTitle: task.title,
        fromList: oldList.title,
        toList: updatedTask.list.title,
      },
    });

    // IMPORTANT: Emit with correct data structure
    const emitData = {
      task: updatedTask,
      sourceListId: oldListId,
      destinationListId: destinationListId,
    };
    
    console.log(`🔊 Emitting taskMoved to board:${boardId}`, emitData);
    io.to(`board:${boardId}`).emit("taskMoved", emitData);

    res.json(updatedTask);
  } catch (error: any) {
    console.error("❌ Error in moveTask:", error);
    res.status(400).json({ error: error.message });
  }
};

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    const { boardId, listId } = req.params;
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: "Invalid task order data" });
    }

    // Update positions in a transaction
    const updates = taskIds.map((taskId: string, index: number) =>
      prisma.task.update({
        where: { id: taskId },
        data: { position: index },
      })
    );

    await prisma.$transaction(updates);

    // Emit to board members
    io.to(`board:${boardId}`).emit("tasksReordered", { listId, taskIds });

    res.json({ message: "Tasks reordered successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const assignUser = async (req: Request, res: Response) => {
  try {
    const { boardId, taskId } = req.params as { boardId: string; taskId: string };
    const { userId } = req.body;

    // Verify user is a member of the board
    const member = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });

    const board = await prisma.board.findUnique({ where: { id: boardId } });

    if (!member && board?.ownerId !== userId) {
      return res.status(400).json({ error: "User is not a member of this board" });
    }

    // Check if already assigned
    const existing = await prisma.taskAssignee.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "User already assigned to this task" });
    }

    const assignee = await prisma.taskAssignee.create({
      data: { taskId, userId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        task: true,
      },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "TASK_ASSIGNED",
      metadata: {
        taskTitle: assignee.task.title,
        assignedUserName: assignee.user.name,
      },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("userAssigned", { taskId, assignee });

    res.json(assignee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const unassignUser = async (req: Request, res: Response) => {
  try {
    const { boardId, taskId, userId } = req.params as {
        boardId: string;
        taskId: string;
        userId: string;
    };

    const assignee = await prisma.taskAssignee.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        task: true,
      },
    });

    if (!assignee) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    await prisma.taskAssignee.delete({
      where: {
        taskId_userId: { taskId, userId },
      },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "TASK_UNASSIGNED",
      metadata: {
        taskTitle: assignee.task.title,
        unassignedUserName: assignee.user.name,
      },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("userUnassigned", { taskId, userId });

    res.json({ message: "User unassigned successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const addLabel = async (req: Request, res: Response) => {
  try {
    const { boardId, taskId } = req.params as { boardId: string; taskId: string };
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Label name is required" });
    }

    if (!color || !color.trim()) {
      return res.status(400).json({ error: "Label color is required" });
    }

    // Check if label with same name already exists for this task
    const existing = await prisma.label.findUnique({
      where: {
        taskId_name: {
          taskId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Label with this name already exists" });
    }

    const label = await prisma.label.create({
      data: {
        taskId,
        name: name.trim(),
        color: color.trim(),
      },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "LABEL_ADDED",
      metadata: { labelName: name.trim(), color: color.trim() },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("labelAdded", { taskId, label });

    res.json(label);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeLabel = async (req: Request, res: Response) => {
  try {
    const { boardId, taskId, labelId } = req.params as {
        boardId: string;
        taskId: string;
        labelId: string;
    };

    const label = await prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      return res.status(404).json({ error: "Label not found" });
    }

    if (label.taskId !== taskId) {
      return res.status(403).json({ error: "Label does not belong to this task" });
    }

    await prisma.label.delete({
      where: { id: labelId },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "LABEL_REMOVED",
      metadata: { labelName: label.name },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("labelRemoved", { taskId, labelId });

    res.json({ message: "Label removed successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};