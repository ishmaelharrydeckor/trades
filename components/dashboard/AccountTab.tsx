// components/dashboard/AccountTab.tsx
// Composes the account & drawdown experience.

"use client";

import { useMemo } from "react";
import type { AccountTransaction, Trade } from "@/lib/types";
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
import TransactionManager from "./TransactionManager";
import EmptyAccountState from "./EmptyAccountState";

export default function AccountTab({
  trades,
  transactions,
}: {
  trades: Trade[];
  transactions: AccountTransaction[];
}) {
  const state = useMemo(
    () => computeAccountState(transactions, trades),
    [transactions, trades]
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
      <DrawdownChart series={drawdown} />
      <DrawdownStatsPanel stats={ddStats} />
      <TransactionManager
        transactions={transactions}
        hasStartingBalance={state.hasStartingBalance}
      />
    </div>
  );
}
