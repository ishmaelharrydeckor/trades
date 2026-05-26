// components/dashboard/PerformanceByMindset.tsx
import { Brain } from "lucide-react";
import type { EnrichmentRow, Mindset } from "@/lib/types";
import { cn, fmtPct, fmtSignedUsd } from "@/lib/utils";

const MINDSET_META: Record<
  string,
  { emoji: string; tone: "good" | "neutral" | "bad"; label: string }
> = {
  DISCIPLINED: { emoji: "✅", tone: "good", label: "Disciplined" },
  CONFIDENT: { emoji: "💪", tone: "good", label: "Confident" },
  PATIENT: { emoji: "🧘", tone: "good", label: "Patient" },
  FOMO: { emoji: "😰", tone: "bad", label: "FOMO" },
  REVENGE: { emoji: "😤", tone: "bad", label: "Revenge" },
  HESITANT: { emoji: "😕", tone: "neutral", label: "Hesitant" },
};

export default function PerformanceByMindset({
  rows,
}: {
  rows: EnrichmentRow[];
}) {
  const hasData = rows.length > 0;

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4 text-purple-400" />
        <h3 className="text-base font-semibold text-white">
          Performance by Mindset
        </h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        The brutal truth — which mental states actually make you money
      </p>

      {!hasData ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border-panel)] px-4 py-8 text-center text-sm text-slate-500">
          Tag trades with a mindset to see the psychology breakdown.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((r) => {
            const meta = MINDSET_META[r.key] ?? {
              emoji: "❓",
              tone: "neutral" as const,
              label: r.key,
            };
            const positive = r.netPnl > 0;
            const negative = r.netPnl < 0;
            return (
              <div
                key={r.key}
                className={cn(
                  "rounded-lg border bg-black/20 p-3",
                  meta.tone === "good" && "border-emerald-500/20",
                  meta.tone === "bad" && "border-red-500/20",
                  meta.tone === "neutral" && "border-amber-500/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-sm font-medium text-white">
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 tnum">
                    {r.trades} trade{r.trades === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "text-xl font-semibold tnum",
                      positive && "text-[color:var(--accent-profit)]",
                      negative && "text-[color:var(--accent-loss)]",
                      !positive && !negative && "text-slate-300"
                    )}
                  >
                    {fmtSignedUsd(r.netPnl)}
                  </span>
                  <span className="text-xs text-slate-500 tnum">
                    Win rate {fmtPct(r.winRate)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500 tnum">
                  Avg / trade {fmtSignedUsd(r.avgPnl)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
