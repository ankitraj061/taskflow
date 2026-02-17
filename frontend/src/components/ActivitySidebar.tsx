import type { Activity } from "@/types/board.types";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  activities: Activity[];
  onClose: () => void;
}

type ActivityMetadata = Record<string, string | number | boolean | undefined>;

export const ActivitySidebar = ({ activities, onClose }: Props) => {
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  const formatActivity = (activity: Activity) => {
    const meta = (activity.metadata || {}) as ActivityMetadata;
    
    switch (activity.type) {
      case "BOARD_CREATED":
        return `created this board`;
      case "BOARD_UPDATED":
        return `updated the board`;
      case "MEMBER_ADDED":
        return `added ${meta.memberName} as ${meta.role}`;
      case "MEMBER_REMOVED":
        return `removed ${meta.memberName}`;
      case "MEMBER_ROLE_CHANGED":
        return `changed ${meta.memberName}'s role to ${meta.newRole}`;
      case "LIST_CREATED":
        return `created list "${meta.listTitle}"`;
      case "LIST_UPDATED":
        return `updated list "${meta.listTitle}"`;
      case "LIST_DELETED":
        return `deleted list "${meta.listTitle}"`;
      case "TASK_CREATED":
        return `created task "${meta.taskTitle}"`;
      case "TASK_UPDATED":
        return `updated task "${meta.taskTitle}"`;
      case "TASK_DELETED":
        return `deleted task "${meta.taskTitle}"`;
      case "TASK_MOVED":
        return `moved "${meta.taskTitle}" from ${meta.fromList} to ${meta.toList}`;
      case "TASK_ASSIGNED":
        return `assigned "${meta.taskTitle}" to ${meta.assignedUserName}`;
      case "TASK_UNASSIGNED":
        return `unassigned "${meta.taskTitle}" from ${meta.unassignedUserName}`;
      case "LABEL_ADDED":
        return `added label "${meta.labelName}"`;
      case "LABEL_REMOVED":
        return `removed label "${meta.labelName}"`;
      default:
        return activity.type.toLowerCase().replace(/_/g, " ");
    }
  };

  return (
    <div className="w-72 border-l border-border bg-card shrink-0 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 kanban-scrollbar">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No activity yet
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-2.5 animate-fade-in">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                {activity.user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-medium">{activity.user.name}</span>{" "}
                  <span className="text-muted-foreground">
                    {formatActivity(activity)}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};