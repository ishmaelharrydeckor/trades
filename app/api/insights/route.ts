// app/api/insights/route.ts
// GET  — return the most recent stored insight.
// POST — generate fresh insights via Google Gemini and store them.
//
// Cost guard:
//   - Default model gemini-2.5-flash (free tier: 250 RPD)
//     Override with GEMINI_MODEL env var (e.g. gemini-2.5-flash-lite for
//     1000 RPD if you generate frequently).
//   - Caps maxOutputTokens at 1024
//   - Refuses to regenerate within REGEN_COOLDOWN_MIN of the last insight
//     unless force=true (60-second floor still applies).

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";
import { buildInsightStats } from "@/lib/insights";
import type { AccountTransaction, Trade } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 2048;
const REGEN_COOLDOWN_MIN = 30;
const FORCE_FLOOR_SEC = 60;

const SYSTEM_PROMPT = `You are a precise, candid trading coach reviewing aggregate statistics from a trader's journal. Produce specific, data-driven observations — not generic advice.

Rules:
- Reference exact numbers from the stats (e.g. "Wednesdays at -$45.20 over 8 trades").
- Each observation must be actionable and specific to this data.
- Acknowledge limited sample sizes when the data is thin.
- Never invent facts that are not in the input.
- Be direct. No throat-clearing.

Return ONLY a JSON object matching this exact schema:
{
  "summary": "<one sentence overall verdict, 20-30 words>",
  "observations": [
    {
      "title": "<short label, 5-9 words>",
      "detail": "<one or two sentences citing specific numbers>",
      "sentiment": "positive" | "negative" | "neutral",
      "category": "discipline" | "edge" | "risk" | "timing" | "psychology"
    }
  ]
}

Produce 3 to 5 observations. No markdown. No commentary outside the JSON.`;

// Gemini's responseSchema constrains the output. Using OBJECT/ARRAY/STRING per
// the OpenAPI 3.0 subset that Gemini supports.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    observations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
          sentiment: {
            type: "STRING",
            enum: ["positive", "negative", "neutral"],
          },
          category: {
            type: "STRING",
            enum: ["discipline", "edge", "risk", "timing", "psychology"],
          },
        },
        required: ["title", "detail", "sentiment", "category"],
      },
    },
  },
  required: ["summary", "observations"],
};

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { code?: number; message?: string; status?: string };
}

export async function GET() {
  const { data, error } = await supabase
    .from("ai_insights")
    .select(
      "id, generated_at, period_label, summary, observations, stats_snapshot, model, input_tokens, output_tokens"
    )
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "fetch_failed", detail: error.message, insight: null },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, insight: data ?? null });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "missing_api_key",
        detail:
          "GEMINI_API_KEY is not set in Vercel environment variables. Get a free key at aistudio.google.com/app/apikey, then add it under Vercel Project Settings → Environment Variables.",
      },
      { status: 503 }
    );
  }

  let body: { force?: boolean } = {};
  try {
    body = (await req.json()) as { force?: boolean };
  } catch {
    // empty body is fine
  }

  const db = getServiceClient();

  // Cooldown check
  const cooldownMs =
    (body.force ? FORCE_FLOOR_SEC : REGEN_COOLDOWN_MIN * 60) * 1000;
  const { data: latest } = await db
    .from("ai_insights")
    .select("generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.generated_at) {
    const ageMs = Date.now() - new Date(latest.generated_at).getTime();
    if (ageMs < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - ageMs) / 1000);
      return NextResponse.json(
        {
          error: "cooldown",
          detail: `Wait ${waitSec}s before regenerating. Use force=true to bypass (60s floor still applies).`,
          retry_after_seconds: waitSec,
        },
        { status: 429 }
      );
    }
  }

  // Pull current trades + transactions and build the stats snapshot
  const [tradesRes, txRes] = await Promise.all([
    db
      .from("trades")
      .select(
        "ticket_id, close_time, asset_class, ticker, direction, lots, net_pnl, outcome, open_time, entry_price, stop_loss, take_profit, commission, swap, r_multiple, risk_amount, tags, notes, mindset"
      )
      .order("close_time", { ascending: false }),
    db
      .from("account_transactions")
      .select("id, occurred_at, kind, amount, note, created_at")
      .order("occurred_at", { ascending: true }),
  ]);

  if (tradesRes.error) {
    return NextResponse.json(
      { error: "trades_fetch_failed", detail: tradesRes.error.message },
      { status: 500 }
    );
  }

  const trades = (tradesRes.data ?? []) as Trade[];
  const transactions = (txRes.data ?? []) as AccountTransaction[];

  if (trades.length === 0) {
    return NextResponse.json(
      {
        error: "no_data",
        detail:
          "No trades on record yet. Close a few trades, then come back to generate insights.",
      },
      { status: 400 }
    );
  }

  const stats = buildInsightStats(trades, transactions);
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Build Gemini request
  const userPrompt =
    "Here are the trader's aggregate statistics as JSON:\n\n" +
    JSON.stringify(stats, null, 2) +
    "\n\nProduce the JSON object as specified.";

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let geminiJson: GeminiResponse;
  try {
    const r = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
    geminiJson = (await r.json()) as GeminiResponse;
    if (!r.ok) {
      return NextResponse.json(
        {
          error: "gemini_error",
          detail: geminiJson?.error?.message ?? `HTTP ${r.status}`,
        },
        { status: 502 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: "gemini_fetch_failed",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }

  // Extract the JSON from the first candidate
  const raw =
    geminiJson.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";

  if (!raw) {
    return NextResponse.json(
      {
        error: "empty_response",
        detail: "Gemini returned no content.",
        finish: geminiJson.candidates?.[0]?.finishReason,
      },
      { status: 502 }
    );
  }

  // responseMimeType: "application/json" should give us clean JSON,
  // but strip code fences defensively in case anything wraps it.
  let clean = raw.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();

  // If the model added prose around the JSON, try slicing from the first '{'
  // to the last '}'. This rescues responses that aren't fully constrained.
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace > 0 || (firstBrace === 0 && lastBrace < clean.length - 1)) {
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }
  }

  const finishReason = geminiJson.candidates?.[0]?.finishReason;

  let parsed: { summary?: string; observations?: unknown[] };
  try {
    parsed = JSON.parse(clean) as typeof parsed;
  } catch {
    const hint =
      finishReason === "MAX_TOKENS"
        ? " Model hit the output token cap — JSON was truncated. Try regenerating."
        : "";
    return NextResponse.json(
      {
        error: "parse_failed",
        detail: `Model did not return valid JSON.${hint}`,
        finish_reason: finishReason,
        raw_preview: raw.slice(0, 400),
      },
      { status: 502 }
    );
  }

  if (
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.observations) ||
    parsed.observations.length === 0
  ) {
    return NextResponse.json(
      { error: "schema_invalid", detail: "Response missing required fields." },
      { status: 502 }
    );
  }

  const inputTokens = geminiJson.usageMetadata?.promptTokenCount ?? null;
  const outputTokens = geminiJson.usageMetadata?.candidatesTokenCount ?? null;

  // Store the insight
  const { data: inserted, error: insertErr } = await db
    .from("ai_insights")
    .insert({
      period_label: stats.period_label,
      summary: parsed.summary,
      observations: parsed.observations,
      stats_snapshot: stats,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    })
    .select(
      "id, generated_at, period_label, summary, observations, stats_snapshot, model, input_tokens, output_tokens"
    )
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: "insert_failed", detail: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, insight: inserted });
}
