import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL_TEXT = "google/gemini-3-flash-preview";
const MODEL_VISION = "google/gemini-3-flash-preview";

function getKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing — Lovable AI not configured");
  return key;
}

async function callAI(body: Record<string, unknown>) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Rate limit exceeded. Please wait a moment and try again.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to your Lovable workspace.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

function extractToolArgs(data: any) {
  const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) {
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      try { return JSON.parse(content); } catch { /* ignore */ }
    }
    throw new Error("AI did not return structured output");
  }
  return JSON.parse(tc.function.arguments);
}

/* ============================================================
   1. PRICE PREDICTION (Gemma-style reasoning via Gemini)
   ============================================================ */
export const predictPrice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      crop: z.string().min(1).max(80),
      region: z.string().min(1).max(80),
      currentPricePerKg: z.number().nonnegative().max(100000),
      weather: z.string().max(200).optional().default("Normal"),
      quantityKg: z.number().nonnegative().max(1000000).optional().default(0),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const system = `You are a senior agricultural market analyst for Indian Mandis (APMC).
You reason carefully about supply, demand, weather, festival cycles, fuel costs, and historical seasonality.
Always return realistic ₹/kg prices for the Indian market. Be decisive but honest about confidence.`;

    const user = `Crop: ${data.crop}
Region: ${data.region}, India
Current Mandi price: ₹${data.currentPricePerKg}/kg
Local weather: ${data.weather}
Farmer's stock: ${data.quantityKg} kg

Forecast prices for the next 7 days and 14 days. Recommend whether the farmer should SELL_NOW, HOLD_1_WEEK, or HOLD_2_WEEKS.
Justify with 3 concrete drivers (weather impact, supply trend, demand trend).
Estimate the financial impact in ₹ for the farmer's stock.`;

    const tools = [{
      type: "function",
      function: {
        name: "submit_forecast",
        description: "Return a structured price forecast",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            recommendation: { type: "string", enum: ["SELL_NOW", "HOLD_1_WEEK", "HOLD_2_WEEKS"] },
            confidence: { type: "number", description: "0-100" },
            predicted_price_7d: { type: "number", description: "₹/kg in 7 days" },
            predicted_price_14d: { type: "number", description: "₹/kg in 14 days" },
            price_change_pct_14d: { type: "number" },
            estimated_extra_income_inr: { type: "number", description: "Extra ₹ vs selling now, can be negative" },
            drivers: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  factor: { type: "string" },
                  impact: { type: "string", enum: ["positive", "negative", "neutral"] },
                  detail: { type: "string" },
                },
                required: ["factor", "impact", "detail"],
              },
            },
            action_summary: { type: "string", description: "One-sentence action for the farmer" },
            risk_note: { type: "string" },
          },
          required: [
            "recommendation","confidence","predicted_price_7d","predicted_price_14d",
            "price_change_pct_14d","estimated_extra_income_inr","drivers","action_summary","risk_note"
          ],
        },
      },
    }];

    const out = await callAI({
      model: MODEL_TEXT,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "submit_forecast" } },
    });

    return extractToolArgs(out);
  });

/* ============================================================
   2. DISEASE SCAN (single image)
   ============================================================ */
export const scanDisease = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      imageUrl: z.string().url().max(2000),
      cropHint: z.string().max(80).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const tools = [{
      type: "function",
      function: {
        name: "submit_diagnosis",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            crop: { type: "string" },
            disease: { type: "string" },
            scientific_name: { type: "string" },
            severity: { type: "string", enum: ["healthy", "mild", "moderate", "severe"] },
            urgency: { type: "string", enum: ["low", "medium", "high"] },
            organic_remedy: { type: "string" },
            chemical_remedy: { type: "string" },
            yield_impact_pct: { type: "number" },
            confidence: { type: "number" },
          },
          required: ["crop","disease","scientific_name","severity","urgency","organic_remedy","chemical_remedy","yield_impact_pct","confidence"],
        },
      },
    }];

    const out = await callAI({
      model: MODEL_VISION,
      messages: [
        { role: "system", content: "You are an expert Indian plant pathologist. Identify the disease from the photo and recommend low-cost organic and chemical treatments. If the plant is healthy, say so." },
        {
          role: "user",
          content: [
            { type: "text", text: `Diagnose this${data.cropHint ? ` ${data.cropHint}` : ""} crop. Be specific about the disease and provide actionable Indian-context remedies.` },
            { type: "image_url", image_url: { url: data.imageUrl } },
          ],
        },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "submit_diagnosis" } },
    });

    return extractToolArgs(out);
  });

/* ============================================================
   3. QUALITY AUDIT — multi-listing comparison
   ============================================================ */
export const auditQuality = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      crop: z.string().min(1).max(80),
      submissions: z.array(z.object({
        listingId: z.string().uuid(),
        farmerName: z.string().max(120),
        imageUrl: z.string().url().max(2000),
        askingPricePerKg: z.number().nonnegative(),
        quantityKg: z.number().nonnegative(),
        region: z.string().max(80).optional().default(""),
      })).min(1).max(6),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const submissionsText = data.submissions
      .map((s, i) => `Submission ${i + 1} (id=${s.listingId}): Farmer ${s.farmerName} from ${s.region}, ${s.quantityKg}kg at ₹${s.askingPricePerKg}/kg`)
      .join("\n");

    const userContent: any[] = [
      {
        type: "text",
        text: `You are a Quality Control Inspector for D-Mart / Vishal Mega Mart procurement.
Crop: ${data.crop}

${submissionsText}

Evaluate each submission on:
- Color & ripeness uniformity
- Size consistency
- Visible defects (bruises, fungal spots, pest damage)
- Estimated shelf life (days)
- Retail grade (A/B/C)

Then RANK them best to worst, score each 0-100, and recommend which submission(s) the mart should buy considering BOTH quality AND price/value.`,
      },
    ];
    data.submissions.forEach((s) => {
      userContent.push({ type: "image_url", image_url: { url: s.imageUrl } });
    });

    const tools = [{
      type: "function",
      function: {
        name: "submit_audit",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            ranking: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  listing_id: { type: "string" },
                  rank: { type: "number" },
                  grade: { type: "string", enum: ["A", "B", "C"] },
                  score: { type: "number" },
                  shelf_life_days: { type: "number" },
                  fair_price_per_kg: { type: "number" },
                  reasons: { type: "array", items: { type: "string" } },
                  defects: { type: "array", items: { type: "string" } },
                },
                required: ["listing_id","rank","grade","score","shelf_life_days","fair_price_per_kg","reasons","defects"],
              },
            },
            recommendation: { type: "string" },
            best_value_listing_id: { type: "string" },
          },
          required: ["ranking", "recommendation", "best_value_listing_id"],
        },
      },
    }];

    const out = await callAI({
      model: MODEL_VISION,
      messages: [
        { role: "system", content: "You are an objective produce quality auditor. You will be shown multiple farmer submissions of the same crop and must rank them fairly." },
        { role: "user", content: userContent },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "submit_audit" } },
    });

    return extractToolArgs(out);
  });