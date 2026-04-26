import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode, DEMO_SCANS } from "@/lib/demo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Leaf, AlertTriangle, Sparkles, ArrowLeft, ScanLine } from "lucide-react";

export const Route = createFileRoute("/scans")({
  head: () => ({
    meta: [
      { title: "Scan history — KrishiMithra" },
      { name: "description", content: "Review past AI plant disease diagnoses, remedies and confidence scores." },
    ],
  }),
  component: ScansPage,
});

type Scan = {
  id: string;
  farmer_id: string;
  image_url: string;
  diagnosis: any;
  created_at: string;
};

function ScansPage() {
  const { user, role, loading } = useAuth();
  const { demo } = useDemoMode();
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (demo) return;
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
    if (!loading && user && role && role !== "farmer") navigate({ to: "/mart" });
  }, [user, role, loading, navigate, demo]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      if (demo) {
        setScans(DEMO_SCANS as Scan[]);
        setBusy(false);
        return;
      }
      if (!user) return;
      const { data } = await supabase
        .from("scans")
        .select("*")
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: false });
      setScans((data ?? []) as Scan[]);
      setBusy(false);
    })();
  }, [user, demo]);

  if (!demo && (loading || !user)) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
        <div>
          <Link to="/farmer" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Farmer Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-7 w-7 text-primary" /> Scan history
          </h1>
          <p className="text-muted-foreground mt-1">
            Every diagnosis the AI has ever made for you, with timestamps and remedies.
            {demo && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Sparkles className="h-3 w-3" />Demo data</span>}
          </p>
        </div>
        <Link to="/farmer">
          <Button className="bg-[image:var(--gradient-hero)] hover:opacity-90">
            <ScanLine className="h-4 w-4 mr-2" /> New scan
          </Button>
        </Link>
      </div>

      {busy ? (
        <div className="text-center py-20 text-muted-foreground">Loading scans...</div>
      ) : scans.length === 0 ? (
        <Card className="p-12 text-center">
          <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No scans yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Run your first disease scan from the Farmer Dashboard.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scans.map((s) => <ScanRow key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}

function ScanRow({ s }: { s: Scan }) {
  const d = s.diagnosis ?? {};
  const sev = (d.severity as string) ?? "—";
  const sevColor =
    sev === "healthy" ? "bg-success/20 text-success"
    : sev === "mild" ? "bg-warning/30 text-foreground"
    : sev === "moderate" ? "bg-warning text-foreground"
    : sev === "severe" ? "bg-destructive/20 text-destructive"
    : "bg-muted text-foreground";
  const conf = Number(d.confidence ?? 0);
  const when = new Date(s.created_at);
  const whenLabel = `${when.toLocaleDateString()} · ${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-3">
        <div className="aspect-square bg-muted overflow-hidden">
          <img src={s.image_url} alt={d.disease ?? "Scan"} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="col-span-2 p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-lg leading-tight">{d.disease ?? "Diagnosis"}</h3>
              <Badge className={sevColor}>{sev}</Badge>
            </div>
            {d.scientific_name && <div className="text-xs italic text-muted-foreground">{d.scientific_name}</div>}
            <div className="text-xs text-muted-foreground mt-1">{whenLabel}</div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI confidence</span>
              <span className="font-semibold">{conf}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-[image:var(--gradient-hero)]" style={{ width: `${Math.min(100, Math.max(0, conf))}%` }} />
            </div>
          </div>

          {d.urgency && d.urgency !== "none" && (
            <div className="text-xs flex items-center gap-1 text-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Urgency: <strong>{d.urgency}</strong>
            </div>
          )}

          {d.organic_remedy && (
            <div className="rounded-md bg-success/10 border border-success/30 p-2.5 text-xs">
              <div className="flex items-center gap-1 font-semibold text-success mb-0.5"><Leaf className="h-3.5 w-3.5" />Organic remedy</div>
              <p className="leading-relaxed">{d.organic_remedy}</p>
            </div>
          )}

          {d.chemical_remedy && (
            <div className="rounded-md bg-muted/60 border border-border/60 p-2.5 text-xs">
              <div className="flex items-center gap-1 font-semibold mb-0.5"><AlertTriangle className="h-3.5 w-3.5" />Chemical remedy</div>
              <p className="leading-relaxed">{d.chemical_remedy}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
