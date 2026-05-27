// components/dashboard/AccountHeader.tsx
// Displays the equity composition as visible arithmetic:
//   Starting Capital  +  Net Cash Flow  +  Trade P&L  =  Current Equity

"use client";

import type { AccountState } from "@/lib/types";
import { cn, fmtUsd } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, Coins, Target } from "lucide-react";

export default function AccountHeader({ state }: { state: AccountState }) {
  const pnlTone =
    state.totalPnl > 0 ? "profit" : state.totalPnl < 0 ? "loss" : "neutral";
  const cashFlowTone =
    state.netCashFlow > 0 ? "profit" : state.netCashFlow < 0 ? "loss" : "neutral";
  const baseline = state.startingBalance + state.netCashFlow;
  const equityTone =
    state.currentBalance > baseline
      ? "profit"
      : state.currentBalance < baseline
        ? "loss"
        : "neutral";

  const lifetimeReturnPct =
    state.startingBalance > 0
      ? ((state.currentBalance - baseline) / state.startingBalance) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-[color:var(--border-panel)] bg-[color:var(--bg-panel)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Equity Composition</h3>
        <p className="text-xs text-[color:var(--text-secondary)]">
          How your current account value is built up
        </p>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <Term
          icon={<Coins className="h-4 w-4" />}
          label="Starting Capital"
          value={fmtUsd(state.startingBalance)}
        />
        <Operator>+</Operator>
        <Term
          icon={
            state.netCashFlow >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
          label="Net Cash Flow"
          value={fmtUsd(state.netCashFlow)}
          subtitle={`+${fmtUsd(state.totalDeposits)} in · −${fmtUsd(state.totalWithdrawals)} out`}
          tone={cashFlowTone}
        />
        <Operator>+</Operator>
        <Term
          icon={<Target className="h-4 w-4" />}
          label="Trade P&L"
          value={fmtUsd(state.totalPnl)}
          subtitle="Closed positions"
          tone={pnlTone}
        />
        <Operator>=</Operator>
        <Term
          icon={<Wallet className="h-4 w-4" />}
          label="Current Equity"
          value={fmtUsd(state.currentBalance)}
          subtitle={
            state.startingBalance > 0
              ? `${lifetimeReturnPct >= 0 ? "+" : ""}${lifetimeReturnPct.toFixed(2)}% lifetime`
              : undefined
          }
          tone={equityTone}
          emphasized
        />
      </div>
    </div>
  );
}

function Term({
  icon,
  label,
  value,
  subtitle,
  tone,
  emphasized,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  tone?: "profit" | "loss" | "neutral";
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        emphasized
          ? "border-blue-500/40 bg-blue-500/[0.06]"
          : "border-[color:var(--border-panel)] bg-black/10"
      )}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)]">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-bold tabular-nums",
          emphasized ? "text-xl" : "text-base",
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

function Operator({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center text-2xl font-light text-[color:var(--text-secondary)]">
      {children}
    </div>
  );
}
