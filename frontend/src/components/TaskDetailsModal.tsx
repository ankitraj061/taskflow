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
  Loader2,
  Clock,
  AlertCircle,
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
  const { board, currentUserRole, updateTask, deleteTask, addLabel, removeLabel, assignUser, unassignUser } =
    useBoardStore();
  const canEditTask = currentUserRole === "ADMIN";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(""); // YYYY-MM-DD
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [removingLabelId, setRemovingLabelId] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [unassigningUserId, setUnassigningUserId] = useState<string | null>(null);

  // Label state
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Assignee state
  const [showAssignPopover, setShowAssignPopover] = useState(false);

  const getDateStatus = (date: string | null | undefined): "overdue" | "today" | "upcoming" | null => {
    if (!date) return null;
    const taskDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate < today) return "overdue";
    if (taskDate.getTime() === today.getTime()) return "today";
    return "upcoming";
  };

  const formatDateDisplay = (date: string | null | undefined): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStartDate(task.startDate ? task.startDate.slice(0, 10) : "");
      setEndDate(task.endDate ? task.endDate.slice(0, 10) : "");
    }
  }, [task]);

  useEffect(() => {
    if (!canEditTask && isEditing) {
      setIsEditing(false);
    }
  }, [canEditTask, isEditing]);

  if (!task || !boardId) return null;

  const startDateStatus = getDateStatus(task.startDate);
  const endDateStatus = getDateStatus(task.endDate);

  const handleSave = async () => {
    if (!canEditTask) return;
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    setIsSaving(true);
    try {
      await updateTask(
        boardId,
        task.id,
        title.trim(),
        description.trim() || undefined,
        startDate || null,
        endDate || null
      );
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
    if (!canEditTask) return;
    if (!confirm("Delete this task?")) return;

    setIsDeleting(true);
    try {
      await deleteTask(boardId, task.id);
      onClose();
      toast.success("Task deleted");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete task";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddLabel = async () => {
    if (!canEditTask) return;
    if (!newLabelName.trim()) {
      toast.error("Label name is required");
      return;
    }

    setIsAddingLabel(true);
    try {
      await addLabel(boardId, task.id, newLabelName.trim(), selectedColor);
      setNewLabelName("");
      setShowLabelPopover(false);
      toast.success("Label added");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add label";
      toast.error(message);
    } finally {
      setIsAddingLabel(false);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!canEditTask) return;
    setRemovingLabelId(labelId);
    try {
      await removeLabel(boardId, task.id, labelId);
      toast.success("Label removed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove label";
      toast.error(message);
    } finally {
      setRemovingLabelId(null);
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!canEditTask) return;
    setAssigningUserId(userId);
    try {
      await assignUser(boardId, task.id, userId);
      toast.success("User assigned");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to assign user";
      toast.error(message);
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!canEditTask) return;
    setUnassigningUserId(userId);
    try {
      await unassignUser(boardId, task.id, userId);
      toast.success("User unassigned");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to unassign user";
      toast.error(message);
    } finally {
      setUnassigningUserId(null);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border-border/50">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold mb-2 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="Task title"
                  autoFocus
                  disabled={isSaving}
                />
              ) : (
                <DialogTitle
                  className={canEditTask ? "cursor-pointer hover:bg-muted/50 px-2 py-1 rounded" : "px-2 py-1 rounded"}
                  onClick={canEditTask ? () => setIsEditing(true) : undefined}
                >
                  {task.title}
                </DialogTitle>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Labels Section */}
          <div className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Tag className="h-4 w-4 text-primary" />
                Labels
              </h3>
              {canEditTask && (
                <Popover open={showLabelPopover} onOpenChange={setShowLabelPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs shadow-sm hover:shadow-md">
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
                        disabled={isAddingLabel}
                      >
                        {isAddingLabel ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
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
                    {canEditTask && (
                      <button
                        onClick={() => handleRemoveLabel(label.id)}
                        disabled={removingLabelId === label.id}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                      >
                        {removingLabelId === label.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Assignees Section */}
          <div className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Assignees
              </h3>
              {canEditTask && (
                <Popover open={showAssignPopover} onOpenChange={setShowAssignPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs shadow-sm hover:shadow-md">
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
                              disabled={unassigningUserId === board.owner.id}
                            >
                              {unassigningUserId === board.owner.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleAssignUser(board.owner.id)}
                              disabled={assigningUserId === board.owner.id}
                            >
                              {assigningUserId === board.owner.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Assign"
                              )}
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
                              disabled={unassigningUserId === member.userId}
                            >
                              {unassigningUserId === member.userId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleAssignUser(member.userId)}
                              disabled={assigningUserId === member.userId}
                            >
                              {assigningUserId === member.userId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Assign"
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
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
                    {canEditTask && (
                      <button
                        onClick={() => handleUnassignUser(assignee.user.id)}
                        disabled={unassigningUserId === assignee.user.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                      >
                        {unassigningUserId === assignee.user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="pb-4 border-b border-border/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Schedule
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-primary" />
                      Start date
                    </label>
                    {startDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setStartDate("")}
                        disabled={isSaving}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 text-sm bg-card transition-all duration-200 focus:ring-2 focus:ring-primary/30 border-border/60"
                    disabled={isSaving}
                  />
                  {startDate && (
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateDisplay(startDate)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-primary" />
                      End date
                    </label>
                    {endDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setEndDate("")}
                        disabled={isSaving}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 text-sm bg-card transition-all duration-200 focus:ring-2 focus:ring-primary/30 border-border/60"
                    disabled={isSaving}
                    min={startDate || undefined}
                  />
                  {endDate && (
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateDisplay(endDate)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Start Date */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Start Date</p>
                    {task.startDate ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                            startDateStatus === "overdue"
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : startDateStatus === "today"
                              ? "bg-warning/10 text-warning border-warning/30"
                              : "bg-primary/10 text-primary border-primary/30"
                          }`}
                        >
                          {startDateStatus === "overdue" && (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          <span className="text-sm font-medium">
                            {formatDateDisplay(task.startDate)}
                          </span>
                        </div>
                        {startDateStatus === "overdue" && (
                          <span className="text-[10px] text-destructive font-medium">Overdue</span>
                        )}
                        {startDateStatus === "today" && (
                          <span className="text-[10px] text-warning font-medium">Today</span>
                        )}
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-lg border border-border/50 bg-muted/30">
                        <span className="text-sm text-muted-foreground">No start date set</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* End Date */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">End Date</p>
                    {task.endDate ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                            endDateStatus === "overdue"
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : endDateStatus === "today"
                              ? "bg-warning/10 text-warning border-warning/30"
                              : "bg-primary/10 text-primary border-primary/30"
                          }`}
                        >
                          {endDateStatus === "overdue" && (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          <span className="text-sm font-medium">
                            {formatDateDisplay(task.endDate)}
                          </span>
                        </div>
                        {endDateStatus === "overdue" && (
                          <span className="text-[10px] text-destructive font-medium">Overdue</span>
                        )}
                        {endDateStatus === "today" && (
                          <span className="text-[10px] text-warning font-medium">Due Today</span>
                        )}
                        {endDateStatus === "upcoming" && task.startDate && (
                          <span className="text-[10px] text-muted-foreground">
                            {Math.ceil(
                              (new Date(task.endDate).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days left
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-lg border border-border/50 bg-muted/30">
                        <span className="text-sm text-muted-foreground">No end date set</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Range Summary */}
                {task.startDate && task.endDate && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Duration:{" "}
                        {Math.ceil(
                          (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="pb-4 border-b border-border/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
              <AlignLeft className="h-4 w-4 text-primary" />
              Description
            </h3>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                rows={4}
                className="text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={isSaving}
              />
            ) : (
              <div
                className={`text-sm text-muted-foreground px-2 py-2 rounded min-h-[60px] ${
                  canEditTask ? "cursor-pointer hover:bg-muted/50" : ""
                }`}
                onClick={canEditTask ? () => setIsEditing(true) : undefined}
              >
                {description || "Add a more detailed description..."}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border/50">
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
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            {canEditTask && isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(task.title);
                    setDescription(task.description || "");
                    setStartDate(task.startDate ? task.startDate.slice(0, 10) : "");
                    setEndDate(task.endDate ? task.endDate.slice(0, 10) : "");
                  }}
                  size="sm"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            ) : canEditTask ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                size="sm"
                className="shadow-sm hover:shadow-md"
              >
                Edit Task
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Workers can only drag and drop assigned tasks.
              </p>
            )}
            {canEditTask && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                size="sm"
                className="gap-1.5"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
