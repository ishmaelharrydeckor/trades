// components/dashboard/OverviewTab.tsx
"use client";

import { useMemo } from "react";
import { DollarSign, Target, Gauge, Wallet } from "lucide-react";
import type { AccountSettings, AccountTransaction, Trade } from "@/lib/types";
import { computeKpis, buildEquityCurve } from "@/lib/stats";
import { computeAccountState } from "@/lib/account";
import { fmtSignedUsd, fmtPct, fmtUsd } from "@/lib/utils";
import KpiCard from "./KpiCard";
import EquityCurveChart from "./EquityCurveChart";
import WinLossPanels from "./WinLossPanels";
import OpenPositionsPanel from "./OpenPositionsPanel";
import InsightsPanel from "./InsightsPanel";

export default function OverviewTab({
  trades,
  transactions,
  settings,
}: {
  trades: Trade[];
  transactions: AccountTransaction[];
  settings: AccountSettings;
}) {
  const kpi = useMemo(() => computeKpis(trades), [trades]);
  const account = useMemo(
    () => computeAccountState(transactions, trades, { strategyParts: settings.strategy_parts }),
    [transactions, trades, settings.strategy_parts]
  );

  // If there's a starting balance, use capital baseline for the equity curve;
  // otherwise fall back to pure trade-P&L curve from zero (legacy behavior).
  const baselineCapital = account.hasStartingBalance
    ? account.startingBalance + account.netCashFlow
    : 0;
  const equity = useMemo(
    () => buildEquityCurve(trades, baselineCapital),
    [trades, baselineCapital]
  );

  const netTone = kpi.netPnl > 0 ? "profit" : kpi.netPnl < 0 ? "loss" : "neutral";
  const equityTone =
    account.currentBalance > account.startingBalance + account.netCashFlow
      ? "profit"
      : account.currentBalance < account.startingBalance + account.netCashFlow
        ? "loss"
        : "neutral";

  // Lifetime return % uses starting capital as the denominator
  const lifetimeReturnPct =
    account.startingBalance > 0
      ? ((account.currentBalance - (account.startingBalance + account.netCashFlow)) /
          account.startingBalance) *
        100
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Live open positions feed */}
      <OpenPositionsPanel />

      {/* Top KPI strip — Account Equity replaces Volume when capital is tracked */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {account.hasStartingBalance ? (
          <KpiCard
            label="Account Equity"
            value={fmtUsd(account.currentBalance)}
            delta={
              account.startingBalance > 0
                ? `${lifetimeReturnPct >= 0 ? "+" : ""}${lifetimeReturnPct.toFixed(2)}% return`
                : "Live balance"
            }
            tone={equityTone}
            icon={Wallet}
            glow
          />
        ) : (
          <KpiCard
            label="Net Portfolio P&L"
            value={fmtSignedUsd(kpi.netPnl)}
            delta={`${kpi.totalTrades.toLocaleString()} executions`}
            tone={netTone}
            icon={DollarSign}
            glow
          />
        )}
        <KpiCard
          label="Trade P&L"
          value={fmtSignedUsd(kpi.netPnl)}
          delta={`${kpi.totalTrades.toLocaleString()} executions`}
          tone={netTone}
          icon={DollarSign}
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
      </div>

      {/* Equity curve — uses capital baseline when a starting balance is set */}
      <EquityCurveChart data={equity} />

      {/* Win / Loss diagnostics */}
      <WinLossPanels kpi={kpi} />

      {/* AI insights */}
      <InsightsPanel />
    </div>
  );
}
