// components/dashboard/TransactionManager.tsx
// Form to add deposits/withdrawals/starting balance + history list with delete.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Wrench,
  Loader2,
} from "lucide-react";
import type { AccountTransaction, TransactionKind } from "@/lib/types";
import { cn, fmtUsd } from "@/lib/utils";

const KIND_META: Record<
  TransactionKind,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  STARTING_BALANCE: {
    label: "Starting Balance",
    icon: <Coins className="h-3.5 w-3.5" />,
    tone: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  },
  DEPOSIT: {
    label: "Deposit",
    icon: <ArrowUpRight className="h-3.5 w-3.5" />,
    tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    icon: <ArrowDownLeft className="h-3.5 w-3.5" />,
    tone: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  },
  ADJUSTMENT: {
    label: "Adjustment",
    icon: <Wrench className="h-3.5 w-3.5" />,
    tone: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
};

export default function TransactionManager({
  transactions,
  hasStartingBalance,
}: {
  transactions: AccountTransaction[];
  hasStartingBalance: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<TransactionKind>(
    hasStartingBalance ? "DEPOSIT" : "STARTING_BALANCE"
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableKinds: TransactionKind[] = hasStartingBalance
    ? ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"]
    : ["STARTING_BALANCE", "DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"];

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const num = Number(amount);
      if (!Number.isFinite(num) || num === 0) {
        throw new Error("Enter an amount.");
      }
      const resp = await fetch("/api/account/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amount: num,
          occurred_at: new Date(date + "T12:00:00Z").toISOString(),
          note: note.trim() || null,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.detail || json.error || `HTTP ${resp.status}`);
      }
      setAmount("");
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this transaction? This affects all historical stats.")) return;
    try {
      const resp = await fetch(`/api/account/transactions/${id}`, {
        method: "DELETE",
      });
      const json = await resp.json();
      if (!resp.ok) {
        alert(json.detail || json.error || "Delete failed");
        return;
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const sortedTx = [...transactions].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr]">
      {/* Form */}
      <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
        <h3 className="mb-4 text-base font-semibold">Add Transaction</h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[color:var(--text-secondary)]">
              Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {availableKinds.map((k) => {
                const meta = KIND_META[k];
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                      active
                        ? meta.tone
                        : "border-[color:var(--border-panel)] text-[color:var(--text-secondary)] hover:border-white/30 hover:text-white"
                    )}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[color:var(--text-secondary)]">
              Amount {kind === "ADJUSTMENT" && "(signed: negative for loss)"}
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-[color:var(--border-panel)] bg-black/20 px-3 py-2">
              <span className="text-sm text-[color:var(--text-secondary)]">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-secondary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[color:var(--text-secondary)]">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border-panel)] bg-black/20 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[color:var(--text-secondary)]">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Wire from Wise"
              maxLength={500}
              className="w-full rounded-lg border border-[color:var(--border-panel)] bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-[color:var(--text-secondary)]"
            />
          </div>

          {error && (
            <p className="text-xs text-[color:var(--accent-loss)]">{error}</p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--accent-equity)] px-4 py-2 text-sm font-medium text-white shadow transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Add Transaction"}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-base font-semibold">Transaction History</h3>
          <span className="text-xs text-[color:var(--text-secondary)]">
            {sortedTx.length} {sortedTx.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {sortedTx.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[color:var(--border-panel)] text-sm text-[color:var(--text-secondary)]">
            No transactions yet — add a starting balance to begin.
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {sortedTx.map((tx) => {
              const meta = KIND_META[tx.kind];
              const signed =
                tx.kind === "WITHDRAWAL"
                  ? -Math.abs(Number(tx.amount))
                  : Number(tx.amount);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border-panel)] bg-black/10 px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium",
                        meta.tone
                      )}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[color:var(--text-secondary)]">
                        {new Date(tx.occurred_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {tx.note && (
                        <div className="truncate text-xs text-[color:var(--text-secondary)]">
                          {tx.note}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      signed > 0 && "text-[color:var(--accent-profit)]",
                      signed < 0 && "text-[color:var(--accent-loss)]"
                    )}
                  >
                    {signed > 0 ? "+" : signed < 0 ? "−" : ""}
                    {fmtUsd(Math.abs(signed))}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(tx.id)}
                    aria-label="Delete"
                    className="rounded p-1 text-[color:var(--text-secondary)] transition hover:bg-white/5 hover:text-[color:var(--accent-loss)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
