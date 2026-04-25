import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Sprout, Store, Tractor } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, role } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(search.mode);

  useEffect(() => {
    if (user && role) {
      navigate({ to: role === "mart" ? "/mart" : "/farmer" });
    }
  }, [user, role, navigate]);

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-elegant)] mb-4">
            <Sprout className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to KisanDirect AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Predict, inspect, connect.</p>
        </div>

        <Card className="p-6 shadow-[var(--shadow-card)]">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-[image:var(--gradient-hero)] hover:opacity-90">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState("");
  const [role, setRole] = useState<"farmer" | "mart">("farmer");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, region, role },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! You can start using KisanDirect AI.");
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setRole("farmer")}
          className={`rounded-lg border-2 p-3 text-left transition-all ${role === "farmer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
          <Tractor className="h-5 w-5 text-primary mb-1" />
          <div className="font-semibold text-sm">I'm a Farmer</div>
          <div className="text-xs text-muted-foreground">Sell directly to marts</div>
        </button>
        <button type="button" onClick={() => setRole("mart")}
          className={`rounded-lg border-2 p-3 text-left transition-all ${role === "mart" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
          <Store className="h-5 w-5 text-primary mb-1" />
          <div className="font-semibold text-sm">I'm a Mart</div>
          <div className="text-xs text-muted-foreground">Buy verified produce</div>
        </button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-region">Region / City</Label>
        <Input id="su-region" placeholder="e.g. Nashik, Maharashtra" required value={region} onChange={(e) => setRegion(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-pw">Password</Label>
        <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-[image:var(--gradient-hero)] hover:opacity-90">
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}