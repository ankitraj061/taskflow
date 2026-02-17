import type { Task } from "@/types";

interface Props {
  task: Task;
}

export const TaskCardOverlay = ({ task }: Props) => {
  return (
    <div className="w-[272px] bg-kanban-drag-overlay border-2 border-primary/40 rounded-md p-3 shadow-xl rotate-2 opacity-90">
      {task.labels.length > 0 && (
        <div className="flex gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
              style={{ backgroundColor: label.color + "22", color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-foreground">{task.title}</p>
    </div>
  );
};
