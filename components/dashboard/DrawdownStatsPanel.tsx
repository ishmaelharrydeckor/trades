// components/dashboard/DrawdownStatsPanel.tsx

"use client";

import type { DrawdownStats } from "@/lib/types";
import { cn, fmtPct, fmtUsd } from "@/lib/utils";

export default function DrawdownStatsPanel({
  stats,
}: {
  stats: DrawdownStats;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Drawdown Stats</h3>
        <p className="text-xs text-[color:var(--text-secondary)]">
          Risk diagnostics on capital preservation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCell
          label="Max Drawdown"
          value={fmtUsd(stats.maxDrawdown)}
          subtitle={
            stats.maxDrawdownAt
              ? `${stats.maxDrawdownPct.toFixed(2)}%`
              : "—"
          }
          tone="loss"
        />
        <StatCell
          label="Current Drawdown"
          value={fmtUsd(stats.currentDrawdown)}
          subtitle={
            stats.currentDrawdown > 0
              ? `${stats.currentDrawdownPct.toFixed(2)}%`
              : "At peak"
          }
          tone={stats.currentDrawdown > 0 ? "loss" : "profit"}
        />
        <StatCell
          label="Peak Equity"
          value={fmtUsd(stats.peakEquity)}
          subtitle={
            stats.peakEquityAt
              ? new Date(stats.peakEquityAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
        />
        <StatCell
          label="Avg Drawdown"
          value={fmtUsd(stats.averageDrawdown)}
          subtitle="Across all dips"
        />
        <StatCell
          label="Days in DD"
          value={String(stats.daysInCurrentDrawdown)}
          subtitle={stats.currentDrawdown > 0 ? "Since last peak" : "—"}
          tone={stats.daysInCurrentDrawdown > 7 ? "loss" : undefined}
        />
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="rounded-lg border border-[color:var(--border-panel)] bg-black/10 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "profit" && "text-[color:var(--accent-profit)]",
          tone === "loss" && "text-[color:var(--accent-loss)]"
        )}
      >
        {value}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[11px] text-[color:var(--text-secondary)]">
          {subtitle}
        </div>
      )}
    </div>
  );
}
