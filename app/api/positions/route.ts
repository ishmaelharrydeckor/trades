// app/api/positions/route.ts
// POST: the EA pushes a full snapshot of open positions (secret-protected).
//       We stamp every row with one synced_at, then delete anything older
//       — so closed positions drop out automatically.
// GET:  the dashboard polls this for the live feed.

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface IncomingPosition {
  ticket: string | number;
  symbol: string;
  direction: "BUY" | "SELL";
  volume: number | string;
  open_time: string;
  open_price: number | string;
  current_price: number | string;
  stop_loss?: number | string;
  take_profit?: number | string;
  floating_pnl: number | string;
  swap?: number | string;
}

interface SnapshotBody {
  positions?: IncomingPosition[];
}

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-mt5-secret");
  if (secret !== process.env.MT5_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SnapshotBody;
  try {
    body = (await req.json()) as SnapshotBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const positions = Array.isArray(body.positions) ? body.positions : [];
  const syncedAt = new Date().toISOString();
  const db = getServiceClient();

  // Upsert all current positions with this snapshot's timestamp.
  if (positions.length > 0) {
    const rows = positions.map((p) => ({
      ticket_id: String(p.ticket),
      symbol: p.symbol,
      direction: p.direction,
      lots: num(p.volume) ?? 0,
      open_time: p.open_time,
      open_price: num(p.open_price) ?? 0,
      current_price: num(p.current_price) ?? 0,
      stop_loss: num(p.stop_loss),
      take_profit: num(p.take_profit),
      floating_pnl: num(p.floating_pnl) ?? 0,
      swap: num(p.swap),
      synced_at: syncedAt,
    }));

    const { error: upsertErr } = await db
      .from("open_positions")
      .upsert(rows, { onConflict: "ticket_id" });
    if (upsertErr) {
      return NextResponse.json(
        { error: "upsert_failed", detail: upsertErr.message },
        { status: 500 }
      );
    }
  }

  // Remove anything not in this snapshot (i.e. positions that have closed).
  const { error: delErr } = await db
    .from("open_positions")
    .delete()
    .lt("synced_at", syncedAt);
  if (delErr) {
    return NextResponse.json(
      { error: "cleanup_failed", detail: delErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, count: positions.length });
}

export async function GET() {
  const { data, error } = await supabase
    .from("open_positions")
    .select(
      "ticket_id, symbol, direction, lots, open_time, open_price, current_price, stop_loss, take_profit, floating_pnl, swap, synced_at"
    )
    .order("open_time", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "fetch_failed", detail: error.message, positions: [] },
      { status: 200 } // fail soft so the client just shows empty
    );
  }

  return NextResponse.json({ ok: true, positions: data ?? [] });
}
