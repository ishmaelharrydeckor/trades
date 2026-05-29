// components/dashboard/AccountTab.tsx
// Composes the account & drawdown experience.

"use client";

import { useMemo } from "react";
import type { AccountSettings, AccountTransaction, Trade } from "@/lib/types";
import {
  computeAccountState,
  computeDrawdownSeries,
  computeDrawdownStats,
  computeEquitySeries,
} from "@/lib/account";
import AccountHeader from "./AccountHeader";
import RiskPartBanner from "./RiskPartBanner";
import DrawdownChart from "./DrawdownChart";
import DrawdownStatsPanel from "./DrawdownStatsPanel";
import RiskCompliancePanel from "./RiskCompliancePanel";
import StrategyPartsForm from "./StrategyPartsForm";
import PositionSizingCalculator from "./PositionSizingCalculator";
import TransactionManager from "./TransactionManager";
import EmptyAccountState from "./EmptyAccountState";

export default function AccountTab({
  trades,
  transactions,
  settings,
}: {
  trades: Trade[];
  transactions: AccountTransaction[];
  settings: AccountSettings;
}) {
  const state = useMemo(
    () =>
      computeAccountState(transactions, trades, {
        strategyParts: settings.strategy_parts,
      }),
    [transactions, trades, settings.strategy_parts]
  );

  const equity = useMemo(
    () => computeEquitySeries(transactions, trades),
    [transactions, trades]
  );

  const drawdown = useMemo(() => computeDrawdownSeries(equity), [equity]);
  const ddStats = useMemo(() => computeDrawdownStats(drawdown), [drawdown]);

  if (!state.hasStartingBalance) {
    return <EmptyAccountState />;
  }

  return (
    <div className="space-y-6">
      <AccountHeader state={state} />
      <RiskPartBanner state={state} />
      <PositionSizingCalculator
        currentEquity={state.currentBalance}
        strategyParts={settings.strategy_parts}
        trades={trades}
      />
      <DrawdownChart series={drawdown} />
      <DrawdownStatsPanel stats={ddStats} />
      <RiskCompliancePanel
        trades={trades}
        transactions={transactions}
        parts={state.strategyParts}
      />
      <StrategyPartsForm initialParts={settings.strategy_parts} />
      <TransactionManager
        transactions={transactions}
        hasStartingBalance={state.hasStartingBalance}
      />
    </div>
  );
}
