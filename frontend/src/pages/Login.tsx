// pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // <-- use context
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Kanban, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth(); // <-- get login function
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (err: unknown) {
  if (err instanceof Error) {
    setError("Login failed. Please try again.");
  } else {
    setError("Login failed. Please try again.");
  }
}
 finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Kanban className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">TaskFlow</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-card-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;