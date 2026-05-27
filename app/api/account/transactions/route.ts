// app/api/account/transactions/route.ts
// POST a new transaction (deposit, withdrawal, starting balance, adjustment).

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { TRANSACTION_KINDS, type TransactionKind } from "@/lib/types";

export const runtime = "edge";

interface PostBody {
  kind?: TransactionKind;
  amount?: number;
  occurred_at?: string;
  note?: string | null;
}

const MAX_NOTE_LEN = 500;

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.kind || !TRANSACTION_KINDS.includes(body.kind)) {
    return NextResponse.json(
      {
        error: "invalid_kind",
        detail: `kind must be one of: ${TRANSACTION_KINDS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json(
      { error: "invalid_amount", detail: "amount must be a non-zero number" },
      { status: 400 }
    );
  }

  // Non-adjustment kinds must be positive; the math applies the sign by kind.
  if (body.kind !== "ADJUSTMENT" && amount < 0) {
    return NextResponse.json(
      {
        error: "invalid_amount",
        detail:
          "For DEPOSIT/WITHDRAWAL/STARTING_BALANCE, send a positive amount. Sign is applied automatically.",
      },
      { status: 400 }
    );
  }

  const occurredAt =
    body.occurred_at && !Number.isNaN(Date.parse(body.occurred_at))
      ? new Date(body.occurred_at).toISOString()
      : new Date().toISOString();

  const note =
    typeof body.note === "string"
      ? body.note.trim().slice(0, MAX_NOTE_LEN) || null
      : null;

  const supabase = getServiceClient();

  // No more "only one starting balance" rule — users are free to delete and
  // re-create, or add corrections. The math sums all STARTING_BALANCE entries.

  const { data, error } = await supabase
    .from("account_transactions")
    .insert({
      kind: body.kind,
      amount: Math.abs(amount) * (body.kind === "ADJUSTMENT" ? Math.sign(amount) : 1),
      occurred_at: occurredAt,
      note,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "insert_failed", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, transaction: data });
}
