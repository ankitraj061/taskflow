import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useBoardsStore } from "@/stores/useBoardsStore";
import { AppLayout } from "@/layouts/AppLayout";
import { BoardCard } from "@/components/BoardCard";
import { CreateBoardModal } from "@/components/CreateBoardModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const {
    boards,
    isLoading,
    searchQuery,
    currentPage,
    totalPages,
    total,
    fetchBoards,
    setSearchQuery,
    setPage,
    deleteBoard,
    setSocket,
  } = useBoardsStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // Initialize socket in store
  useEffect(() => {
    if (socket) {
      setSocket(socket);
    }
    return () => {
      setSocket(null);
    };
  }, [socket, setSocket]);

  // Fetch boards on mount
  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Boards</h1>
            <p className="text-sm text-muted-foreground">
              Manage your project boards
              {isConnected && (
                <span className="ml-2 inline-flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Live</span>
                </span>
              )}
            </p>
          </div>
          <Button 
            onClick={() => setShowCreate(true)} 
            size="sm" 
            className="gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Board
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors z-10" />
          <Input
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card border-border/60 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 shadow-sm"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-28 h-28 mb-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
              <Plus className="h-14 w-14 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {searchQuery ? "No boards match your search" : "No boards yet"}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first board to get started"}
            </p>
            {!searchQuery && (
              <Button
                variant="default"
                size="default"
                onClick={() => setShowCreate(true)}
                className="shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Board
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Board Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board, i) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  index={i}
                  isDeleting={deletingBoardId === board.id}
                  onDelete={async (boardId) => {
                    setDeletingBoardId(boardId);
                    try {
                      await deleteBoard(boardId);
                    } finally {
                      setDeletingBoardId(null);
                    }
                  }}
                />
              ))}
            </div>

            {/* Results Summary */}
            {total > 0 && (
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Showing {boards.length} of {total} board{total !== 1 ? "s" : ""}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Create Board Modal */}
        <CreateBoardModal open={showCreate} onClose={() => setShowCreate(false)} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;