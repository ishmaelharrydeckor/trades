// components/dashboard/OverviewTab.tsx
"use client";

import { useMemo } from "react";
import { DollarSign, Target, Gauge, Layers } from "lucide-react";
import type { Trade } from "@/lib/types";
import { computeKpis, buildEquityCurve } from "@/lib/stats";
import { fmtSignedUsd, fmtPct, fmtNumber } from "@/lib/utils";
import KpiCard from "./KpiCard";
import EquityCurveChart from "./EquityCurveChart";
import WinLossPanels from "./WinLossPanels";

export default function OverviewTab({ trades }: { trades: Trade[] }) {
  const kpi = useMemo(() => computeKpis(trades), [trades]);
  const equity = useMemo(() => buildEquityCurve(trades), [trades]);

  const netTone = kpi.netPnl > 0 ? "profit" : kpi.netPnl < 0 ? "loss" : "neutral";

  return (
    <div className="flex flex-col gap-6">
      {/* Top KPI strip */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Net Portfolio P&L"
          value={fmtSignedUsd(kpi.netPnl)}
          delta={`${kpi.totalTrades.toLocaleString()} executions`}
          tone={netTone}
          icon={DollarSign}
          glow
        />
        <KpiCard
          label="Win Rate"
          value={fmtPct(kpi.winRate)}
          delta={`${kpi.totalWins} W · ${kpi.totalLosses} L`}
          tone="blue"
          icon={Target}
        />
        <KpiCard
          label="Profit Factor"
          value={kpi.profitFactor.toFixed(2)}
          delta={
            kpi.profitFactor >= 1.5
              ? "Strong edge"
              : kpi.profitFactor >= 1
              ? "Profitable"
              : "Below breakeven"
          }
          tone={kpi.profitFactor >= 1 ? "profit" : "loss"}
          icon={Gauge}
        />
        <KpiCard
          label="Total Executed Volume"
          value={`${fmtNumber(kpi.totalVolume)} lots`}
          delta="Aggregate position sizing"
          tone="neutral"
          icon={Layers}
        />
      </div>

      {/* Equity curve */}
      <EquityCurveChart data={equity} />

      {/* Win / Loss diagnostics */}
      <WinLossPanels kpi={kpi} />
    </div>
  );
}
