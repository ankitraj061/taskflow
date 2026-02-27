import { useBoardStore } from "@/stores/useBoardStore";
import type { Task } from "@/types/board.types";
import { Calendar, Clock } from "lucide-react";

interface Props {
  task: Task;
  onClick?: (e: React.MouseEvent) => void;
}

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

export const TaskCard = ({ task, onClick }: Props) => {
  const { currentUserRole } = useBoardStore();

  const isAdmin = currentUserRole === "ADMIN";

  const endDateStatus = getDateStatus(task.endDate);
  const startDateStatus = getDateStatus(task.startDate);

  return (
    <div
      className="group bg-kanban-card border border-border/60 rounded-md p-3 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:-translate-y-0.5"
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

      {/* Date Display */}
      {(task.startDate || task.endDate) && (
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          {task.startDate && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${
                startDateStatus === "overdue"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : startDateStatus === "today"
                  ? "bg-warning/10 text-warning border-warning/20"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
          {task.endDate && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${
                endDateStatus === "overdue"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : endDateStatus === "today"
                  ? "bg-warning/10 text-warning border-warning/20"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>{new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              {endDateStatus === "overdue" && (
                <span className="ml-0.5 text-[9px]">⚠</span>
              )}
            </div>
          )}
        </div>
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
        {isAdmin && (
          <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </div>
        )}
      </div>
    </div>
  );
};
