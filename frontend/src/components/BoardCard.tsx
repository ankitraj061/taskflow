import { Board } from "@/types/board.types";
import { Link } from "react-router-dom";
import { Trash2, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  board: Board;
  index: number;
  onDelete: (boardId: string) => void;
}

const ACCENT_COLORS = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "hsl(280, 65%, 60%)",
  "hsl(190, 80%, 45%)",
];

export const BoardCard = ({ board, index, onDelete }: Props) => {
  const colorClass = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <Link
      to={`/boards/${board.id}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div 
        className={`h-1.5 ${colorClass.startsWith("bg-") ? colorClass : ""}`}
        style={!colorClass.startsWith("bg-") ? { backgroundColor: colorClass } : undefined}
      />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors">
            {board.title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(board.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {board.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{board.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {board.members.length} {board.members.length === 1 ? "member" : "members"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(board.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
};
