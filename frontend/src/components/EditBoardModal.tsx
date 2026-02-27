import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useBoardsStore } from "@/stores/useBoardsStore";
import { useToast } from "@/hooks/use-toast";
import type { Board } from "@/types/board.types";

interface Props {
  open: boolean;
  board: Board | null;
  onClose: () => void;
}

export const EditBoardModal = ({ open, board, onClose }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const updateBoard = useBoardsStore((s) => s.updateBoard);
  const { toast } = useToast();

  useEffect(() => {
    if (open && board) {
      setTitle(board.title);
      setDescription(board.description ?? "");
    }
  }, [open, board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !title.trim()) return;

    setLoading(true);
    try {
      await updateBoard(board.id, title.trim(), description.trim() || undefined);
      toast({
        title: "Success",
        description: "Board updated successfully",
      });
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update board";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md shadow-2xl border-border/50">
        <DialogHeader>
          <DialogTitle>Edit Board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-board-title">Title</Label>
            <Input
              id="edit-board-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Board name"
              required
              autoFocus
              disabled={loading}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-board-desc">Description (optional)</Label>
            <Textarea
              id="edit-board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this board for?"
              rows={3}
              disabled={loading}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
