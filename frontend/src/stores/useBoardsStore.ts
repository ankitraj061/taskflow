import { create } from "zustand";
import { AxiosError } from "axios";
import { axiosClient } from "@/client/axiosClient";
import { Board } from "@/types/board.types";
import { Socket } from "socket.io-client";

interface BoardsState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  total: number;
  socket: Socket | null;
  searchTimeoutId: NodeJS.Timeout | null;

  // Actions
  setSocket: (socket: Socket | null) => void;
  fetchBoards: () => Promise<void>;
  createBoard: (title: string, description?: string) => Promise<Board>;
  updateBoard: (boardId: string, title: string, description?: string) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  
  // Socket event handlers
  handleBoardCreated: (board: Board) => void;
  handleBoardUpdated: (board: Board) => void;
  handleBoardDeleted: (boardId: string) => void;
}

export const useBoardsStore = create<BoardsState>((set, get) => ({
  boards: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  currentPage: 1,
  totalPages: 1,
  total: 0,
  socket: null,
  searchTimeoutId: null,

  setSocket: (socket) => {
    const prevSocket = get().socket;
    
    // Remove old listeners
    if (prevSocket) {
      prevSocket.off("boardCreated");
      prevSocket.off("boardUpdated");
      prevSocket.off("boardDeleted");
    }

    // Add new listeners
    if (socket) {
      socket.on("boardCreated", get().handleBoardCreated);
      socket.on("boardUpdated", get().handleBoardUpdated);
      socket.on("boardDeleted", get().handleBoardDeleted);
    }

    set({ socket });
  },

  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const { searchQuery, currentPage } = get();
      
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", currentPage.toString());
      params.append("limit", "12");

      const response = await axiosClient.get(`/api/boards?${params.toString()}`);
      
      set({
        boards: response.data.boards || response.data,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        total: response.data.total || 0,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error fetching boards:", error);
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as { error?: string })?.error || "Failed to fetch boards";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  createBoard: async (title: string, description?: string) => {
    try {
      const response = await axiosClient.post("/api/boards", {
        title,
        description,
      });
      
      const newBoard = response.data;
      
      // Add optimistically
      set((state) => ({
        boards: [newBoard, ...state.boards],
        total: state.total + 1,
      }));

      return newBoard;
    } catch (error: unknown) {
      console.error("Error creating board:", error);
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as { error?: string })?.error || "Failed to create board";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateBoard: async (boardId: string, title: string, description?: string) => {
    try {
      const response = await axiosClient.put(`/api/boards/${boardId}`, {
        title,
        description,
      });
      
      const updatedBoard = response.data;
      
      // Update optimistically
      set((state) => ({
        boards: state.boards.map((b) => (b.id === boardId ? updatedBoard : b)),
      }));
    } catch (error: unknown) {
      console.error("Error updating board:", error);
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as { error?: string })?.error || "Failed to update board";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteBoard: async (boardId: string) => {
    try {
      await axiosClient.delete(`/api/boards/${boardId}`);
      
      // Remove optimistically
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        total: Math.max(0, state.total - 1),
      }));
    } catch (error: unknown) {
      console.error("Error deleting board:", error);
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as { error?: string })?.error || "Failed to delete board";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setSearchQuery: (query: string) => {
    // Clear previous timeout
    const prevTimeoutId = get().searchTimeoutId;
    if (prevTimeoutId) {
      clearTimeout(prevTimeoutId);
    }

    set({ searchQuery: query, currentPage: 1 });

    // Debounce the fetch
    const timeoutId = setTimeout(() => {
      get().fetchBoards();
    }, 300);

    set({ searchTimeoutId: timeoutId });
  },

  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchBoards();
  },

  clearError: () => {
    set({ error: null });
  },

  // Socket event handlers
  handleBoardCreated: (board: Board) => {
    set((state) => {
      // Check if board already exists (avoid duplicates)
      const exists = state.boards.some((b) => b.id === board.id);
      if (exists) return state;

      return {
        boards: [board, ...state.boards],
        total: state.total + 1,
      };
    });
  },

  handleBoardUpdated: (board: Board) => {
    set((state) => ({
      boards: state.boards.map((b) => (b.id === board.id ? board : b)),
    }));
  },

  handleBoardDeleted: (boardId: string) => {
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== boardId),
      total: Math.max(0, state.total - 1),
    }));
  },
}));