import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Trophy, Package, IndianRupee, MapPin, ScanSearch, Trash2, ShoppingCart } from "lucide-react";
import { auditQuality } from "@/server/ai.functions";

export const Route = createFileRoute("/mart")({
  component: MartDashboard,
});

type Listing = {
  id: string; farmer_id: string; crop: string; variety: string | null;
  quantity_kg: number; asking_price_per_kg: number; region: string | null;
  image_urls: string[]; ai_quality_grade: string | null; status: string;
};

function MartDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [farmers, setFarmers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [auditing, setAuditing] = useState(false);
  const [audit, setAudit] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
    if (!loading && user && role && role !== "mart") navigate({ to: "/farmer" });
  }, [user, role, loading, navigate]);

  const load = async () => {
    const { data } = await supabase.from("listings").select("*").eq("status", "available").order("created_at", { ascending: false });
    setListings((data ?? []) as Listing[]);
    const ids = Array.from(new Set((data ?? []).map((l) => l.farmer_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name, region").in("id", ids);
      const map: Record<string, string> = {};
      (ps ?? []).forEach((p) => map[p.id] = p.full_name || "Farmer");
      setFarmers(map);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  if (loading || !user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;

  const toggleSelect = (id: string) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length >= 6 ? s : [...s, id]);
  };

  const selectedListings = listings.filter((l) => selected.includes(l.id));
  const sameCrop = selectedListings.length > 1 && selectedListings.every((l) => l.crop.toLowerCase() === selectedListings[0].crop.toLowerCase());

  const runAudit = async () => {
    if (selectedListings.length < 2) { toast.error("Select at least 2 listings of the same crop"); return; }
    if (!sameCrop) { toast.error("All selected listings must be the same crop"); return; }
    setAuditing(true);
    setAudit(null);
    try {
      const submissions = selectedListings.map((l) => ({
        listingId: l.id,
        farmerName: farmers[l.farmer_id] ?? "Farmer",
        imageUrl: l.image_urls[0],
        askingPricePerKg: Number(l.asking_price_per_kg),
        quantityKg: Number(l.quantity_kg),
        region: l.region ?? "",
      }));
      const r = await auditQuality({ data: { crop: selectedListings[0].crop, submissions } });
      setAudit(r);
      // Persist top grade onto each listing
      for (const item of r.ranking ?? []) {
        await supabase.from("listings").update({
          ai_quality_grade: item.grade,
          ai_quality_score: item.score,
          ai_quality_report: item,
        }).eq("id", item.listing_id);
      }
      await supabase.from("audits").insert({
        mart_id: user!.id,
        crop: selectedListings[0].crop,
        listing_ids: selectedListings.map((l) => l.id),
        ranking: r.ranking,
        recommendation: r.recommendation,
      });
      toast.success("Audit complete and saved.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Audit failed");
    } finally {
      setAuditing(false);
    }
  };

  const addToCart = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("cart_items")
      .upsert({ user_id: user.id, listing_id: id, quantity_kg: 1 }, { onConflict: "user_id,listing_id" });
    if (error) toast.error(error.message);
    else toast.success("Added to cart");
  };

  const buyNow = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold", buyer_id: user!.id, sold_at: new Date().toISOString() })
      .eq("id", id).eq("status", "available");
    if (error) toast.error(error.message);
    else { toast.success("Purchase confirmed!"); setSelected((s) => s.filter((x) => x !== id)); load(); }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mart Procurement</h1>
          <p className="text-muted-foreground mt-1">
            Compare farmer submissions side-by-side. Let AI rank them.
          </p>
        </div>
        <Link to="/marketplace"><Button variant="outline" size="sm">Browse all</Button></Link>
      </div>

      {listings.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No live listings</h3>
          <p className="text-sm text-muted-foreground">Check back soon — farmers list daily.</p>
        </Card>
      ) : (
        <>
          {/* Audit bar */}
          <Card className="p-4 mb-6 sticky top-20 z-30 shadow-[var(--shadow-elegant)] border-primary/30">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-hero)] text-primary-foreground">
                  <ScanSearch className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">AI Quality Auditor</div>
                  <div className="text-xs text-muted-foreground">{selected.length} selected · {selected.length >= 2 ? (sameCrop ? "Ready" : "Select same crop only") : "Pick 2–6 of the same crop"}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {selected.length > 0 && <Button variant="ghost" size="sm" onClick={() => { setSelected([]); setAudit(null); }}><Trash2 className="h-4 w-4 mr-1" />Clear</Button>}
                <Button onClick={runAudit} disabled={auditing || selected.length < 2 || !sameCrop} className="bg-[image:var(--gradient-hero)] hover:opacity-90">
                  {auditing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI is comparing...</> : <><Sparkles className="h-4 w-4 mr-2" />Run AI Audit</>}
                </Button>
              </div>
            </div>
          </Card>

          {audit && <AuditResultPanel audit={audit} listings={listings} farmers={farmers} onBuy={buyNow} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => {
              const isSelected = selected.includes(l.id);
              return (
                <Card key={l.id} onClick={() => toggleSelect(l.id)}
                  className={`overflow-hidden cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary shadow-[var(--shadow-elegant)]" : "hover:shadow-md border-border/60"}`}>
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {l.image_urls[0] ? <img src={l.image_urls[0]} alt={l.crop} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center"><Package className="h-10 w-10 text-muted-foreground" /></div>}
                    {isSelected && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><div className="rounded-full bg-primary text-primary-foreground h-10 w-10 flex items-center justify-center font-bold">{selected.indexOf(l.id) + 1}</div></div>}
                    {l.ai_quality_grade && <div className="absolute top-2 right-2 rounded-full bg-background/95 backdrop-blur px-2.5 py-1 text-xs font-bold shadow"><Sparkles className="h-3 w-3 inline mr-1 text-primary" />Grade {l.ai_quality_grade}</div>}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold">{l.crop}</h3>
                      {l.variety && <Badge variant="secondary">{l.variety}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">by {farmers[l.farmer_id] ?? "Farmer"}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{l.region || "—"}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Package className="h-3.5 w-3.5" />{l.quantity_kg}kg</span>
                    </div>
                    <div className="flex items-end justify-between pt-2 border-t border-border/60">
                      <div className="flex items-center text-xl font-bold text-primary"><IndianRupee className="h-4 w-4" />{l.asking_price_per_kg}<span className="text-xs font-normal text-muted-foreground ml-1">/kg</span></div>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); addToCart(l.id); }} className="bg-[image:var(--gradient-hero)] hover:opacity-90">
                        <ShoppingCart className="h-4 w-4 mr-1" />Add
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function AuditResultPanel({ audit, listings, farmers, onBuy }: {
  audit: any; listings: Listing[]; farmers: Record<string, string>; onBuy: (id: string) => void;
}) {
  const ranked = (audit.ranking ?? []).slice().sort((a: any, b: any) => a.rank - b.rank);
  return (
    <Card className="p-6 mb-6 border-primary/40 shadow-[var(--shadow-elegant)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm"><Trophy className="h-4 w-4" />AI Audit Result</div>
          <p className="text-sm text-muted-foreground mt-1">{audit.recommendation}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ranked.map((r: any) => {
          const l = listings.find((x) => x.id === r.listing_id);
          if (!l) return null;
          const isBest = r.listing_id === audit.best_value_listing_id;
          return (
            <Card key={r.listing_id} className={`overflow-hidden ${isBest ? "ring-2 ring-primary" : ""}`}>
              <div className="aspect-video bg-muted relative">
                {l.image_urls[0] && <img src={l.image_urls[0]} alt="" className="h-full w-full object-cover" />}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-background/95 backdrop-blur px-2.5 py-1 text-xs font-bold">
                  #{r.rank} · Grade {r.grade} · {r.score}/100
                </div>
                {isBest && <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-xs font-bold"><Trophy className="h-3 w-3" />Best value</div>}
              </div>
              <div className="p-4 space-y-2">
                <div className="font-semibold">{l.crop} · {l.quantity_kg}kg</div>
                <div className="text-xs text-muted-foreground">by {farmers[l.farmer_id] ?? "Farmer"} · Asking ₹{l.asking_price_per_kg}/kg · Fair ₹{r.fair_price_per_kg}/kg</div>
                <div className="text-xs">Shelf life: <strong>{r.shelf_life_days} days</strong></div>
                {r.reasons?.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                    {r.reasons.slice(0, 3).map((x: string, i: number) => <li key={i}>{x}</li>)}
                  </ul>
                )}
                {r.defects?.length > 0 && (
                  <div className="text-xs text-destructive">Defects: {r.defects.join(", ")}</div>
                )}
                <Button size="sm" onClick={() => onBuy(l.id)} className="w-full mt-2 bg-[image:var(--gradient-hero)] hover:opacity-90">Buy this lot</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}