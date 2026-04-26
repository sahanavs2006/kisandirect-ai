import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Minus, Upload, Sparkles, Leaf, IndianRupee, ArrowUp, ArrowDown, AlertTriangle, ScanLine, Loader2 } from "lucide-react";
import { predictPrice, scanDisease } from "@/server/ai.functions";
import { useDemoMode, DEMO_FORECAST, DEMO_DIAGNOSIS, DEMO_FARMER_LISTINGS, DEMO_SCANS } from "@/lib/demo";

export const Route = createFileRoute("/farmer")({
  component: FarmerDashboard,
});

function FarmerDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { demo } = useDemoMode();

  useEffect(() => {
    if (demo) return;
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
    if (!loading && user && role && role !== "farmer") navigate({ to: "/mart" });
  }, [user, role, loading, navigate, demo]);

  if (!demo && (loading || !user)) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Farmer Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Predict prices, scan crops, sell directly.
          {demo && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Sparkles className="h-3 w-3" />Demo mode</span>}
        </p>
      </div>

      <Tabs defaultValue="predict" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-6">
          <TabsTrigger value="predict"><TrendingUp className="h-4 w-4 mr-1.5" />Predict</TabsTrigger>
          <TabsTrigger value="list"><Upload className="h-4 w-4 mr-1.5" />List</TabsTrigger>
          <TabsTrigger value="scan"><ScanLine className="h-4 w-4 mr-1.5" />Scan</TabsTrigger>
          <TabsTrigger value="history"><Leaf className="h-4 w-4 mr-1.5" />History</TabsTrigger>
        </TabsList>
        <TabsContent value="predict"><PricePredictorTab /></TabsContent>
        <TabsContent value="list"><CreateListingTab /></TabsContent>
        <TabsContent value="scan"><DiseaseScanTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────── PRICE PREDICTION ─────────── */
function PricePredictorTab() {
  const { user } = useAuth();
  const { demo } = useDemoMode();
  const [crop, setCrop] = useState("Onion");
  const [region, setRegion] = useState("Nashik, Maharashtra");
  const [price, setPrice] = useState(28);
  const [qty, setQty] = useState(500);
  const [weather, setWeather] = useState("Heavy rain expected this week");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(demo ? DEMO_FORECAST : null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 700));
        setResult(DEMO_FORECAST);
        return;
      }
      const r = await predictPrice({
        data: { crop, region, currentPricePerKg: Number(price), weather, quantityKg: Number(qty) },
      });
      setResult(r);
      if (user) {
        await supabase.from("predictions").insert({
          user_id: user.id,
          crop, region,
          current_price_per_kg: Number(price),
          weather,
          forecast: r,
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold mb-1">Market Pulse</h2>
        <p className="text-sm text-muted-foreground mb-5">AI analyses weather, supply trends, and Mandi history to forecast 14 days out.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Crop</Label>
              <Input value={crop} onChange={(e) => setCrop(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current ₹/kg</Label>
              <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Your stock (kg)</Label>
              <Input type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Local weather / news</Label>
            <Textarea rows={2} value={weather} onChange={(e) => setWeather(e.target.value)} />
          </div>
          <Button onClick={run} disabled={loading} className="w-full bg-[image:var(--gradient-hero)] hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI is reasoning...</> : <><Sparkles className="h-4 w-4 mr-2" />Forecast prices</>}
          </Button>
        </div>
      </Card>

      <Card className="p-6 shadow-[var(--shadow-card)] min-h-[400px]">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
            <TrendingUp className="h-12 w-12 mb-3 opacity-40" />
            <p>Run a forecast to see the AI's recommendation.</p>
          </div>
        ) : (
          <ForecastResult result={result} currentPrice={Number(price)} qty={Number(qty)} />
        )}
      </Card>
    </div>
  );
}

function ForecastResult({ result, currentPrice, qty }: { result: any; currentPrice: number; qty: number }) {
  const action = result.recommendation as string;
  const actionStyle = action === "SELL_NOW" ? "bg-warning text-foreground"
    : action === "HOLD_2_WEEKS" ? "bg-success text-primary-foreground"
    : "bg-primary text-primary-foreground";
  const actionLabel = action === "SELL_NOW" ? "Sell Now" : action === "HOLD_1_WEEK" ? "Hold 1 Week" : "Hold 2 Weeks";

  const change = result.price_change_pct_14d ?? 0;
  const extra = result.estimated_extra_income_inr ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Recommendation</div>
          <div className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${actionStyle}`}>{actionLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Confidence</div>
          <div className="text-2xl font-bold">{result.confidence}%</div>
        </div>
      </div>

      <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-3">{result.action_summary}</p>

      <div className="grid grid-cols-3 gap-3">
        <PriceCell label="Today" value={currentPrice} />
        <PriceCell label="In 7 days" value={result.predicted_price_7d} compare={currentPrice} />
        <PriceCell label="In 14 days" value={result.predicted_price_14d} compare={currentPrice} />
      </div>

      <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">14-day price change</div>
          <div className={`text-lg font-bold ${change > 0 ? "text-success" : change < 0 ? "text-destructive" : ""}`}>
            {change > 0 ? "+" : ""}{change.toFixed(1)}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Extra income on {qty}kg</div>
          <div className={`text-lg font-bold flex items-center justify-end ${extra > 0 ? "text-success" : extra < 0 ? "text-destructive" : ""}`}>
            <IndianRupee className="h-4 w-4" />{Math.round(extra).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key drivers</div>
        <div className="space-y-2">
          {(result.drivers || []).map((d: any, i: number) => (
            <div key={i} className="flex gap-3 items-start">
              <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${d.impact === "positive" ? "bg-success/20 text-success" : d.impact === "negative" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>
                {d.impact === "positive" ? <TrendingUp className="h-3.5 w-3.5" /> : d.impact === "negative" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{d.factor}</div>
                <div className="text-xs text-muted-foreground">{d.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.risk_note && (
        <div className="text-xs text-muted-foreground border-l-2 border-warning pl-3 italic">⚠️ {result.risk_note}</div>
      )}
    </div>
  );
}

function PriceCell({ label, value, compare }: { label: string; value: number; compare?: number }) {
  const diff = compare != null ? value - compare : 0;
  return (
    <div className="rounded-lg border border-border/60 p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold flex items-center justify-center"><IndianRupee className="h-4 w-4" />{value?.toFixed(1)}</div>
      {compare != null && diff !== 0 && (
        <div className={`text-xs flex items-center justify-center gap-0.5 ${diff > 0 ? "text-success" : "text-destructive"}`}>
          {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          ₹{Math.abs(diff).toFixed(1)}
        </div>
      )}
    </div>
  );
}

/* ─────────── CREATE LISTING ─────────── */
function CreateListingTab() {
  const { user } = useAuth();
  const { demo } = useDemoMode();
  const [crop, setCrop] = useState("Tomato");
  const [variety, setVariety] = useState("");
  const [qty, setQty] = useState(100);
  const [price, setPrice] = useState(20);
  const [region, setRegion] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (demo) {
      toast.success("Demo: listing would be published. Sign up to go live.");
      return;
    }
    if (!user) return;
    if (files.length === 0) { toast.error("Add at least 1 photo"); return; }
    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("crops").upload(path, f, { contentType: f.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("crops").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      const { error } = await supabase.from("listings").insert({
        farmer_id: user.id,
        crop, variety: variety || null,
        quantity_kg: Number(qty),
        asking_price_per_kg: Number(price),
        region: region || null,
        image_urls: urls,
      });
      if (error) throw error;
      toast.success("Listing created! Marts can now buy.");
      setFiles([]); setVariety(""); setQty(100); setPrice(20);
    } catch (e: any) {
      toast.error(e.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-semibold mb-1">Create a listing</h2>
      <p className="text-sm text-muted-foreground mb-5">Snap photos of your harvest. Marts will see them with AI quality scores.</p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Crop</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} /></div>
          <div className="space-y-2"><Label>Variety (optional)</Label><Input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. Roma" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Quantity (kg)</Label><Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Asking ₹/kg</Label><Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
        </div>
        <div className="space-y-2"><Label>Region</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Pune, Maharashtra" /></div>
        <div className="space-y-2">
          <Label>Photos (up to 4)</Label>
          <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 4))} />
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {files.map((f, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border/60">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
        <Button onClick={submit} disabled={submitting} className="w-full bg-[image:var(--gradient-hero)] hover:opacity-90">
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : "Publish listing"}
        </Button>
      </div>
    </Card>
  );
}

/* ─────────── DISEASE SCAN ─────────── */
function DiseaseScanTab() {
  const { user } = useAuth();
  const { demo } = useDemoMode();
  const [file, setFile] = useState<File | null>(null);
  const [cropHint, setCropHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(demo ? DEMO_DIAGNOSIS : null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const run = async () => {
    if (demo) {
      setLoading(true);
      setResult(null);
      await new Promise((r) => setTimeout(r, 700));
      setResult(DEMO_DIAGNOSIS);
      setLoading(false);
      return;
    }
    if (!file || !user) { toast.error("Upload a photo first"); return; }
    setLoading(true);
    setResult(null);
    try {
      const path = `${user.id}/scans/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("crops").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("crops").getPublicUrl(path);
      setImageUrl(pub.publicUrl);
      const r = await scanDisease({ data: { imageUrl: pub.publicUrl, cropHint: cropHint || undefined } });
      setResult(r);
      await supabase.from("scans").insert({
        farmer_id: user.id,
        image_url: pub.publicUrl,
        diagnosis: r,
      });
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold mb-1">Disease scan</h2>
        <p className="text-sm text-muted-foreground mb-5">Photograph a sick leaf. AI returns the disease, severity, and remedies.</p>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Crop hint (optional)</Label><Input value={cropHint} onChange={(e) => setCropHint(e.target.value)} placeholder="e.g. Potato, Tomato" /></div>
          <div className="space-y-2"><Label>Photo</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          {file && <div className="aspect-video rounded-lg overflow-hidden border border-border/60"><img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" /></div>}
          <Button onClick={run} disabled={loading || (!file && !demo)} className="w-full bg-[image:var(--gradient-hero)] hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Diagnosing...</> : <><ScanLine className="h-4 w-4 mr-2" />Diagnose with AI</>}
          </Button>
          {demo && !file && <p className="text-xs text-muted-foreground">Demo mode: click diagnose to see a sample result.</p>}
        </div>
      </Card>

      <Card className="p-6 shadow-[var(--shadow-card)] min-h-[400px]">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
            <Leaf className="h-12 w-12 mb-3 opacity-40" />
            <p>Diagnosis will appear here.</p>
          </div>
        ) : (
          <DiagnosisCard r={result} />
        )}
      </Card>
    </div>
  );
}

function DiagnosisCard({ r }: { r: any }) {
  const sev = r.severity as string;
  const sevColor = sev === "healthy" ? "bg-success/20 text-success" : sev === "mild" ? "bg-warning/30 text-foreground" : sev === "moderate" ? "bg-warning text-foreground" : "bg-destructive/20 text-destructive";
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Diagnosis</div>
        <h3 className="text-2xl font-bold">{r.disease}</h3>
        <div className="text-sm italic text-muted-foreground">{r.scientific_name}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge className={sevColor}>Severity: {sev}</Badge>
        <Badge variant="outline">Urgency: {r.urgency}</Badge>
        <Badge variant="outline">Confidence: {r.confidence}%</Badge>
        <Badge variant="outline">Yield impact: {r.yield_impact_pct}%</Badge>
      </div>
      <div className="rounded-lg bg-success/10 border border-success/30 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-success mb-1"><Leaf className="h-4 w-4" />Organic remedy</div>
        <p className="text-sm">{r.organic_remedy}</p>
      </div>
      <div className="rounded-lg bg-muted/60 border border-border/60 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold mb-1"><AlertTriangle className="h-4 w-4" />Chemical remedy (if severe)</div>
        <p className="text-sm">{r.chemical_remedy}</p>
      </div>
    </div>
  );
}

/* ─────────── HISTORY ─────────── */
function HistoryTab() {
  const { user } = useAuth();
  const { demo } = useDemoMode();
  const [listings, setListings] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);

  useEffect(() => {
    if (demo) {
      setListings(DEMO_FARMER_LISTINGS);
      setScans(DEMO_SCANS);
      return;
    }
    if (!user) return;
    (async () => {
      const { data: l } = await supabase.from("listings").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false });
      setListings(l ?? []);
      const { data: s } = await supabase.from("scans").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false }).limit(10);
      setScans(s ?? []);
    })();
  }, [user, demo]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold mb-3">My listings</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border border-border/60 rounded-lg p-3">
                <div className="h-14 w-14 rounded-md bg-muted overflow-hidden shrink-0">
                  {l.image_urls?.[0] && <img src={l.image_urls[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{l.crop} · {l.quantity_kg}kg</div>
                  <div className="text-xs text-muted-foreground">₹{l.asking_price_per_kg}/kg · {l.status}</div>
                </div>
                {l.ai_quality_grade && <Badge>Grade {l.ai_quality_grade}</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold mb-3">Recent scans</h2>
        {scans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scans yet.</p>
        ) : (
          <div className="space-y-3">
            {scans.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border border-border/60 rounded-lg p-3">
                <div className="h-14 w-14 rounded-md bg-muted overflow-hidden shrink-0">
                  <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.diagnosis?.disease ?? "Diagnosis"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <Badge variant="outline">{s.diagnosis?.severity}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}