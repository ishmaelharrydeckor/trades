// components/dashboard/WinLossPanels.tsx
import { TrendingUp, TrendingDown } from "lucide-react";
import type { KpiSummary } from "@/lib/types";
import { fmtSignedUsd } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Row {
  label: string;
  value: string;
  tone: "profit" | "loss" | "neutral";
}

function Panel({
  title,
  subtitle,
  rows,
  variant,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
  variant: "profit" | "loss";
}) {
  const Icon = variant === "profit" ? TrendingUp : TrendingDown;
  const accent =
    variant === "profit"
      ? "text-[color:var(--accent-profit)]"
      : "text-[color:var(--accent-loss)]";
  const ringGlow =
    variant === "profit"
      ? "before:bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_60%)]"
      : "before:bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_60%)]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5",
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        ringGlow
      )}
    >
      <div className="relative flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div
          className={cn(
            "rounded-lg p-2",
            variant === "profit"
              ? "bg-emerald-500/10"
              : "bg-red-500/10"
          )}
        >
          <Icon className={cn("h-4 w-4", accent)} />
        </div>
      </div>
      <dl className="relative mt-5 divide-y divide-[color:var(--border-panel)]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <dt className="text-sm text-slate-400">{row.label}</dt>
            <dd
              className={cn(
                "text-sm font-semibold tnum",
                row.tone === "profit" && "text-[color:var(--accent-profit)]",
                row.tone === "loss" && "text-[color:var(--accent-loss)]",
                row.tone === "neutral" && "text-white"
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function WinLossPanels({ kpi }: { kpi: KpiSummary }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Panel
        title="Win Metrics"
        subtitle="Performance diagnostics on profitable executions"
        variant="profit"
        rows={[
          {
            label: "Total Win Profit",
            value: fmtSignedUsd(kpi.grossProfit),
            tone: "profit",
          },
          {
            label: "Average Winner",
            value: fmtSignedUsd(kpi.avgWinner),
            tone: "profit",
          },
          {
            label: "Largest Single Winner",
            value: fmtSignedUsd(kpi.largestWin),
            tone: "profit",
          },
          {
            label: "Max Consecutive Wins",
            value: `${kpi.maxWinStreak}`,
            tone: "neutral",
          },
        ]}
      />
      <Panel
        title="Loss Metrics"
        subtitle="Performance diagnostics on drawdown executions"
        variant="loss"
        rows={[
          {
            label: "Total Losses",
            value: fmtSignedUsd(kpi.grossLoss),
            tone: "loss",
          },
          {
            label: "Average Loser",
            value: fmtSignedUsd(kpi.avgLoser),
            tone: "loss",
          },
          {
            label: "Worst Single Loser",
            value: fmtSignedUsd(kpi.worstLoss),
            tone: "loss",
          },
          {
            label: "Max Consecutive Losses",
            value: `${kpi.maxLossStreak}`,
            tone: "neutral",
          },
        ]}
      />
    </div>
  );
}
