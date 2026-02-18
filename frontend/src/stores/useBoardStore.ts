import { create } from "zustand";
import { axiosClient } from "@/client/axiosClient";
import { Socket } from "socket.io-client";
import type { Board, TaskList, Task, Activity, BoardMember, BoardRole, Label, TaskAssignee } from "@/types/board.types";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface BoardState {
  board: Board | null;
  lists: TaskList[];
  activities: Activity[];
  currentUserRole: BoardRole | null;
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;

  // Actions
  setSocket: (socket: Socket | null) => void;
  fetchBoard: (boardId: string) => Promise<void>;
  fetchActivities: (boardId: string) => Promise<void>;
  
  // List actions
  addList: (boardId: string, title: string) => Promise<void>;
  updateList: (boardId: string, listId: string, title: string) => Promise<void>;
  deleteList: (boardId: string, listId: string) => Promise<void>;
  reorderLists: (boardId: string, listIds: string[]) => Promise<void>;

  // Task actions
  addTask: (listId: string, boardId: string, title: string, description?: string) => Promise<void>;
  updateTask: (
    boardId: string,
    taskId: string,
    title: string,
    description?: string,
    startDate?: string | null,
    endDate?: string | null
  ) => Promise<void>;
  deleteTask: (boardId: string, taskId: string) => Promise<void>;
  moveTask: (boardId: string, taskId: string, sourceListId: string, destinationListId: string, position: number) => Promise<void>;
  
  // Member actions
  addMember: (boardId: string, email: string, role: BoardRole) => Promise<void>;
  removeMember: (boardId: string, memberId: string) => Promise<void>;
  updateMemberRole: (boardId: string, memberId: string, role: BoardRole) => Promise<void>;

  // Label actions
  addLabel: (boardId: string, taskId: string, name: string, color: string) => Promise<void>;
  removeLabel: (boardId: string, taskId: string, labelId: string) => Promise<void>;

  // Assignee actions
  assignUser: (boardId: string, taskId: string, userId: string) => Promise<void>;
  unassignUser: (boardId: string, taskId: string, userId: string) => Promise<void>;

  // Task reordering
  reorderTasks: (boardId: string, listId: string, taskIds: string[]) => Promise<void>;

  // Socket event handlers
  handleListCreated: (list: TaskList) => void;
  handleListUpdated: (list: TaskList) => void;
  handleListDeleted: (listId: string) => void;
  handleTaskCreated: (data: { task: Task; listId: string }) => void;
  handleTaskUpdated: (task: Task) => void;
  handleTaskDeleted: (data: { taskId: string; listId: string }) => void;
  handleTaskMoved: (data: { task: Task; sourceListId: string; destinationListId: string }) => void;
  handleMemberAdded: (member: BoardMember) => void;
  handleMemberRemoved: (memberId: string) => void;
  handleMemberRoleUpdated: (member: BoardMember) => void;
  handleActivityCreated: (activity: Activity) => void;
  handleLabelAdded: (data: { taskId: string; label: Label }) => void;
  handleLabelRemoved: (data: { taskId: string; labelId: string }) => void;
  handleUserAssigned: (data: { taskId: string; assignee: TaskAssignee }) => void;
  handleUserUnassigned: (data: { taskId: string; userId: string }) => void;
  handleTasksReordered: (data: { listId: string; taskIds: string[] }) => void;

  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  lists: [],
  activities: [],
  currentUserRole: null,
  isLoading: false,
  error: null,
  socket: null,

  setSocket: (socket) => {
    const prevSocket = get().socket;

    // Remove old listeners
    if (prevSocket) {
      prevSocket.off("listCreated");
      prevSocket.off("listUpdated");
      prevSocket.off("listDeleted");
      prevSocket.off("taskCreated");
      prevSocket.off("taskUpdated");
      prevSocket.off("taskDeleted");
      prevSocket.off("taskMoved");
      prevSocket.off("memberAdded");
      prevSocket.off("memberRemoved");
      prevSocket.off("memberRoleUpdated");
      prevSocket.off("activityCreated");
      prevSocket.off("labelAdded");
      prevSocket.off("labelRemoved");
      prevSocket.off("userAssigned");
      prevSocket.off("userUnassigned");
      prevSocket.off("tasksReordered");
    }

    // Add new listeners
    if (socket) {
      socket.on("listCreated", get().handleListCreated);
      socket.on("listUpdated", get().handleListUpdated);
      socket.on("listDeleted", get().handleListDeleted);
      socket.on("taskCreated", get().handleTaskCreated);
      socket.on("taskUpdated", get().handleTaskUpdated);
      socket.on("taskDeleted", get().handleTaskDeleted);
      socket.on("taskMoved", get().handleTaskMoved);
      socket.on("memberAdded", get().handleMemberAdded);
      socket.on("memberRemoved", get().handleMemberRemoved);
      socket.on("memberRoleUpdated", get().handleMemberRoleUpdated);
      socket.on("activityCreated", get().handleActivityCreated);
      socket.on("labelAdded", get().handleLabelAdded);
      socket.on("labelRemoved", get().handleLabelRemoved);
      socket.on("userAssigned", get().handleUserAssigned);
      socket.on("userUnassigned", get().handleUserUnassigned);
      socket.on("tasksReordered", get().handleTasksReordered);
    }

    set({ socket });
  },

  fetchBoard: async (boardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/api/boards/${boardId}`);
      const board = response.data;

      // Determine current user role
      const userId = localStorage.getItem("userId");
      let role: BoardRole | null = null;
      
      if (board.ownerId === userId) {
        role = "ADMIN";
      } else {
        const member = board.members.find((m: BoardMember) => m.userId === userId);
        role = member?.role || null;
      }

      set({
        board,
        lists: board.lists || [],
        currentUserRole: role,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching board:", error);
      const axiosError = error as AxiosError;
      set({
        error: axiosError.response?.data?.error || "Failed to fetch board",
        isLoading: false,
      });
    }
  },

  fetchActivities: async (boardId: string) => {
    try {
      const response = await axiosClient.get(`/api/boards/${boardId}/activities`);
      set({ activities: response.data.activities || [] });
    } catch (error: unknown) {
      console.error("Error fetching activities:", error);
    }
  },

  addList: async (boardId: string, title: string) => {
    try {
      await axiosClient.post(`/api/boards/${boardId}/lists`, { title });
      // Socket will handle the update via handleListCreated
    } catch (error: unknown) {
      console.error("Error adding list:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to add list");
    }
  },

  updateList: async (boardId: string, listId: string, title: string) => {
    try {
      await axiosClient.put(`/api/boards/${boardId}/lists/${listId}`, { title });
      // Socket will handle the update via handleListUpdated
    } catch (error: unknown) {
      console.error("Error updating list:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to update list");
    }
  },

  deleteList: async (boardId: string, listId: string) => {
    try {
      await axiosClient.delete(`/api/boards/${boardId}/lists/${listId}`);
      // Socket will handle the update via handleListDeleted
    } catch (error: unknown) {
      console.error("Error deleting list:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to delete list");
    }
  },

  reorderLists: async (boardId: string, listIds: string[]) => {
    try {
      await axiosClient.post(`/api/boards/${boardId}/lists/reorder`, { listIds });
      // Socket will handle the update
    } catch (error: unknown) {
      console.error("Error reordering lists:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to reorder lists");
    }
  },

  addTask: async (listId: string, boardId: string, title: string, description?: string) => {
    try {
      await axiosClient.post(`/api/boards/${boardId}/lists/${listId}/tasks`, {
        title,
        description,
      });
      // Socket will handle the update via handleTaskCreated
    } catch (error: unknown) {
      console.error("Error adding task:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to add task");
    }
  },

  updateTask: async (
    boardId: string,
    taskId: string,
    title: string,
    description?: string,
    startDate?: string | null,
    endDate?: string | null
  ) => {
    try {
      const response = await axiosClient.put(`/api/boards/${boardId}/tasks/${taskId}`, {
        title,
        description,
        startDate,
        endDate,
      });
      const updatedTask = response.data as Task;

      // Update local state immediately (socket will still sync other users)
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === updatedTask.listId
            ? {
                ...list,
                tasks: list.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
              }
            : list
        ),
      }));
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to update task");
    }
  },

  deleteTask: async (boardId: string, taskId: string) => {
    try {
      await axiosClient.delete(`/api/boards/${boardId}/tasks/${taskId}`);
      // Socket will handle the update via handleTaskDeleted
    } catch (error: unknown) {
      console.error("Error deleting task:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to delete task");
    }
  },

  moveTask: async (boardId: string, taskId: string, sourceListId: string, destinationListId: string, position: number) => {
    // Optimistically update UI
    const task = get().lists
      .find((l) => l.id === sourceListId)
      ?.tasks.find((t) => t.id === taskId);

    if (task) {
      // Remove from source list
      set((state) => ({
        lists: state.lists.map((list) => {
          if (list.id === sourceListId) {
            return {
              ...list,
              tasks: list.tasks.filter((t) => t.id !== taskId),
            };
          }
          if (list.id === destinationListId) {
            const updatedTask = { ...task, listId: destinationListId, position };
            const newTasks = [...list.tasks];
            newTasks.splice(position, 0, updatedTask);
            return {
              ...list,
              tasks: newTasks.map((t, idx) => ({ ...t, position: idx })),
            };
          }
          return list;
        }),
      }));
    }

    try {
      await axiosClient.post(`/api/boards/${boardId}/tasks/${taskId}/move`, {
        sourceListId,
        destinationListId,
        position,
      });
      // Socket will sync for other users
    } catch (error: unknown) {
      console.error("Error moving task:", error);
      // Revert on error
      get().fetchBoard(boardId);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to move task");
    }
  },

  addMember: async (boardId: string, email: string, role: BoardRole) => {
    try {
      await axiosClient.post(`/api/boards/${boardId}/members`, { email, role });
      // Socket will handle the update via handleMemberAdded
    } catch (error: unknown) {
      console.error("Error adding member:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to add member");
    }
  },

  removeMember: async (boardId: string, memberId: string) => {
    try {
      await axiosClient.delete(`/api/boards/${boardId}/members/${memberId}`);
      // Socket will handle the update via handleMemberRemoved
    } catch (error: unknown) {
      console.error("Error removing member:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to remove member");
    }
  },

  updateMemberRole: async (boardId: string, memberId: string, role: BoardRole) => {
    try {
      await axiosClient.patch(`/api/boards/${boardId}/members/${memberId}/role`, { role });
      // Socket will handle the update via handleMemberRoleUpdated
    } catch (error: unknown) {
      console.error("Error updating member role:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to update role");
    }
  },

  addLabel: async (boardId: string, taskId: string, name: string, color: string) => {
    try {
      await axiosClient.post(`/api/boards/${boardId}/tasks/${taskId}/labels`, { name, color });
    } catch (error: unknown) {
      console.error("Error adding label:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to add label");
    }
  },

  removeLabel: async (boardId: string, taskId: string, labelId: string) => {
    try {
      await axiosClient.delete(`/api/boards/${boardId}/tasks/${taskId}/labels/${labelId}`);
    } catch (error: unknown) {
      console.error("Error removing label:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to remove label");
    }
  },

  assignUser: async (boardId: string, taskId: string, userId: string) => {
    try {
      await axiosClient.post(`/api/boards/${boardId}/tasks/${taskId}/assignees`, { userId });
    } catch (error: unknown) {
      console.error("Error assigning user:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to assign user");
    }
  },

  unassignUser: async (boardId: string, taskId: string, userId: string) => {
    try {
      await axiosClient.delete(`/api/boards/${boardId}/tasks/${taskId}/assignees/${userId}`);
    } catch (error: unknown) {
      console.error("Error unassigning user:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to unassign user");
    }
  },

  reorderTasks: async (boardId: string, listId: string, taskIds: string[]) => {
    try {
      await axiosClient.post(`/api/boards/${boardId}/lists/${listId}/tasks/reorder`, { taskIds });
    } catch (error: unknown) {
      console.error("Error reordering tasks:", error);
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.error || "Failed to reorder tasks");
    }
  },

  // Socket event handlers
  handleListCreated: (list: TaskList) => {
    set((state) => ({
      lists: [...state.lists, list].sort((a, b) => a.position - b.position),
    }));
  },

  handleListUpdated: (list: TaskList) => {
    set((state) => ({
      lists: state.lists.map((l) => (l.id === list.id ? list : l)),
    }));
  },

  handleListDeleted: (listId: string) => {
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== listId),
    }));
  },

  handleTaskCreated: (data: { task: Task; listId: string }) => {
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === data.listId
          ? { ...list, tasks: [...list.tasks, data.task].sort((a, b) => a.position - b.position) }
          : list
      ),
    }));
  },

  handleTaskUpdated: (task: Task) => {
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === task.listId
          ? { ...list, tasks: list.tasks.map((t) => (t.id === task.id ? task : t)) }
          : list
      ),
    }));
  },

  handleTaskDeleted: (data: { taskId: string; listId: string }) => {
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === data.listId
          ? { ...list, tasks: list.tasks.filter((t) => t.id !== data.taskId) }
          : list
      ),
    }));
  },

handleTaskMoved: (data: { task: Task; sourceListId: string; destinationListId: string }) => {
  set((state) => ({
    lists: state.lists.map((list) => {
      if (list.id === data.sourceListId) {
        return { ...list, tasks: list.tasks.filter((t) => t.id !== data.task.id) };
      }
      if (list.id === data.destinationListId) {
        const alreadyExists = list.tasks.some((t) => t.id === data.task.id);
        const filteredTasks = alreadyExists
          ? list.tasks.map((t) => (t.id === data.task.id ? data.task : t))
          : [...list.tasks, data.task];
        return {
          ...list,
          tasks: filteredTasks.sort((a, b) => a.position - b.position),
        };
      }
      return list;
    }),
  }));
},

  handleMemberAdded: (member: BoardMember) => {
    set((state) => ({
      board: state.board
        ? { ...state.board, members: [...state.board.members, member] }
        : null,
    }));
  },

  handleMemberRemoved: (memberId: string) => {
    set((state) => ({
      board: state.board
        ? { ...state.board, members: state.board.members.filter((m) => m.id !== memberId) }
        : null,
    }));
  },

  handleMemberRoleUpdated: (member: BoardMember) => {
    set((state) => ({
      board: state.board
        ? {
            ...state.board,
            members: state.board.members.map((m) => (m.id === member.id ? member : m)),
          }
        : null,
    }));
  },

  handleActivityCreated: (activity: Activity) => {
    set((state) => ({
      activities: [activity, ...state.activities],
    }));
  },

  handleLabelAdded: (data: { taskId: string; label: Label }) => {
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) =>
          task.id === data.taskId
            ? { ...task, labels: [...task.labels, data.label] }
            : task
        ),
      })),
    }));
  },

  handleLabelRemoved: (data: { taskId: string; labelId: string }) => {
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) =>
          task.id === data.taskId
            ? { ...task, labels: task.labels.filter((l) => l.id !== data.labelId) }
            : task
        ),
      })),
    }));
  },

  handleUserAssigned: (data: { taskId: string; assignee: TaskAssignee }) => {
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) =>
          task.id === data.taskId
            ? { ...task, assignees: [...task.assignees, data.assignee] }
            : task
        ),
      })),
    }));
  },

  handleUserUnassigned: (data: { taskId: string; userId: string }) => {
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) =>
          task.id === data.taskId
            ? { ...task, assignees: task.assignees.filter((a) => a.user.id !== data.userId) }
            : task
        ),
      })),
    }));
  },

  handleTasksReordered: (data: { listId: string; taskIds: string[] }) => {
    set((state) => ({
      lists: state.lists.map((list) => {
        if (list.id === data.listId) {
          const taskMap = new Map(list.tasks.map((t) => [t.id, t]));
          return {
            ...list,
            tasks: data.taskIds.map((id, index) => ({
              ...taskMap.get(id)!,
              position: index,
            })),
          };
        }
        return list;
      }),
    }));
  },

  clearBoard: () => {
    set({
      board: null,
      lists: [],
      activities: [],
      currentUserRole: null,
      error: null,
    });
  },
}));
