// components/dashboard/AccountHeader.tsx

"use client";

import type { AccountState } from "@/lib/types";
import { cn, fmtUsd } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, Coins, Target } from "lucide-react";

export default function AccountHeader({ state }: { state: AccountState }) {
  const pnlSign =
    state.totalPnl > 0 ? "profit" : state.totalPnl < 0 ? "loss" : undefined;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card
        label="Current Balance"
        value={fmtUsd(state.currentBalance)}
        subtitle={
          state.startingBalance > 0
            ? `${(((state.currentBalance - state.startingBalance) / state.startingBalance) * 100).toFixed(2)}% lifetime return`
            : "Set a starting balance to track returns"
        }
        icon={<Wallet className="h-4 w-4" />}
        tone={
          state.currentBalance > state.startingBalance + state.netCashFlow
            ? "profit"
            : state.currentBalance < state.startingBalance + state.netCashFlow
              ? "loss"
              : undefined
        }
      />
      <Card
        label="Starting Capital"
        value={fmtUsd(state.startingBalance)}
        subtitle="One-time seed"
        icon={<Coins className="h-4 w-4" />}
      />
      <Card
        label="Net Cash Flow"
        value={fmtUsd(state.netCashFlow)}
        subtitle={`+${fmtUsd(state.totalDeposits)} in · −${fmtUsd(state.totalWithdrawals)} out`}
        icon={state.netCashFlow >= 0
          ? <TrendingUp className="h-4 w-4" />
          : <TrendingDown className="h-4 w-4" />}
      />
      <Card
        label="Total P&L"
        value={fmtUsd(state.totalPnl)}
        subtitle={
          state.riskPerPart > 0
            ? `Risk / part: ${fmtUsd(state.riskPerPart)} (${state.strategyParts}-part)`
            : "Closed trades only"
        }
        icon={<Target className="h-4 w-4" />}
        tone={pnlSign}
      />
    </div>
  );
}

function Card({
  label,
  value,
  subtitle,
  icon,
  tone,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
          {label}
        </span>
        <span className="text-[color:var(--text-secondary)]">{icon}</span>
      </div>
      <div
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          tone === "profit" && "text-[color:var(--accent-profit)]",
          tone === "loss" && "text-[color:var(--accent-loss)]"
        )}
      >
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">
          {subtitle}
        </div>
      )}
    </div>
  );
}
