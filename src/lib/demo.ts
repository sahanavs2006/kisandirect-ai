import { useEffect, useState } from "react";

const KEY = "kisandirect:demo";

export function isDemoEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setDemoEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(KEY, "1");
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("kisandirect:demo-changed"));
}

export function useDemoMode() {
  // Always start as `false` on the client's first render so it matches the
  // SSR output and avoids React hydration mismatches. The real value is read
  // from localStorage in an effect (after hydration) and then kept in sync.
  const [demo, setDemo] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setDemo(isDemoEnabled());
    setHydrated(true);
    const onChange = () => setDemo(isDemoEnabled());
    window.addEventListener("kisandirect:demo-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("kisandirect:demo-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return {
    demo,
    hydrated,
    enable: () => setDemoEnabled(true),
    disable: () => setDemoEnabled(false),
    reset: () => setDemoEnabled(false),
    toggle: () => setDemoEnabled(!isDemoEnabled()),
  };
}

/* Sample diseased leaf used by the demo "Load sample image" action */
export const DEMO_SAMPLE_LEAF_URL =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1024&q=70";

/* ──────────────────── SAMPLE DATA ──────────────────── */

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=800&q=70`;

export type DemoListing = {
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

export const DEMO_FARMERS: Record<string, string> = {
  "demo-f-1": "Ramesh Patil",
  "demo-f-2": "Sunita Devi",
  "demo-f-3": "Arjun Reddy",
  "demo-f-4": "Lakshmi Iyer",
  "demo-f-5": "Vikram Singh",
  "demo-f-6": "Meena Kumari",
};

export const DEMO_LISTINGS: DemoListing[] = [
  {
    id: "demo-l-1",
    farmer_id: "demo-f-1",
    crop: "Tomato",
    variety: "Roma",
    quantity_kg: 480,
    asking_price_per_kg: 18,
    region: "Nashik, Maharashtra",
    image_urls: [img("photo-1592924357228-91a4daadcfea?")],
    ai_quality_grade: "A",
    ai_quality_score: 92,
    status: "available",
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "demo-l-2",
    farmer_id: "demo-f-2",
    crop: "Tomato",
    variety: "Hybrid",
    quantity_kg: 320,
    asking_price_per_kg: 16,
    region: "Kolar, Karnataka",
    image_urls: [img("photo-1546470427-e26264be0b0d?")],
    ai_quality_grade: "B",
    ai_quality_score: 78,
    status: "available",
    created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    id: "demo-l-3",
    farmer_id: "demo-f-3",
    crop: "Onion",
    variety: "Red",
    quantity_kg: 1200,
    asking_price_per_kg: 28,
    region: "Nashik, Maharashtra",
    image_urls: [img("photo-1518977956812-cd3dbadaaf31?")],
    ai_quality_grade: "A",
    ai_quality_score: 88,
    status: "available",
    created_at: new Date(Date.now() - 1 * 3600_000).toISOString(),
  },
  {
    id: "demo-l-4",
    farmer_id: "demo-f-4",
    crop: "Potato",
    variety: "Kufri Jyoti",
    quantity_kg: 800,
    asking_price_per_kg: 14,
    region: "Agra, Uttar Pradesh",
    image_urls: [img("photo-1518977676601-b53f82aba655?")],
    ai_quality_grade: "A",
    ai_quality_score: 90,
    status: "available",
    created_at: new Date(Date.now() - 8 * 3600_000).toISOString(),
  },
  {
    id: "demo-l-5",
    farmer_id: "demo-f-5",
    crop: "Mango",
    variety: "Alphonso",
    quantity_kg: 250,
    asking_price_per_kg: 220,
    region: "Ratnagiri, Maharashtra",
    image_urls: [img("photo-1605027990121-cbae9e0642db?")],
    ai_quality_grade: "A",
    ai_quality_score: 95,
    status: "available",
    created_at: new Date(Date.now() - 12 * 3600_000).toISOString(),
  },
  {
    id: "demo-l-6",
    farmer_id: "demo-f-6",
    crop: "Onion",
    variety: "White",
    quantity_kg: 600,
    asking_price_per_kg: 24,
    region: "Pune, Maharashtra",
    image_urls: [img("photo-1620574387735-3624d75b2dbc?")],
    ai_quality_grade: "B",
    ai_quality_score: 74,
    status: "available",
    created_at: new Date(Date.now() - 18 * 3600_000).toISOString(),
  },
];

export const DEMO_FORECAST = {
  recommendation: "HOLD_1_WEEK" as const,
  confidence: 82,
  action_summary:
    "Heavy unseasonal rain in Nashik will tighten supply over the next 7–10 days. Holding for a week should add ~₹6/kg. Sell before day 12 to avoid post-rain glut.",
  predicted_price_7d: 34,
  predicted_price_14d: 31,
  price_change_pct_14d: 10.7,
  estimated_extra_income_inr: 3000,
  drivers: [
    {
      factor: "Weather shock",
      detail: "Forecasted 80mm rainfall in Nashik will damage 12–15% of standing crop.",
      impact: "positive",
    },
    {
      factor: "Mandi arrivals",
      detail: "Lasalgaon arrivals down 18% week-on-week — supply already tight.",
      impact: "positive",
    },
    {
      factor: "Festival demand",
      detail: "Pre-festival pull from urban retail is elevating wholesale rates.",
      impact: "positive",
    },
    {
      factor: "Imports",
      detail: "No major import lots reported — domestic prices uncontested.",
      impact: "neutral",
    },
  ],
  risk_note:
    "If rainfall is lower than forecast, prices may correct by ~₹3/kg by day 14. Don't hold beyond 2 weeks.",
};

export const DEMO_DIAGNOSIS = {
  disease: "Early Blight",
  scientific_name: "Alternaria solani",
  severity: "moderate",
  urgency: "treat within 48 hours",
  confidence: 87,
  yield_impact_pct: 22,
  organic_remedy:
    "Spray neem oil (3%) mixed with 5g baking soda per litre, every 5 days. Remove and burn affected leaves. Improve airflow by pruning lower foliage.",
  chemical_remedy:
    "Apply Mancozeb 75% WP @ 2g/L or Chlorothalonil 75% WP @ 2g/L. Repeat after 10 days. Observe 7-day pre-harvest interval.",
};

export const DEMO_AUDIT = {
  ranking: [
    {
      listing_id: "demo-l-1",
      rank: 1,
      grade: "A",
      score: 92,
      fair_price_per_kg: 19,
      shelf_life_days: 8,
      reasons: [
        "Uniform deep-red colour, minimal blemishes",
        "Firm fruit with intact stems",
        "Asking price below fair value",
      ],
      defects: [],
    },
    {
      listing_id: "demo-l-2",
      rank: 2,
      grade: "B",
      score: 78,
      fair_price_per_kg: 15,
      shelf_life_days: 5,
      reasons: [
        "Mixed ripeness across the lot",
        "Some surface bruising visible",
      ],
      defects: ["minor bruising", "uneven ripening"],
    },
  ],
  recommendation:
    "Lot #1 (Ramesh Patil) is the best value — pay the asking ₹18/kg for 480kg. It scores 92/100 with 8-day shelf life. Skip Lot #2 unless you need volume; bruising will cost you 15% in retail shrinkage.",
  best_value_listing_id: "demo-l-1",
};

export const DEMO_FARMER_LISTINGS = [DEMO_LISTINGS[0], DEMO_LISTINGS[2]];

export const DEMO_SCANS = [
  {
    id: "demo-s-1",
    farmer_id: "demo-f-1",
    image_url: img("photo-1416879595882-3373a0480b5b?"),
    diagnosis: DEMO_DIAGNOSIS,
    created_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
  {
    id: "demo-s-2",
    farmer_id: "demo-f-1",
    image_url: img("photo-1530836369250-ef72a3f5cda8?"),
    diagnosis: {
      disease: "Healthy",
      scientific_name: "—",
      severity: "healthy",
      urgency: "none",
      confidence: 96,
      yield_impact_pct: 0,
      organic_remedy: "Maintain current practice. Continue weekly neem foliar spray.",
      chemical_remedy: "Not required.",
    },
    created_at: new Date(Date.now() - 72 * 3600_000).toISOString(),
  },
];