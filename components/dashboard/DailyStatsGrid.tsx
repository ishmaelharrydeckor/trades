// components/dashboard/DailyStatsGrid.tsx
import type { DailyStatsSummary } from "@/lib/types";
import { cn, fmtNumber, fmtSignedUsd, fmtUsd } from "@/lib/utils";

interface Cell {
  label: string;
  value: string;
  tone?: "profit" | "loss" | "neutral";
}

function StatCell({ cell }: { cell: Cell }) {
  return (
    <div className="border-b border-r border-[color:var(--border-panel)] p-4">
      <div className="text-xs text-slate-500">{cell.label}</div>
      <div
        className={cn(
          "mt-1 text-base font-semibold tnum",
          cell.tone === "profit" && "text-[color:var(--accent-profit)]",
          cell.tone === "loss" && "text-[color:var(--accent-loss)]",
          (!cell.tone || cell.tone === "neutral") && "text-white"
        )}
      >
        {cell.value}
      </div>
    </div>
  );
}

const toneFor = (n: number): "profit" | "loss" | "neutral" =>
  n > 0 ? "profit" : n < 0 ? "loss" : "neutral";

export default function DailyStatsGrid({ stats }: { stats: DailyStatsSummary }) {
  const cells: Cell[] = [
    { label: "Total P&L", value: fmtSignedUsd(stats.totalPnl), tone: toneFor(stats.totalPnl) },
    { label: "Avg Daily P&L", value: fmtSignedUsd(stats.avgDailyPnl), tone: toneFor(stats.avgDailyPnl) },
    { label: "Avg Trade P&L", value: fmtSignedUsd(stats.avgTradePnl), tone: toneFor(stats.avgTradePnl) },
    { label: "Trade Expectancy", value: fmtSignedUsd(stats.expectancy), tone: toneFor(stats.expectancy) },

    { label: "Largest Profit", value: fmtSignedUsd(stats.largestProfit), tone: "profit" },
    { label: "Largest Loss", value: fmtSignedUsd(stats.largestLoss), tone: "loss" },
    { label: "Avg Winning Trade", value: fmtSignedUsd(stats.avgWinner), tone: "profit" },
    { label: "Avg Losing Trade", value: fmtSignedUsd(stats.avgLoser), tone: "loss" },

    { label: "Avg Winning Day P&L", value: fmtSignedUsd(stats.avgWinningDay), tone: "profit" },
    { label: "Avg Losing Day P&L", value: fmtSignedUsd(stats.avgLosingDay), tone: "loss" },
    { label: "Best Day Profit", value: fmtSignedUsd(stats.bestDay), tone: "profit" },
    { label: "Worst Day Loss", value: fmtSignedUsd(stats.worstDay), tone: "loss" },

    { label: `Best Month (${stats.bestMonthLabel})`, value: fmtSignedUsd(stats.bestMonthPnl), tone: "profit" },
    { label: `Worst Month (${stats.worstMonthLabel})`, value: fmtSignedUsd(stats.worstMonthPnl), tone: "loss" },
    { label: "Avg Daily Volume", value: `${fmtNumber(stats.avgDailyVolume)} lots` },
    { label: "Total Volume", value: `${fmtNumber(stats.totalVolume)} lots` },

    { label: "Total Commissions", value: fmtUsd(stats.totalCommissions) },
    { label: "Total Swap", value: fmtUsd(stats.totalSwap) },
    { label: "Profit Factor", value: stats.profitFactor.toFixed(2), tone: stats.profitFactor >= 1 ? "profit" : "loss" },
    { label: "Total Trading Days", value: stats.totalTradingDays.toString() },

    { label: "Winning Days", value: stats.winningDays.toString(), tone: "profit" },
    { label: "Losing Days", value: stats.losingDays.toString(), tone: "loss" },
    { label: "Max Win Streak", value: stats.maxWinStreak.toString(), tone: "profit" },
    { label: "Max Loss Streak", value: stats.maxLossStreak.toString(), tone: "loss" },

    { label: "Max Win Day Streak", value: stats.maxWinDayStreak.toString(), tone: "profit" },
    { label: "Max Loss Day Streak", value: stats.maxLossDayStreak.toString(), tone: "loss" },
    { label: "Open Trades", value: "0" },
    { label: "Total Trades", value: stats.totalTrades.toString() },
  ];

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">Daily Net P&L Stats</h3>
        <p className="text-xs text-slate-500">Comprehensive performance breakdown</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[color:var(--border-panel)]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {cells.map((c) => (
            <StatCell key={c.label} cell={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
