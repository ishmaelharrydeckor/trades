// app/api/sync/route.ts
// MetaTrader 5 → Supabase ingestion webhook.
// Accepts: { ticket, time, symbol, direction, volume, pnl, outcome }
// Verifies a shared secret in the `x-mt5-secret` header, normalizes the
// payload, then upserts on ticket_id so retries are idempotent.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "edge";

interface Mt5Payload {
  ticket: string | number;
  time: string;
  symbol: string;
  direction: string;
  volume: number | string;
  pnl: number | string;
  outcome?: string;
}

const INDEX_TICKERS = new Set([
  "NAS100",
  "US30",
  "SPX500",
  "GER40",
  "UK100",
  "JPN225",
  "AUS200",
  "HK50",
]);

function classify(symbol: string): "FOREX" | "INDICES" {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (INDEX_TICKERS.has(s)) return "INDICES";
  if (/^XAU|^XAG/.test(s)) return "INDICES"; // metals tracked alongside indices
  return "FOREX";
}

function normalizeTicker(symbol: string): string {
  const s = symbol.toUpperCase();
  // Major forex pairs: "EURUSD" → "EUR/USD". Leave indices untouched.
  if (/^[A-Z]{6}$/.test(s)) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  return s;
}

function normalizeDirection(d: string): "BUY" | "SELL" {
  return d.toUpperCase() === "SELL" ? "SELL" : "BUY";
}

function deriveOutcome(pnl: number, outcome?: string): "WIN" | "LOSS" {
  if (outcome) {
    const v = outcome.toUpperCase();
    if (v === "WIN" || v === "LOSS") return v;
  }
  return pnl >= 0 ? "WIN" : "LOSS";
}

export async function POST(req: Request) {
  const expected = process.env.MT5_WEBHOOK_SECRET;
  if (expected) {
    const provided = req.headers.get("x-mt5-secret");
    if (provided !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: Mt5Payload;
  try {
    body = (await req.json()) as Mt5Payload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const ticket = String(body.ticket ?? "").trim();
  const symbol = String(body.symbol ?? "").trim();
  const time = String(body.time ?? "").trim();
  if (!ticket || !symbol || !time) {
    return NextResponse.json(
      { error: "missing required fields: ticket, symbol, time" },
      { status: 400 }
    );
  }

  const pnl = Number(body.pnl);
  const volume = Number(body.volume);
  if (!Number.isFinite(pnl) || !Number.isFinite(volume)) {
    return NextResponse.json(
      { error: "pnl and volume must be numeric" },
      { status: 400 }
    );
  }

  const row = {
    ticket_id: ticket,
    close_time: new Date(time).toISOString(),
    asset_class: classify(symbol),
    ticker: normalizeTicker(symbol),
    direction: normalizeDirection(String(body.direction ?? "BUY")),
    lots: volume,
    net_pnl: pnl,
    outcome: deriveOutcome(pnl, body.outcome),
  };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("trades")
    .upsert(row, { onConflict: "ticket_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ticket_id: row.ticket_id });
}

export async function GET() {
  return NextResponse.json({ status: "MT5 sync endpoint ready" });
}
