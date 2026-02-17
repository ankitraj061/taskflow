import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { io } from "../index.js";
import { createActivity } from "../utils/activity.js";

export const getBoardMembers = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params as { boardId: string };

    const members = await prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params as { boardId: string };
    const { email, role = "WORKER" } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    // Check if board exists and user has access
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Check if already a member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: "User is already a member of this board" });
    }

    // Add member
    const member = await prisma.boardMember.create({
      data: {
        boardId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "MEMBER_ADDED",
      metadata: {
        memberName: user.name,
        memberEmail: user.email,
        role,
      },
    });

    // Emit to board members and the new member
    io.to(`board:${boardId}`).emit("memberAdded", member);
    io.to(user.id).emit("memberAdded", member);

    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { boardId, memberId } = req.params as { boardId: string; memberId: string };

    const member = await prisma.boardMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!member || member.boardId !== boardId) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Cannot remove the owner
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (board?.ownerId === member.userId) {
      return res.status(400).json({ error: "Cannot remove the board owner" });
    }

    await prisma.boardMember.delete({
      where: { id: memberId },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "MEMBER_REMOVED",
      metadata: {
        memberName: member.user.name,
        memberEmail: member.user.email,
      },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("memberRemoved", memberId);

    res.json({ message: "Member removed successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { boardId, memberId } = req.params as { boardId: string; memberId: string };
    const { role } = req.body;

    if (!["ADMIN", "WORKER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const member = await prisma.boardMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create activity
    await createActivity({
      boardId,
      userId: req.user!.id,
      type: "MEMBER_ROLE_CHANGED",
      metadata: {
        memberName: member.user.name,
        newRole: role,
      },
    });

    // Emit to board members
    io.to(`board:${boardId}`).emit("memberRoleUpdated", member);

    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};