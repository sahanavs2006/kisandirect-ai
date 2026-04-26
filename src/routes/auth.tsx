import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Store, Tractor, Mail, Lock, Eye, EyeOff, User as UserIcon, MapPin } from "lucide-react";
import logoUrl from "@/assets/krishimithra-logo.png";
import grassUrl from "@/assets/grass-bg.jpg";

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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top white curved section with logo */}
      <div className="relative bg-background pt-10 pb-20 px-4">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <img src={logoUrl} alt="KrishiMithra logo" className="h-24 w-auto object-contain" />
        </div>
        {/* Curved bottom edge */}
        <svg
          className="absolute -bottom-1 left-0 w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,0 C480,100 960,100 1440,0 L1440,80 L0,80 Z"
            fill="var(--background)"
            transform="scale(1,-1) translate(0,-80)"
          />
        </svg>
      </div>

      {/* Grass background bottom section */}
      <div
        className="relative px-4 pt-10 pb-16 min-h-[60vh]"
        style={{
          backgroundImage: `linear-gradient(to bottom, oklch(0.32 0.12 145 / 0.55), oklch(0.22 0.10 145 / 0.75)), url(${grassUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="text-accent text-sm font-medium">Welcome to</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">KrishiMithra</h1>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full mb-5 bg-white/15 backdrop-blur border border-white/20">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-primary text-white">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-primary text-white">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
      <PillField icon={<Mail className="h-4 w-4" />}>
        <Input
          id="si-email"
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12"
        />
      </PillField>
      <PillField icon={<Lock className="h-4 w-4" />} trailing={
        <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password visibility" className="text-muted-foreground hover:text-foreground">
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }>
        <Input
          id="si-pw"
          type={showPw ? "text" : "password"}
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12"
        />
      </PillField>
      <div className="px-1 text-sm text-white">
        Forgot <span className="text-accent font-semibold">password?</span>
      </div>
      <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-white text-primary hover:bg-white/90 font-semibold text-base shadow-md">
        {loading ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}

function PillField({ icon, children, trailing }: { icon: React.ReactNode; children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-full px-4 h-12 shadow-sm">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
      {trailing}
    </div>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    <form onSubmit={handle} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setRole("farmer")}
          className={`rounded-2xl border-2 p-3 text-left transition-all ${role === "farmer" ? "border-accent bg-white text-foreground" : "border-white/30 bg-white/10 text-white hover:bg-white/20"}`}>
          <Tractor className={`h-5 w-5 mb-1 ${role === "farmer" ? "text-primary" : "text-white"}`} />
          <div className="font-semibold text-sm">I'm a Farmer</div>
          <div className={`text-xs ${role === "farmer" ? "text-muted-foreground" : "text-white/80"}`}>Sell directly to marts</div>
        </button>
        <button type="button" onClick={() => setRole("mart")}
          className={`rounded-2xl border-2 p-3 text-left transition-all ${role === "mart" ? "border-accent bg-white text-foreground" : "border-white/30 bg-white/10 text-white hover:bg-white/20"}`}>
          <Store className={`h-5 w-5 mb-1 ${role === "mart" ? "text-primary" : "text-white"}`} />
          <div className="font-semibold text-sm">I'm a Mart</div>
          <div className={`text-xs ${role === "mart" ? "text-muted-foreground" : "text-white/80"}`}>Buy verified produce</div>
        </button>
      </div>
      <PillField icon={<UserIcon className="h-4 w-4" />}>
        <Input id="su-name" required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12" />
      </PillField>
      <PillField icon={<MapPin className="h-4 w-4" />}>
        <Input id="su-region" placeholder="Region / City (e.g. Nashik, Maharashtra)" required value={region} onChange={(e) => setRegion(e.target.value)} className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12" />
      </PillField>
      <PillField icon={<Mail className="h-4 w-4" />}>
        <Input id="su-email" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12" />
      </PillField>
      <PillField icon={<Lock className="h-4 w-4" />} trailing={
        <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted-foreground hover:text-foreground">
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }>
        <Input id="su-pw" type={showPw ? "text" : "password"} required minLength={6} placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12" />
      </PillField>
      <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-white text-primary hover:bg-white/90 font-semibold text-base shadow-md mt-2">
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}