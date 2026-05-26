// app/api/trades/[ticket_id]/route.ts
// Edit endpoint for the trade enrichment fields (tags, notes, mindset, screenshot_url).
// Uses the Supabase service role client to bypass the public-read RLS policy.

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { MINDSETS, type Mindset } from "@/lib/types";

export const runtime = "edge";

const MAX_TAGS = 12;
const MAX_TAG_LEN = 40;
const MAX_NOTES_LEN = 5000;
const MAX_URL_LEN = 2000;

interface PatchBody {
  tags?: string[] | null;
  notes?: string | null;
  mindset?: Mindset | null;
  screenshot_url?: string | null;
}

function sanitizeTags(input: unknown): string[] | null {
  if (input === null) return null;
  if (!Array.isArray(input)) return undefined as unknown as string[];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const tag = raw.trim().slice(0, MAX_TAG_LEN);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

function sanitizeText(
  input: unknown,
  maxLen: number
): string | null | undefined {
  if (input === null) return null;
  if (input === undefined) return undefined;
  if (typeof input !== "string") return undefined;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function sanitizeMindset(input: unknown): Mindset | null | undefined {
  if (input === null) return null;
  if (input === undefined) return undefined;
  if (typeof input !== "string") return undefined;
  const up = input.trim().toUpperCase() as Mindset;
  if (MINDSETS.includes(up)) return up;
  return undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticket_id: string } }
) {
  const ticketId = decodeURIComponent(params.ticket_id);
  if (!ticketId) {
    return NextResponse.json({ error: "missing ticket_id" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  const tags = sanitizeTags(body.tags);
  if (tags !== undefined) update.tags = tags;

  const notes = sanitizeText(body.notes, MAX_NOTES_LEN);
  if (notes !== undefined) update.notes = notes;

  const mindset = sanitizeMindset(body.mindset);
  if (mindset !== undefined) update.mindset = mindset;

  const url = sanitizeText(body.screenshot_url, MAX_URL_LEN);
  if (url !== undefined) update.screenshot_url = url;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "no editable fields supplied" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("trades")
    .update(update)
    .eq("ticket_id", ticketId)
    .select(
      "ticket_id, tags, notes, mindset, screenshot_url"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "supabase_error", detail: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "trade_not_found", ticket_id: ticketId },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, trade: data });
}
