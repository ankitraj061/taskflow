import { useState } from "react";
import { useBoardStore } from "@/stores/useBoardStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Shield, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BoardRole } from "@/types/board.types";

interface Props {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export const ManageMembersModal = ({ boardId, open, onClose }: Props) => {
  const { board, currentUserRole, addMember, removeMember, updateMemberRole } =
    useBoardStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardRole>("WORKER");
  const [isAdding, setIsAdding] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [changingRoleMemberId, setChangingRoleMemberId] = useState<string | null>(null);

  const isAdmin = currentUserRole === "ADMIN";
  const members = board?.members || [];

  const handleAdd = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsAdding(true);
    try {
      await addMember(boardId, trimmed, role);
      toast.success(`Added ${trimmed} as ${role}`);
      setEmail("");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (memberId: string, userName: string) => {
    setRemovingMemberId(memberId);
    try {
      await removeMember(boardId, memberId);
      toast.success(`Removed ${userName}`);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: BoardRole) => {
    setChangingRoleMemberId(memberId);
    try {
      await updateMemberRole(boardId, memberId, newRole);
      toast.success("Role updated");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to update role");
    } finally {
      setChangingRoleMemberId(null);
    }
  };

  const roleIcon = (r: BoardRole) =>
    r === "ADMIN" ? <Shield className="h-3 w-3" /> : <Wrench className="h-3 w-3" />;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-2xl border-border/50">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
        </DialogHeader>

        {/* Add member form - only for admins */}
        {isAdmin && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">
                Email
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground mb-1 block">
                Role
              </label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as BoardRole)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="WORKER">Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={handleAdd}
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Add
                </>
              )}
            </Button>
          </div>
        )}

        {/* Members list */}
        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {/* Owner */}
          {board?.owner && (
            <div className="flex items-center justify-between px-2 py-2 rounded-md bg-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  {board.owner.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {board.owner.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {board.owner.email}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="gap-1 text-xs font-normal">
                <Shield className="h-3 w-3" />
                Owner
              </Badge>
            </div>
          )}

          {/* Members */}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No members yet
            </p>
          )}
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/50 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  {m.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {m.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m.id, v as BoardRole)}
                    disabled={changingRoleMemberId === m.id}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      {changingRoleMemberId === m.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="WORKER">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs font-normal">
                    {roleIcon(m.role)}
                    {m.role}
                  </Badge>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                    onClick={() => handleRemove(m.id, m.user.name)}
                    disabled={removingMemberId === m.id}
                  >
                    {removingMemberId === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Role legend */}
        <div className="border-t border-border pt-3 mt-2 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> <strong>Admin</strong> — Full
            control: manage members, roles, and all tasks
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Wrench className="h-3 w-3" /> <strong>Worker</strong> — Can only
            drag & drop tasks assigned to them
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};