// components/dashboard/LongShortPanel.tsx
import { ArrowUp, ArrowDown } from "lucide-react";
import type { DirectionRow } from "@/lib/types";
import { cn, fmtPct, fmtSignedUsd } from "@/lib/utils";

function Row({ label, value, tone }: { label: string; value: string; tone?: "profit" | "loss" | "neutral" }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[color:var(--border-panel)] last:border-b-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tnum",
          tone === "profit" && "text-[color:var(--accent-profit)]",
          tone === "loss" && "text-[color:var(--accent-loss)]",
          (!tone || tone === "neutral") && "text-white"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Side({ row }: { row: DirectionRow }) {
  const isBuy = row.direction === "BUY";
  const Icon = isBuy ? ArrowUp : ArrowDown;
  const accent = isBuy
    ? "text-[color:var(--accent-profit)] bg-emerald-500/10"
    : "text-[color:var(--accent-loss)] bg-red-500/10";

  return (
    <div className="rounded-xl border border-[color:var(--border-panel)] bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold", accent)}>
          <Icon className="h-3.5 w-3.5" />
          {row.direction === "BUY" ? "LONG (BUY)" : "SHORT (SELL)"}
        </span>
        <span className="text-xs text-slate-500 tnum">{row.trades} trades</span>
      </div>
      <div
        className={cn(
          "mt-4 text-2xl font-semibold tnum",
          row.netPnl > 0 && "text-[color:var(--accent-profit)]",
          row.netPnl < 0 && "text-[color:var(--accent-loss)]",
          row.netPnl === 0 && "text-slate-400"
        )}
      >
        {fmtSignedUsd(row.netPnl)}
      </div>
      <div className="mt-1 text-xs text-slate-500">Net P&L</div>

      <div className="mt-4">
        <Row label="Win Rate" value={fmtPct(row.winRate, 1)} />
        <Row label="Wins / Losses" value={`${row.wins} / ${row.losses}`} />
        <Row label="Avg Winner" value={fmtSignedUsd(row.avgWinner)} tone="profit" />
        <Row label="Avg Loser" value={fmtSignedUsd(row.avgLoser)} tone="loss" />
        <Row label="Gross Profit" value={fmtSignedUsd(row.grossProfit)} tone="profit" />
        <Row label="Gross Loss" value={fmtSignedUsd(row.grossLoss)} tone="loss" />
      </div>
    </div>
  );
}

export default function LongShortPanel({ rows }: { rows: DirectionRow[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">
          Long vs Short
        </h3>
        <p className="text-xs text-slate-500">
          Directional bias — which side of the market is paying you
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Side key={r.direction} row={r} />
        ))}
      </div>
    </div>
  );
}
