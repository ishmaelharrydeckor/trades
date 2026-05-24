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

  // Optional — for duration, R-multiple, and cost analytics
  open_time?: string;
  entry_price?: number | string;
  stop_loss?: number | string;
  take_profit?: number | string;
  commission?: number | string;
  swap?: number | string;
  r_multiple?: number | string;
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
  "FRA40",
  "EUSTX50",
]);

const COMMODITY_TICKERS = new Set([
  "GOLD",
  "SILVER",
  "COPPER",
  "PLATINUM",
  "PALLADIUM",
  "USOIL",
  "UKOIL",
  "BRENT",
  "WTI",
  "NGAS",
]);

function classify(symbol: string): "FOREX" | "INDICES" | "COMMODITIES" {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (INDEX_TICKERS.has(s)) return "INDICES";
  if (COMMODITY_TICKERS.has(s)) return "COMMODITIES";
  if (/^XAU|^XAG|^XPT|^XPD/.test(s)) return "COMMODITIES"; // precious metals
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

function deriveOutcome(
  pnl: number,
  outcome?: string
): "WIN" | "LOSS" | "BREAKEVEN" {
  if (outcome) {
    const v = outcome.toUpperCase();
    if (v === "WIN" || v === "LOSS" || v === "BREAKEVEN") return v;
  }
  // Auto-derive from P&L: exactly-zero closes go to BREAKEVEN.
  if (pnl > 0) return "WIN";
  if (pnl < 0) return "LOSS";
  return "BREAKEVEN";
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

  // Helper: turn optional string|number|undefined into number | null
  const optNum = (v: unknown): number | null => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const openTimeIso =
    body.open_time && String(body.open_time).trim() !== ""
      ? new Date(String(body.open_time)).toISOString()
      : null;

  const row = {
    ticket_id: ticket,
    close_time: new Date(time).toISOString(),
    asset_class: classify(symbol),
    ticker: normalizeTicker(symbol),
    direction: normalizeDirection(String(body.direction ?? "BUY")),
    lots: volume,
    net_pnl: pnl,
    outcome: deriveOutcome(pnl, body.outcome),
    // optional analytics fields — null if MT5 didn't send them
    open_time: openTimeIso,
    entry_price: optNum(body.entry_price),
    stop_loss: optNum(body.stop_loss),
    take_profit: optNum(body.take_profit),
    commission: optNum(body.commission),
    swap: optNum(body.swap),
    r_multiple: optNum(body.r_multiple),
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
