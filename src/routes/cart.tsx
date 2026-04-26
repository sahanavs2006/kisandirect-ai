import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Package, IndianRupee, MapPin } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — KrishiMithra" },
      { name: "description", content: "Review the produce lots you've added to your cart and check out." },
    ],
  }),
  component: CartPage,
});

type CartRow = {
  id: string;
  quantity_kg: number;
  created_at: string;
  listing_id: string;
};

type Listing = {
  id: string;
  crop: string;
  variety: string | null;
  quantity_kg: number;
  asking_price_per_kg: number;
  region: string | null;
  image_urls: string[];
  ai_quality_grade: string | null;
  status: string;
  farmer_id: string;
};

function CartPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartRow[]>([]);
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
    if (!loading && user && role && role !== "mart") navigate({ to: "/farmer" });
  }, [user, role, loading, navigate]);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const { data: rows } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const cartRows = (rows ?? []) as CartRow[];
    setItems(cartRows);
    const ids = cartRows.map((c) => c.listing_id);
    if (ids.length) {
      const { data: ls } = await supabase.from("listings").select("*").in("id", ids);
      const map: Record<string, Listing> = {};
      (ls ?? []).forEach((l) => { map[l.id] = l as Listing; });
      setListings(map);
    } else {
      setListings({});
    }
    setBusy(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    toast.success("Removed from cart");
    setItems((cur) => cur.filter((c) => c.id !== id));
  };

  const checkout = async (cart: CartRow) => {
    if (!user) return;
    const l = listings[cart.listing_id];
    if (!l) return;
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold", buyer_id: user.id, sold_at: new Date().toISOString() })
      .eq("id", l.id)
      .eq("status", "available");
    if (error) { toast.error(error.message); return; }
    await supabase.from("cart_items").delete().eq("id", cart.id);
    toast.success(`Purchased ${l.crop}`);
    load();
  };

  if (loading || !user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;

  const total = items.reduce((sum, c) => {
    const l = listings[c.listing_id];
    if (!l) return sum;
    return sum + Number(l.asking_price_per_kg) * Number(l.quantity_kg);
  }, 0);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-end justify-between gap-3 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" /> Your cart
          </h1>
          <p className="text-muted-foreground mt-1">Review the lots you saved before checking out.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Cart total</div>
          <div className="text-2xl font-bold text-primary flex items-center justify-end"><IndianRupee className="h-5 w-5" />{total.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {busy ? (
        <div className="text-center py-20 text-muted-foreground">Loading cart...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mt-1">Browse the marketplace to add lots.</p>
          <Link to="/marketplace"><Button className="mt-4 bg-[image:var(--gradient-hero)]">Browse marketplace</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const l = listings[c.listing_id];
            if (!l) return (
              <Card key={c.id} className="p-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Listing no longer available</div>
                <Button variant="ghost" size="sm" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            );
            const sold = l.status !== "available";
            return (
              <Card key={c.id} className="p-4 flex items-center gap-4 flex-wrap">
                <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden shrink-0">
                  {l.image_urls?.[0] && <img src={l.image_urls[0]} alt={l.crop} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <div className="font-bold">{l.crop}</div>
                    {l.variety && <Badge variant="secondary">{l.variety}</Badge>}
                    {l.ai_quality_grade && <Badge>Grade {l.ai_quality_grade}</Badge>}
                    {sold && <Badge variant="destructive">Sold</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.region || "India"}</span>
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" />{l.quantity_kg}kg</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary flex items-center justify-end"><IndianRupee className="h-4 w-4" />{l.asking_price_per_kg}<span className="text-xs font-normal text-muted-foreground ml-1">/kg</span></div>
                  <div className="text-xs text-muted-foreground">Total ₹{(l.quantity_kg * l.asking_price_per_kg).toLocaleString("en-IN")}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={sold} onClick={() => checkout(c)} className="bg-[image:var(--gradient-hero)] hover:opacity-90">Checkout</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
