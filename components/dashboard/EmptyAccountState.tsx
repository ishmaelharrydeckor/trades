// components/dashboard/EmptyAccountState.tsx
// Shown when there's no STARTING_BALANCE transaction yet.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Loader2 } from "lucide-react";

export default function EmptyAccountState() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const num = Number(amount);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error("Enter a positive starting capital.");
      }
      const resp = await fetch("/api/account/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "STARTING_BALANCE",
          amount: num,
          occurred_at: new Date().toISOString(),
          note: "Initial capital",
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.detail || json.error || `HTTP ${resp.status}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set starting balance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
          <Coins className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold">Set your starting capital</h2>
        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
          The dashboard needs a baseline to track equity, drawdown,
          and your 10-part risk strategy. You can update this anytime.
        </p>

        <div className="mt-5 space-y-3 text-left">
          <div>
            <label className="mb-1 block text-xs text-[color:var(--text-secondary)]">
              Starting Capital
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-[color:var(--border-panel)] bg-black/20 px-3 py-2">
              <span className="text-sm text-[color:var(--text-secondary)]">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000.00"
                autoFocus
                className="flex-1 bg-transparent text-base outline-none placeholder:text-[color:var(--text-secondary)]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-[color:var(--accent-loss)]">{error}</p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--accent-equity)] px-4 py-2.5 text-sm font-medium text-white shadow transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Setting…" : "Set Starting Capital"}
          </button>
        </div>
      </div>
    </div>
  );
}
