import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "@/components/TaskCard";
import type { Task } from "@/types/board.types";

interface Props {
  task: Task;
  onTaskClick: (task: Task) => void;
}

export const SortableTaskCard = ({ task, onTaskClick }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Handle click separately from drag
  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if we're not dragging
    if (!isDragging) {
      onTaskClick(task);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners}>
        <TaskCard task={task} onClick={handleClick} />
      </div>
    </div>
  );
};