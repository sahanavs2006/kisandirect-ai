import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sprout, LogOut } from "lucide-react";

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-elegant)] group-hover:scale-105 transition-transform">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Kisan<span className="text-primary">Direct</span>
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-accent-foreground bg-accent/30 rounded px-1.5 py-0.5 align-middle">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
          {user && role === "farmer" && (
            <Link to="/farmer" className="text-muted-foreground hover:text-foreground transition-colors">Farmer Dashboard</Link>
          )}
          {user && role === "mart" && (
            <Link to="/mart" className="text-muted-foreground hover:text-foreground transition-colors">Mart Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-muted-foreground">
                {role && <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">{role}</span>}
              </span>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}>Sign in</Button>
              <Button size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })} className="bg-[image:var(--gradient-hero)] hover:opacity-90">Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}