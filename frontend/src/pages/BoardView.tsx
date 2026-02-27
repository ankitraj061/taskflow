import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { TaskDetailModal } from "@/components/TaskDetailsModal";

import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBoardStore } from "@/stores/useBoardStore";
import { AppLayout } from "@/layouts/AppLayout";
import { KanbanList } from "@/components/KanbanList";
import { TaskCardOverlay } from "@/components/TaskCardOverlay";
import { ActivitySidebar } from "@/components/ActivitySidebar";
import { ManageMembersModal } from "@/components/ManageMembersModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Activity, ArrowLeft, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "@/types/board.types";

const BoardView = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket , isConnected} = useSocket();
  const {
    board,
    lists,
    activities,
    currentUserRole,
    isLoading,
    fetchBoard,
    fetchActivities,
    addList,
    moveTask,
    setSocket,
    clearBoard,
  } = useBoardStore();

  const [showActivity, setShowActivity] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [showAddList, setShowAddList] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isMovingTask, setIsMovingTask] = useState(false);

  const handleTaskClick = (task: Task) => {
    if (!isAdmin) {
      toast.info("Workers can only move tasks assigned to them");
      return;
    }
    setSelectedTask(task);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const isAdmin = currentUserRole === "ADMIN";



// Effect 1: Wire socket handlers to store
useEffect(() => {
  setSocket(socket);
  return () => setSocket(null);
}, [socket]);

// Effect 2: Fetch board data
useEffect(() => {
  if (!boardId) return;
  fetchBoard(boardId);
  fetchActivities(boardId);
  return () => {
    clearBoard();
  };
}, [boardId]);

// Effect 3: Join/leave socket room (you already have this)
useEffect(() => {
  if (!socket || !boardId) return;
  socket.emit("joinBoard", boardId);
  socket.onAny((event, ...args) => {
    console.log("Socket event received:", event, args);
  });
  return () => {
    socket.emit("leaveBoard", boardId);
    socket.offAny();
  };
}, [socket, boardId]);

  const canDragTask = (task: Task): boolean => {
    if (isAdmin) return true;
    // Workers can only drag tasks assigned to them
    if (currentUserRole === "WORKER" && user) {
      return task.assignees.some((a) => a.user.id === user.id);
    }
    return false;
  };

  const handleAddList = async () => {
    if (!newListTitle.trim() || !boardId) return;
    setIsAddingList(true);
    try {
      await addList(boardId, newListTitle.trim());
      setNewListTitle("");
      setShowAddList(false);
      toast.success("List created");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create list";
      toast.error(message);
    } finally {
      setIsAddingList(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === active.id);
    if (task) {
      if (!canDragTask(task)) {
        toast.error("You can only move tasks assigned to you");
        return;
      }
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !boardId) return;

    const taskId = active.id as string;
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    if (!task) return;

    if (!canDragTask(task)) return;

    let toListId: string;
    const overTask = lists.flatMap((l) => l.tasks).find((t) => t.id === over.id);

    if (overTask) {
      toListId = overTask.listId;
    } else {
      toListId = over.id as string;
    }

    if (task.listId === toListId && !overTask) return;

    const toList = lists.find((l) => l.id === toListId);
    let newPosition = toList ? toList.tasks.length : 0;
    if (overTask) {
      newPosition = toList?.tasks.findIndex((t) => t.id === overTask.id) ?? 0;
    }

    setIsMovingTask(true);
    try {
      await moveTask(boardId, taskId, task.listId, toListId, newPosition);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to move task";
      toast.error(message);
    } finally {
      setIsMovingTask(false);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex gap-4 p-4 md:p-6 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-72 h-96 shrink-0 rounded-lg" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Board Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 bg-card/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {board?.title || "Board"}
                </h1>
                {board?.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{board.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => setShowMembers(true)}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Members</span>
                <span className="text-xs text-muted-foreground">
                  ({board?.members.length || 0})
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={async () => {
                  const newState = !showActivity;
                  setShowActivity(newState);
                  if (newState && boardId) {
                    setIsLoadingActivities(true);
                    try {
                      await fetchActivities(boardId);
                    } finally {
                      setIsLoadingActivities(false);
                    }
                  }
                }}
              >
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Activity</span>
              </Button>
            </div>
          </div>

          {/* Kanban Area */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div className="flex gap-4 p-4 md:p-6 overflow-x-auto flex-1 kanban-scrollbar items-start bg-gradient-to-b from-background/50 to-background">
              {lists.map((list) => (
  <KanbanList
    key={list.id}
    list={list}
    boardId={boardId!}
    isAdmin={isAdmin}
    onTaskClick={handleTaskClick}
  />
))}


              {/* Add List - only for admins */}
              {isAdmin &&
                (showAddList ? (
                  <div className="w-72 shrink-0 bg-kanban-list rounded-lg p-3 animate-scale-in">
                    <Input
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="List title..."
                      autoFocus
                      disabled={isAddingList}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isAddingList) handleAddList();
                        if (e.key === "Escape") setShowAddList(false);
                      }}
                      className="h-8 text-sm bg-card"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleAddList}
                        disabled={isAddingList}
                      >
                        {isAddingList ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setShowAddList(false)}
                        disabled={isAddingList}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-72 shrink-0 h-10 justify-start gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAddList(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add list
                  </Button>
                ))}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Activity Sidebar */}
        {showActivity && (
          <ActivitySidebar
            activities={activities}
            isLoading={isLoadingActivities}
            onClose={() => setShowActivity(false)}
          />
        )}
      </div>

      {/* Members Modal */}
      {boardId && board && (
        <ManageMembersModal
          boardId={boardId}
          open={showMembers}
          onClose={() => setShowMembers(false)}
        />
      )}
      <TaskDetailModal
  task={selectedTask}
  open={!!selectedTask}
  onClose={() => setSelectedTask(null)}
/>
    </AppLayout>
  );
};

export default BoardView;
