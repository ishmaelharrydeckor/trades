// components/dashboard/OutcomeDistribution.tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KpiSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Row {
  label: "Win" | "Loss" | "Breakeven";
  count: number;
  color: string;
  bg: string;
  text: string;
  icon: typeof TrendingUp;
}

export default function OutcomeDistribution({ kpi }: { kpi: KpiSummary }) {
  const total = kpi.totalTrades;

  const rows: Row[] = [
    {
      label: "Win",
      count: kpi.totalWins,
      color: "var(--accent-profit)",
      bg: "bg-[color:var(--accent-profit)]",
      text: "text-[color:var(--accent-profit)]",
      icon: TrendingUp,
    },
    {
      label: "Loss",
      count: kpi.totalLosses,
      color: "var(--accent-loss)",
      bg: "bg-[color:var(--accent-loss)]",
      text: "text-[color:var(--accent-loss)]",
      icon: TrendingDown,
    },
    {
      label: "Breakeven",
      count: kpi.totalBreakeven,
      color: "#f59e0b",
      bg: "bg-amber-500",
      text: "text-amber-400",
      icon: Minus,
    },
  ];

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">Trade Outcomes</h3>
        <p className="text-xs text-slate-500">
          Distribution of {total.toLocaleString()} closed positions
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((r) => {
          const pct = total > 0 ? (r.count / total) * 100 : 0;
          const Icon = r.icon;
          return (
            <div key={r.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-medium",
                    r.text
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {r.label}
                </span>
                <span className="text-sm tnum">
                  <span className="font-semibold text-white">{r.count}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {pct.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/60">
                <div
                  className={cn("h-full rounded-full", r.bg)}
                  style={{ width: `${pct}%`, opacity: 0.85 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
