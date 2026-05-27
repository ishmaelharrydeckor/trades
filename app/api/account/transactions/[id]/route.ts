// app/api/account/transactions/[id]/route.ts
// DELETE a transaction by ID.

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "edge";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error, count } = await supabase
    .from("account_transactions")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "delete_failed", detail: error.message },
      { status: 500 }
    );
  }

  if (!count) {
    return NextResponse.json(
      { error: "not_found", id },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, deleted: count });
}
