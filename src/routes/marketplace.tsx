import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, MapPin, Package, IndianRupee, Sparkles, Filter, X } from "lucide-react";
import { useDemoMode, DEMO_LISTINGS, DEMO_FARMERS } from "@/lib/demo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — KisanDirect AI" },
      { name: "description", content: "Browse AI-verified farm produce and buy directly from Indian farmers." },
    ],
  }),
  component: Marketplace,
});

type Listing = {
  id: string;
  farmer_id: string;
  crop: string;
  variety: string | null;
  quantity_kg: number;
  asking_price_per_kg: number;
  region: string | null;
  image_urls: string[];
  ai_quality_grade: string | null;
  ai_quality_score: number | null;
  status: string;
  created_at: string;
};

function Marketplace() {
  const { user, role } = useAuth();
  const { demo } = useDemoMode();
  const [listings, setListings] = useState<Listing[]>([]);
  const [farmers, setFarmers] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [priceBand, setPriceBand] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    if (demo) {
      setListings(DEMO_LISTINGS as Listing[]);
      setFarmers(DEMO_FARMERS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setListings(data as Listing[]);
    const farmerIds = Array.from(new Set((data ?? []).map((l) => l.farmer_id)));
    if (farmerIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", farmerIds);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p) => { map[p.id] = p.full_name || "Farmer"; });
      setFarmers(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [demo]);

  const buy = async (id: string) => {
    if (demo) {
      toast.success("Demo purchase confirmed!");
      setListings((ls) => ls.filter((l) => l.id !== id));
      return;
    }
    if (!user) { toast.error("Sign in as a Mart to buy"); return; }
    if (role !== "mart") { toast.error("Only Mart accounts can purchase"); return; }
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold", buyer_id: user.id, sold_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "available");
    if (error) toast.error(error.message);
    else { toast.success("Purchase confirmed!"); load(); }
  };

  const cropOptions = Array.from(new Set(listings.map((l) => l.crop))).sort();
  const regionOptions = Array.from(
    new Set(listings.map((l) => (l.region ?? "").trim()).filter(Boolean))
  ).sort();

  const inBand = (price: number) => {
    switch (priceBand) {
      case "under20": return price < 20;
      case "20to50": return price >= 20 && price <= 50;
      case "50to100": return price > 50 && price <= 100;
      case "over100": return price > 100;
      default: return true;
    }
  };

  const filtered = listings.filter((l) => {
    const s = q.trim().toLowerCase();
    if (s && !(l.crop.toLowerCase().includes(s) || (l.region ?? "").toLowerCase().includes(s))) return false;
    if (cropFilter !== "all" && l.crop !== cropFilter) return false;
    if (regionFilter !== "all" && (l.region ?? "") !== regionFilter) return false;
    if (!inBand(Number(l.asking_price_per_kg))) return false;
    return true;
  });

  const hasActiveFilter = cropFilter !== "all" || regionFilter !== "all" || priceBand !== "all" || q.length > 0;
  const clearFilters = () => { setCropFilter("all"); setRegionFilter("all"); setPriceBand("all"); setQ(""); };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            AI-verified farm produce, ready to ship.
            {demo && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Sparkles className="h-3 w-3" />Showing demo data</span>}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search crop or region..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <Select value={cropFilter} onValueChange={setCropFilter}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Crop" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All crops</SelectItem>
            {cropOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {regionOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priceBand} onValueChange={setPriceBand}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Price ₹/kg" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any price</SelectItem>
            <SelectItem value="under20">Under ₹20</SelectItem>
            <SelectItem value="20to50">₹20 – ₹50</SelectItem>
            <SelectItem value="50to100">₹50 – ₹100</SelectItem>
            <SelectItem value="over100">Over ₹100</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {listings.length} listings</div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading listings...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No listings yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Be the first farmer to list — sign up and create a listing.</p>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button className="mt-4 bg-[image:var(--gradient-hero)]">Get started</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l) => (
            <ListingCard key={l.id} l={l} farmer={farmers[l.farmer_id] ?? "Farmer"} onBuy={() => buy(l.id)} canBuy={demo || role === "mart"} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ListingCard({ l, farmer, onBuy, canBuy }: { l: Listing; farmer: string; onBuy?: () => void; canBuy?: boolean }) {
  const total = l.quantity_kg * l.asking_price_per_kg;
  return (
    <Card className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all border-border/60">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {l.image_urls[0] ? (
          <img src={l.image_urls[0]} alt={l.crop} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground"><Package className="h-10 w-10" /></div>
        )}
        {l.ai_quality_grade && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background/95 backdrop-blur px-3 py-1.5 text-xs font-bold shadow-md">
            <Sparkles className="h-3 w-3 text-primary" />
            Grade {l.ai_quality_grade}
            {l.ai_quality_score != null && <span className="text-muted-foreground">· {l.ai_quality_score}</span>}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold">{l.crop}</h3>
            {l.variety && <Badge variant="secondary">{l.variety}</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">by {farmer}</div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{l.region || "India"}</div>
          <div className="flex items-center gap-1 text-muted-foreground"><Package className="h-3.5 w-3.5" />{l.quantity_kg} kg</div>
        </div>
        <div className="flex items-end justify-between pt-2 border-t border-border/60">
          <div>
            <div className="flex items-center text-2xl font-bold text-primary"><IndianRupee className="h-5 w-5" />{l.asking_price_per_kg}<span className="text-sm font-normal text-muted-foreground ml-1">/kg</span></div>
            <div className="text-xs text-muted-foreground">Total ₹{total.toLocaleString("en-IN")}</div>
          </div>
          {onBuy && (
            <Button size="sm" disabled={!canBuy} onClick={onBuy} className="bg-[image:var(--gradient-hero)] hover:opacity-90">
              {canBuy ? "Buy now" : "Mart only"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}