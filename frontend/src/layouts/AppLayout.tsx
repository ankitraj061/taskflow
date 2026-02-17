import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 md:px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <Kanban className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight">TaskFlow</span>
          </Link>
          {location.pathname !== "/dashboard" && (
            <Link to="/dashboard" className="ml-4 flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Boards
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">{user?.name}</span>
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
            {user?.name?.charAt(0) || "U"}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="h-7 px-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};
