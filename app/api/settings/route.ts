// app/api/settings/route.ts
// GET   — return current account settings (creates default row if absent).
// PATCH — update settings (currently: strategy_parts).

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";
import { DEFAULT_ACCOUNT_SETTINGS } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("account_settings")
    .select("id, strategy_parts, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "fetch_failed", detail: error.message, settings: DEFAULT_ACCOUNT_SETTINGS },
      { status: 200 }
    );
  }

  return NextResponse.json({
    ok: true,
    settings: data ?? DEFAULT_ACCOUNT_SETTINGS,
  });
}

export async function PATCH(req: NextRequest) {
  let body: { strategy_parts?: number };
  try {
    body = (await req.json()) as { strategy_parts?: number };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.strategy_parts !== undefined) {
    const n = Number(body.strategy_parts);
    if (!Number.isFinite(n) || n < 2 || n > 100 || !Number.isInteger(n)) {
      return NextResponse.json(
        {
          error: "invalid_strategy_parts",
          detail: "strategy_parts must be an integer between 2 and 100.",
        },
        { status: 400 }
      );
    }
    updates.strategy_parts = n;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "no_updates", detail: "Nothing to update." },
      { status: 400 }
    );
  }

  updates.updated_at = new Date().toISOString();
  const db = getServiceClient();

  // Upsert the single settings row.
  const { data, error } = await db
    .from("account_settings")
    .upsert({ id: 1, ...updates }, { onConflict: "id" })
    .select("id, strategy_parts, updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "update_failed", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, settings: data });
}
