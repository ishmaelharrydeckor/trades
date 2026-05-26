// components/dashboard/PerformanceByTag.tsx
import { Tag as TagIcon } from "lucide-react";
import type { EnrichmentRow } from "@/lib/types";
import { cn, fmtPct, fmtSignedUsd } from "@/lib/utils";

export default function PerformanceByTag({ rows }: { rows: EnrichmentRow[] }) {
  const hasData = rows.length > 0;
  const maxAbs = hasData
    ? Math.max(...rows.map((r) => Math.abs(r.netPnl)), 1)
    : 1;

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-blue-400" />
        <h3 className="text-base font-semibold text-white">
          Performance by Tag
        </h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Net P&L grouped by setup tag — which strategies actually pay
      </p>

      {!hasData ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border-panel)] px-4 py-8 text-center text-sm text-slate-500">
          Tag your trades to see strategy-level performance.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const positive = r.netPnl > 0;
            const negative = r.netPnl < 0;
            const widthPct = (Math.abs(r.netPnl) / maxAbs) * 100;
            return (
              <div
                key={r.key}
                className="grid grid-cols-12 items-center gap-3 rounded-lg bg-black/20 px-3 py-2.5"
              >
                <div className="col-span-3 flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300">
                    {r.key}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-slate-400 tnum">
                  {r.trades} trade{r.trades === 1 ? "" : "s"}
                </div>
                <div className="col-span-2 text-xs text-slate-400 tnum">
                  {fmtPct(r.winRate)}
                </div>
                <div className="col-span-5 flex items-center gap-2">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        positive && "bg-[color:var(--accent-profit)]",
                        negative && "bg-[color:var(--accent-loss)]",
                        !positive && !negative && "bg-slate-500"
                      )}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "min-w-[64px] text-right text-sm font-semibold tnum",
                      positive && "text-[color:var(--accent-profit)]",
                      negative && "text-[color:var(--accent-loss)]",
                      !positive && !negative && "text-slate-400"
                    )}
                  >
                    {fmtSignedUsd(r.netPnl)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
