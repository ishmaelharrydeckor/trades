// components/dashboard/StrategyPartsForm.tsx
// Lets the user adjust how many parts they split capital into for the
// per-trade risk rule. Defaults to 10.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Settings2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 15, 20];

export default function StrategyPartsForm({
  initialParts,
}: {
  initialParts: number;
}) {
  const router = useRouter();
  const [parts, setParts] = useState<number>(initialParts);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const dirty = parts !== initialParts;
  const valid =
    Number.isInteger(parts) && parts >= 2 && parts <= 100;

  async function save() {
    if (!valid || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_parts: parts }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.detail || j.error || "Update failed.");
      } else {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-[color:var(--text-secondary)]" />
          <div>
            <h3 className="text-base font-semibold">Risk Strategy</h3>
            <p className="text-xs text-[color:var(--text-secondary)]">
              Split your capital into N parts. Risk up to one part per trade.
              Higher N = smaller per-trade risk.
            </p>
          </div>
        </div>
        {savedFlash && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
            <Check className="h-3 w-3" /> Saved
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border-panel)] bg-black/10 p-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParts(p)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                parts === p
                  ? "bg-[color:var(--accent-equity)] text-white"
                  : "text-[color:var(--text-secondary)] hover:bg-white/5 hover:text-white"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1.5">
          <label className="text-xs text-[color:var(--text-secondary)]">
            Custom:
          </label>
          <input
            type="number"
            min={2}
            max={100}
            step={1}
            value={parts}
            onChange={(e) => setParts(Number(e.target.value))}
            className="w-20 rounded-md border border-[color:var(--border-panel)] bg-black/20 px-2 py-1 text-sm tabular-nums outline-none focus:border-blue-500/50"
          />
          <span className="text-xs text-[color:var(--text-secondary)]">parts</span>
        </div>

        <span className="ml-auto text-xs text-[color:var(--text-secondary)]">
          = {valid ? `${(100 / parts).toFixed(1)}% risk per trade` : "—"}
        </span>

        <button
          type="button"
          onClick={save}
          disabled={!dirty || !valid || saving}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            dirty && valid && !saving
              ? "bg-[color:var(--accent-equity)] text-white hover:bg-blue-500"
              : "cursor-not-allowed bg-white/5 text-[color:var(--text-secondary)]"
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.05] px-3 py-2 text-xs text-red-300">
          <X className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}
