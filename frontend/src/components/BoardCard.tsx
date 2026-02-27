import { Board } from "@/types/board.types";
import { Link } from "react-router-dom";
import { Trash2, Users, Calendar, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  board: Board;
  index: number;
  isDeleting?: boolean;
  onEdit: (board: Board) => void;
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

export const BoardCard = ({ board, index, isDeleting = false, onEdit, onDelete }: Props) => {
  const colorClass = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <Link
      to={`/boards/${board.id}`}
      className="group block bg-card border border-border/60 rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all duration-300 animate-fade-in hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-1"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div 
        className={`h-1.5 ${colorClass.startsWith("bg-") ? colorClass : ""}`}
        style={!colorClass.startsWith("bg-") ? { backgroundColor: colorClass } : undefined}
      />
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-base text-card-foreground group-hover:text-primary transition-colors duration-200">
            {board.title}
          </h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(board);
              }}
              disabled={isDeleting}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive disabled:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(board.id);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        {board.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{board.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
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
