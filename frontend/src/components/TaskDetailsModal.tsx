import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBoardStore } from "@/stores/useBoardStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  X,
  Tag,
  Users,
  Trash2,
  Calendar,
  AlignLeft,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import type { Task, Label } from "@/types/board.types";

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

export const TaskDetailModal = ({ task, open, onClose }: Props) => {
  const { boardId } = useParams<{ boardId: string }>();
  const { board, updateTask, deleteTask, addLabel, removeLabel, assignUser, unassignUser } =
    useBoardStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Label state
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Assignee state
  const [showAssignPopover, setShowAssignPopover] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  if (!task || !boardId) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSaving(true);
    try {
      await updateTask(boardId, task.id, title.trim(), description.trim() || undefined);
      setIsEditing(false);
      toast.success("Task updated");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update task";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;

    try {
      await deleteTask(boardId, task.id);
      onClose();
      toast.success("Task deleted");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete task";
      toast.error(message);
    }
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) {
      toast.error("Label name is required");
      return;
    }

    try {
      await addLabel(boardId, task.id, newLabelName.trim(), selectedColor);
      setNewLabelName("");
      setShowLabelPopover(false);
      toast.success("Label added");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add label";
      toast.error(message);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await removeLabel(boardId, task.id, labelId);
      toast.success("Label removed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove label";
      toast.error(message);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      await assignUser(boardId, task.id, userId);
      toast.success("User assigned");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to assign user";
      toast.error(message);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    try {
      await unassignUser(boardId, task.id, userId);
      toast.success("User unassigned");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to unassign user";
      toast.error(message);
    }
  };

  const availableMembers =
    board?.members.filter(
      (m) => !task.assignees.some((a) => a.user.id === m.userId)
    ) || [];

  const isAssigned = (userId: string) =>
    task.assignees.some((a) => a.user.id === userId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold mb-2"
                  placeholder="Task title"
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                  onClick={() => setIsEditing(true)}
                >
                  {task.title}
                </DialogTitle>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Labels Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Labels
              </h3>
              <Popover open={showLabelPopover} onOpenChange={setShowLabelPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    Add Label
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Create Label</h4>
                    <Input
                      placeholder="Label name"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Select color
                      </p>
                      <div className="grid grid-cols-8 gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                              selectedColor === color
                                ? "ring-2 ring-offset-2 ring-primary"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleAddLabel}
                      className="w-full"
                      size="sm"
                    >
                      Create
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 flex-wrap">
              {task.labels.length === 0 ? (
                <p className="text-xs text-muted-foreground">No labels</p>
              ) : (
                task.labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="gap-1 group"
                    style={{
                      backgroundColor: label.color + "22",
                      color: label.color,
                      borderColor: label.color + "44",
                    }}
                  >
                    {label.name}
                    <button
                      onClick={() => handleRemoveLabel(label.id)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Assignees Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignees
              </h3>
              <Popover open={showAssignPopover} onOpenChange={setShowAssignPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Assign Members</h4>
                    
                    {/* Owner */}
                    {board?.owner && (
                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                            {board.owner.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{board.owner.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Owner
                            </p>
                          </div>
                        </div>
                        {isAssigned(board.owner.id) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleUnassignUser(board.owner.id)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleAssignUser(board.owner.id)}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Members */}
                    {board?.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                            {member.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium">
                              {member.user.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        {isAssigned(member.userId) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleUnassignUser(member.userId)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleAssignUser(member.userId)}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 flex-wrap">
              {task.assignees.length === 0 ? (
                <p className="text-xs text-muted-foreground">No assignees</p>
              ) : (
                task.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md group"
                  >
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">
                      {assignee.user.name.charAt(0)}
                    </div>
                    <span className="text-xs">{assignee.user.name}</span>
                    <button
                      onClick={() => handleUnassignUser(assignee.user.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlignLeft className="h-4 w-4" />
              Description
            </h3>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                rows={4}
                className="text-sm"
              />
            ) : (
              <div
                className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 px-2 py-2 rounded min-h-[60px]"
                onClick={() => setIsEditing(true)}
              >
                {description || "Add a more detailed description..."}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
            {task.updatedAt !== task.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Updated {new Date(task.updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(task.title);
                    setDescription(task.description || "");
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                size="sm"
              >
                Edit Task
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleDelete}
              size="sm"
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};