import { useBoardStore } from "@/stores/useBoardStore";
import { useAuth } from "@/contexts/AuthContext";
import type { Task } from "@/types/board.types";

interface Props {
  task: Task;
  onClick?: (e: React.MouseEvent) => void;
}

export const TaskCard = ({ task, onClick }: Props) => {
  const { currentUserRole } = useBoardStore();
  const { user } = useAuth();

  const isAdmin = currentUserRole === "ADMIN";
  const isAssignedToMe = user
    ? task.assignees.some((a) => a.user.id === user.id)
    : false;

  return (
    <div
      className="group bg-kanban-card border border-border rounded-md p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-150 cursor-pointer"
      onClick={onClick}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
              style={{
                backgroundColor: label.color + "22",
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-card-foreground leading-snug font-medium">
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex -space-x-1">
          {task.assignees.slice(0, 3).map((assignee) => (
            <div
              key={assignee.id}
              className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-medium border-2 border-kanban-card"
              title={assignee.user.name}
            >
              {assignee.user.name.charAt(0)}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div
              className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-medium border-2 border-kanban-card"
              title={`+${task.assignees.length - 3} more`}
            >
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
        {(isAdmin || isAssignedToMe) && (
          <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </div>
        )}
      </div>
    </div>
  );
};