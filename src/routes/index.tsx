import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, ScanLine, Store, Sparkles, ShieldCheck, Leaf } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-10" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-6">
              <Sparkles className="h-3 w-3" /> Powered by Google Gemini · Built for Solution Challenge 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              From Farm to Mart,
              <br />
              <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">powered by AI.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              KrishiMithra predicts crop prices, audits produce quality with computer vision, and connects Indian farmers <strong>directly</strong> to retail giants like D-Mart and Vishal Mega Mart — eliminating the middleman.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="bg-[image:var(--gradient-hero)] hover:opacity-90 shadow-[var(--shadow-elegant)]">
                  Get started free
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="ghost">Browse marketplace</Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl">
              <Stat value="₹1L Cr" label="Annual crop loss in India" />
              <Stat value="40%" label="Margin lost to middlemen" />
              <Stat value="<3s" label="AI quality verdict" />
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three pillars. One ecosystem.</h2>
          <p className="mt-3 text-muted-foreground">Predict, Inspect, Connect — every part of the harvest cycle, AI-augmented.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Pillar
            icon={<TrendingUp className="h-6 w-6" />}
            title="Predictive Oracle"
            desc="Gemini reasons over weather, supply, and Mandi history to tell farmers exactly when to sell."
            tag="Price Forecasting"
          />
          <Pillar
            icon={<ScanLine className="h-6 w-6" />}
            title="AI Quality Auditor"
            desc="Mart managers compare farmer photos side-by-side. Gemini Vision ranks them A/B/C with shelf life and defects."
            tag="Computer Vision"
          />
          <Pillar
            icon={<Store className="h-6 w-6" />}
            title="Direct B2B Marketplace"
            desc="Farmers list. Marts buy in one click. Transparent prices, AI-verified quality, zero intermediaries."
            tag="Marketplace"
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/40 border-y border-border/60">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <Card className="p-8 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-primary font-semibold mb-3">
                <Leaf className="h-5 w-5" /> For Farmers
              </div>
              <ol className="space-y-4">
                {[
                  ["Sign up", "Create a farmer account in seconds — phone & name only."],
                  ["Predict the price", "Tell us your crop, region, and current Mandi rate. AI gives a 14-day forecast."],
                  ["List your produce", "Snap a photo of your harvest. AI grades it A/B/C automatically."],
                  ["Get paid directly", "D-Mart, Vishal, Reliance Fresh buy from you — no middleman cut."],
                ].map(([t, d], i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">{i + 1}</span>
                    <div>
                      <div className="font-semibold">{t}</div>
                      <div className="text-sm text-muted-foreground">{d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-8 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-accent-foreground font-semibold mb-3">
                <ShieldCheck className="h-5 w-5" /> For Marts (D-Mart, Vishal &c.)
              </div>
              <ol className="space-y-4">
                {[
                  ["Sign up as Mart", "Verified procurement accounts."],
                  ["Browse listings", "See live farmer harvests with AI quality scores."],
                  ["Run AI audit", "Compare 2–6 listings side-by-side. Gemini ranks them objectively."],
                  ["Buy in one click", "Lock in the best lot. Save 15–30% vs Mandi procurement."],
                ].map(([t, d], i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-sm">{i + 1}</span>
                    <div>
                      <div className="font-semibold">{t}</div>
                      <div className="text-sm text-muted-foreground">{d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </section>

      {/* SDG */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-2xl md:text-3xl font-bold">Aligned with UN Sustainable Development Goals</h3>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">SDG 2 — Zero Hunger · SDG 8 — Decent Work & Economic Growth · SDG 9 — Innovation</p>
        <div className="mt-8">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="bg-[image:var(--gradient-hero)] hover:opacity-90 shadow-[var(--shadow-elegant)]">
              Join KrishiMithra
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold text-primary">{value}</div>
      <div className="text-xs md:text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Pillar({ icon, title, desc, tag }: { icon: React.ReactNode; title: string; desc: string; tag: string }) {
  return (
    <Card className="p-6 hover:shadow-[var(--shadow-elegant)] transition-shadow border-border/60">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-elegant)] mb-4">
        {icon}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{tag}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}
