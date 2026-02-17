import { authMiddleware } from "../middleware/authMiddleware.js";
import express from "express";

import { checkBoardAccess, checkBoardAdmin } from "../middleware/boardAccess.js";
import { createBoard,getBoard,getBoards,updateBoard,deleteBoard,getBoardActivities } from "../controller/board.controller.js";
import { getBoardMembers, addMember , removeMember, updateMemberRole} from "../controller/boardMember.controller.js";
import { createList , updateList, deleteList, reorderLists} from "../controller/taskList.controller.js";
import { createTask,updateTask,deleteTask,moveTask,reorderTasks,assignUser,unassignUser,addLabel,removeLabel } from "../controller/task.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Board routes
router.post("/", createBoard);
router.get("/", getBoards);
router.get("/:boardId", checkBoardAccess, getBoard);
router.put("/:id", updateBoard); // Keep your original logic
router.delete("/:id", deleteBoard);

// Board activities
router.get("/:boardId/activities", checkBoardAccess, getBoardActivities);

// Member routes
router.get("/:boardId/members", checkBoardAccess, getBoardMembers);
router.post("/:boardId/members", checkBoardAccess, checkBoardAdmin, addMember);
router.delete("/:boardId/members/:memberId", checkBoardAccess, checkBoardAdmin, removeMember);
router.patch("/:boardId/members/:memberId/role", checkBoardAccess, checkBoardAdmin, updateMemberRole);

// List routes
router.post("/:boardId/lists", checkBoardAccess, createList);
router.put("/:boardId/lists/:listId", checkBoardAccess, updateList);
router.delete("/:boardId/lists/:listId", checkBoardAccess, deleteList);
router.post("/:boardId/lists/reorder", checkBoardAccess, reorderLists);

// Task routes
router.post("/:boardId/lists/:listId/tasks", checkBoardAccess, createTask);
router.put("/:boardId/tasks/:taskId", checkBoardAccess, updateTask);
router.delete("/:boardId/tasks/:taskId", checkBoardAccess, deleteTask);
router.post("/:boardId/tasks/:taskId/move", checkBoardAccess, moveTask);
router.post("/:boardId/lists/:listId/tasks/reorder", checkBoardAccess, reorderTasks);

// Task assignees
router.post("/:boardId/tasks/:taskId/assignees", checkBoardAccess, assignUser);
router.delete("/:boardId/tasks/:taskId/assignees/:userId", checkBoardAccess, unassignUser);

// Task labels
router.post("/:boardId/tasks/:taskId/labels", checkBoardAccess, addLabel);
router.delete("/:boardId/tasks/:taskId/labels/:labelId", checkBoardAccess, removeLabel);

export default router;