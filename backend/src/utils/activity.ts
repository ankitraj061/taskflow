import { prisma } from "../db/prisma.js";
import { ActivityType } from "@prisma/client";
import { io } from "../index.js";

interface CreateActivityParams {
  boardId: string;
  userId: string;
  type: ActivityType;
  metadata?: any;
}

export const createActivity = async ({
  boardId,
  userId,
  type,
  metadata,
}: CreateActivityParams) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        boardId,
        userId,
        type,
        metadata: metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit activity to all users in the board room
    io.to(`board:${boardId}`).emit("activityCreated", activity);

    return activity;
  } catch (error) {
    console.error("Failed to create activity:", error);
  }
};