import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBoardStore } from "@/stores/useBoardStore";
import { SortableTaskCard } from "@/components/SortableTaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Trash2, Edit2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { TaskList, Task } from "@/types/board.types";

interface Props {
  list: TaskList;
  boardId: string;
  isAdmin?: boolean;
  onTaskClick: (task: Task) => void;
}

export const KanbanList = ({ list, boardId, isAdmin = true, onTaskClick }: Props) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isUpdatingList, setIsUpdatingList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  
  const { addTask, updateList, deleteList } = useBoardStore();

  const { setNodeRef, isOver } = useDroppable({ id: list.id });

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      await addTask(list.id, boardId, newTaskTitle.trim());
      setNewTaskTitle("");
      setShowAddTask(false);
      toast.success("Task created");
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "Failed to create task";
      toast.error(message);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleUpdateList = async () => {
    if (!editTitle.trim() || editTitle === list.title) {
      setIsEditing(false);
      setEditTitle(list.title);
      return;
    }
    setIsUpdatingList(true);
    try {
      await updateList(boardId, list.id, editTitle.trim());
      setIsEditing(false);
      toast.success("List updated");
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "Failed to update list";
      toast.error(message);
      setEditTitle(list.title);
    } finally {
      setIsUpdatingList(false);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm(`Delete "${list.title}" and all its tasks?`)) return;
    setIsDeletingList(true);
    try {
      await deleteList(boardId, list.id);
      toast.success("List deleted");
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete list";
      toast.error(message);
    } finally {
      setIsDeletingList(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 bg-kanban-list/80 backdrop-blur-sm rounded-lg flex flex-col max-h-[calc(100vh-10rem)] transition-all duration-300 shadow-sm border border-border/50 ${
        isOver ? "ring-2 ring-primary/50 ring-offset-2 scale-[1.02] shadow-lg" : "hover:shadow-md hover:border-primary/20"
      }`}
    >
      {/* List Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/30">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleUpdateList}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateList();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditTitle(list.title);
                }
              }}
              autoFocus
              className="h-7 text-xs font-semibold uppercase"
              disabled={isUpdatingList}
            />
            {isUpdatingList && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {list.title}
            </h3>
            <span className="text-xs text-muted-foreground bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold min-w-[20px] text-center">
              {list.tasks.length}
            </span>
          </div>
        )}
        {isAdmin && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                Edit list
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteList}
                className="text-destructive focus:text-destructive"
                disabled={isDeletingList}
              >
                {isDeletingList ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete list
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 kanban-scrollbar">
        <SortableContext
          items={list.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {/* Add Task Inline */}
        {showAddTask ? (
          <div className="animate-scale-in">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                className="h-8 text-sm bg-card"
                disabled={isAddingTask}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAddingTask) handleAddTask();
                  if (e.key === "Escape") setShowAddTask(false);
                }}
              />
            <div className="flex gap-2 mt-1.5">
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                onClick={handleAddTask}
                disabled={isAddingTask}
              >
                {isAddingTask ? (
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
                className="h-6 text-xs px-2"
                onClick={() => setShowAddTask(false)}
                disabled={isAddingTask}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 justify-start gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowAddTask(true)}
          >
            <Plus className="h-3 w-3" />
            Add task
          </Button>
        )}
      </div>
    </div>
  );
};