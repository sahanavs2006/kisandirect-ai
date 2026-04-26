import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Monitor, Smartphone, Globe } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & login history — KrishiMithra" },
      { name: "description", content: "Review your account info and recent sign-ins to KrishiMithra." },
    ],
  }),
  component: AccountPage,
});

type Login = { id: string; user_agent: string | null; created_at: string };

function AccountPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [logins, setLogins] = useState<Login[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBusy(true);
      const { data } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setLogins((data ?? []) as Login[]);
      setBusy(false);
    })();
  }, [user]);

  if (loading || !user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;

  const deviceIcon = (ua: string | null) => {
    if (!ua) return <Globe className="h-4 w-4" />;
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };
  const deviceLabel = (ua: string | null) => {
    if (!ua) return "Unknown device";
    const browser = /Chrome\/[\d.]+/.exec(ua)?.[0] || /Firefox\/[\d.]+/.exec(ua)?.[0] || /Safari\/[\d.]+/.exec(ua)?.[0] || "Browser";
    const os = /Windows NT [\d.]+/.exec(ua)?.[0] || /Mac OS X [\d_.]+/.exec(ua)?.[0] || /Android [\d.]+/.exec(ua)?.[0] || /iPhone OS [\d_.]+/.exec(ua)?.[0] || "OS";
    return `${browser} · ${os}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Account</h1>
      <p className="text-muted-foreground mt-1 mb-6">Manage your KrishiMithra account.</p>

      <Card className="p-5 mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Signed in as</div>
        <div className="font-semibold">{user.email}</div>
        {role && <Badge className="mt-2 capitalize">{role}</Badge>}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <HistoryIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Login history</h2>
        </div>
        {busy ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : logins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No login records yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {logins.map((l) => {
              const when = new Date(l.created_at);
              return (
                <li key={l.id} className="py-3 flex items-center gap-3">
                  <span className="text-muted-foreground">{deviceIcon(l.user_agent)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{deviceLabel(l.user_agent)}</div>
                    <div className="text-xs text-muted-foreground">{when.toLocaleDateString()} · {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
